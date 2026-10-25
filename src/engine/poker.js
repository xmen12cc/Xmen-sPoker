import { createDeck, shuffle, draw } from './cards.js';
import { evaluateBest, compareHands } from './pokerEval.js';

export const SMALL_BLIND = 10;
export const BIG_BLIND = 20;

export function other(who) {
  return who === 'player' ? 'casino' : 'player';
}

function emptySeat(chips) {
  return { chips, hole: [], bet: 0, totalBet: 0, folded: false, allIn: false };
}

export function newPokerGame(playerChips = 1000, casinoChips = 1000) {
  return {
    deck: [],
    community: [],
    player: emptySeat(playerChips),
    casino: emptySeat(casinoChips),
    pot: 0,
    street: 'idle',
    button: 'casino',
    toAct: null,
    currentBet: 0,
    minRaise: BIG_BLIND,
    acted: { player: false, casino: false },
    winner: null,
    message: 'Place your first hand',
    showdown: null,
    lastAction: null,
    potWon: 0,
    handNumber: 0,
  };
}

export function postBlind(seat, amount) {
  const amt = Math.min(amount, seat.chips);
  return {
    ...seat,
    chips: seat.chips - amt,
    bet: seat.bet + amt,
    totalBet: seat.totalBet + amt,
    allIn: seat.chips - amt === 0,
  };
}

export function startHand(state, rng = Math.random) {
  if (state.player.chips <= 0 || state.casino.chips <= 0) {
    throw new Error('Cannot start hand');
  }
  const button = other(state.button);
  const bigBlind = other(button);
  let deck = shuffle(createDeck(), rng);
  const seats = {
    player: emptySeat(state.player.chips),
    casino: emptySeat(state.casino.chips),
  };
  seats[button] = postBlind(seats[button], SMALL_BLIND);
  seats[bigBlind] = postBlind(seats[bigBlind], BIG_BLIND);
  const holes = { player: [], casino: [] };
  for (const who of [bigBlind, button, bigBlind, button]) {
    const r = draw(deck);
    deck = r.deck;
    holes[who].push(r.card);
  }
  seats.player = { ...seats.player, hole: holes.player };
  seats.casino = { ...seats.casino, hole: holes.casino };
  const next = {
    ...state,
    deck,
    community: [],
    player: seats.player,
    casino: seats.casino,
    pot: seats.player.totalBet + seats.casino.totalBet,
    street: 'preflop',
    button,
    toAct: button,
    currentBet: Math.max(seats.player.bet, seats.casino.bet),
    minRaise: BIG_BLIND,
    acted: { player: false, casino: false },
    winner: null,
    message: '',
    showdown: null,
    lastAction: null,
    potWon: 0,
    handNumber: state.handNumber + 1,
  };
  // An all-in small blind closes the betting: no one can act or raise, so run it out.
  if (seats[button].allIn) return endRound(next);
  return next;
}

function commit(seat, amount) {
  const amt = Math.min(amount, seat.chips);
  return {
    ...seat,
    chips: seat.chips - amt,
    bet: seat.bet + amt,
    totalBet: seat.totalBet + amt,
    allIn: seat.chips - amt === 0,
  };
}

export function legalActions(state) {
  const who = state.toAct;
  if (!who) return { actions: [], toCall: 0, minRaiseTo: 0, maxRaiseTo: 0 };
  const me = state[who];
  const them = state[other(who)];
  const owe = state.currentBet - me.bet;
  const maxRaiseTo = me.bet + me.chips;
  const canRaise = me.chips > owe && !them.allIn;
  const minRaiseTo = Math.min(state.currentBet + state.minRaise, maxRaiseTo);
  const actions = ['fold', owe > 0 ? 'call' : 'check'];
  if (canRaise) actions.push('raise');
  return { actions, toCall: Math.min(owe, me.chips), minRaiseTo, maxRaiseTo };
}

function dealCommunity(state, n) {
  let deck = state.deck;
  const cards = [];
  for (let i = 0; i < n; i++) {
    const r = draw(deck);
    deck = r.deck;
    cards.push(r.card);
  }
  return { ...state, deck, community: [...state.community, ...cards] };
}

function awardFold(state, folder) {
  const winner = other(folder);
  const pot = state.pot;
  const clear = (seat) => ({ ...seat, bet: 0 });
  const seat = { ...clear(state[winner]), chips: state[winner].chips + pot };
  return {
    ...state,
    [winner]: seat,
    [folder]: clear(state[folder]),
    pot: 0,
    street: 'done',
    toAct: null,
    winner,
    message: folder === 'player' ? 'You folded' : 'Casino folds',
    showdown: null,
    lastAction: (folder === 'player' ? 'You fold' : 'Casino folds'),
    potWon: pot,
  };
}

function awardShowdown(state) {
  const p = evaluateBest([...state.player.hole, ...state.community]);
  const c = evaluateBest([...state.casino.hole, ...state.community]);
  const cmp = compareHands(p, c);
  const pot = state.pot;
  const player = { ...state.player };
  const casino = { ...state.casino };
  let winner;
  let message;
  if (cmp > 0) {
    player.chips += pot;
    winner = 'player';
    message = 'You win with ' + p.name;
  } else if (cmp < 0) {
    casino.chips += pot;
    winner = 'casino';
    message = 'Casino wins with ' + c.name;
  } else {
    const half = Math.floor(pot / 2);
    player.chips += half;
    casino.chips += pot - half;
    winner = 'tie';
    message = 'Split pot (' + p.name + ')';
  }
  return {
    ...state,
    player,
    casino,
    pot: 0,
    street: 'done',
    toAct: null,
    winner,
    message,
    showdown: { player: p, casino: c, amount: pot },
    potWon: pot,
  };
}

function endRound(state) {
  const player = { ...state.player };
  const casino = { ...state.casino };
  if (player.bet !== casino.bet) {
    const big = player.bet > casino.bet ? player : casino;
    const diff = Math.abs(player.bet - casino.bet);
    big.chips += diff;
    big.bet -= diff;
    big.totalBet -= diff;
  }
  const pot = player.totalBet + casino.totalBet;
  player.bet = 0;
  casino.bet = 0;
  let s = {
    ...state,
    player,
    casino,
    pot,
    currentBet: 0,
    minRaise: BIG_BLIND,
    acted: { player: false, casino: false },
  };
  if (player.allIn || casino.allIn || s.street === 'river') {
    s = dealCommunity(s, 5 - s.community.length);
    return awardShowdown({ ...s, street: 'showdown' });
  }
  const next = { preflop: ['flop', 3], flop: ['turn', 1], turn: ['river', 1] }[s.street];
  s = dealCommunity(s, next[1]);
  return { ...s, street: next[0], toAct: other(s.button) };
}

export function applyAction(state, action, amount = 0) {
  if (!state.toAct) throw new Error('No action allowed');
  const who = state.toAct;
  const opp = other(who);
  let me = { ...state[who] };
  const them = { ...state[opp] };
  let currentBet = state.currentBet;
  let minRaise = state.minRaise;
  const acted = { ...state.acted, [who]: true };
  const owe = currentBet - me.bet;
  const name = who === 'player' ? 'You' : 'Casino';
  if (action === 'fold') {
    return awardFold({ ...state, [who]: { ...me, folded: true } }, who);
  }
  let lastAction;
  if (action === 'check') {
    if (owe > 0) throw new Error('Cannot check');
    lastAction = name + ' checks';
  } else if (action === 'call') {
    if (owe <= 0) throw new Error('Nothing to call');
    lastAction = name + ' calls $' + Math.min(owe, me.chips);
    me = commit(me, owe);
  } else if (action === 'raise') {
    const limit = me.bet + me.chips;
    const to = Math.min(amount, limit);
    if (them.allIn) throw new Error('Cannot raise');
    if (to <= currentBet) throw new Error('Raise too small');
    if (to < currentBet + minRaise && to !== limit) throw new Error('Raise too small');
    minRaise = Math.max(minRaise, to - currentBet);
    currentBet = to;
    me = commit(me, to - me.bet);
    acted[opp] = false;
    lastAction = name + (to === limit
      ? (who === 'player' ? ' are all in for $' : ' is all in for $') + to
      : ' raises to $' + to);
  } else {
    throw new Error('Unknown action');
  }
  const next = { ...state, [who]: me, [opp]: them, currentBet, minRaise, acted, lastAction };
  next.pot = me.totalBet + them.totalBet;
  const done =
    (me.allIn || acted[who]) &&
    (them.allIn || acted[opp]) &&
    (me.bet === them.bet || me.allIn || them.allIn);
  if (done) return endRound(next);
  return { ...next, toAct: opp };
}
