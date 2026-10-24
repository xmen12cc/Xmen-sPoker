import { createDeck, shuffle, draw } from './cards.js';

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
  return {
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
    handNumber: state.handNumber + 1,
  };
}
