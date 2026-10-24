import { createShoe, draw } from './cards.js';

export function cardPoints(card) {
  if (card.rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  return Number(card.rank);
}

export function handValue(cards) {
  if (cards.length === 0) {
    return { total: 0, soft: false };
  }
  let total = 0;
  let acesAs11 = 0;
  for (const card of cards) {
    const p = cardPoints(card);
    total += p;
    if (card.rank === 'A') {
      acesAs11++;
    }
  }
  while (total > 21 && acesAs11 > 0) {
    total -= 10;
    acesAs11--;
  }
  return { total, soft: acesAs11 > 0 };
}

export function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function isBust(cards) {
  return handValue(cards).total > 21;
}

export function canSplit(cards) {
  if (cards.length !== 2) return false;
  const a = cards[0];
  const b = cards[1];
  return cardPoints(a) === cardPoints(b);
}

export function newGame(bankroll = 1000, rng = Math.random) {
  return {
    shoe: createShoe(6, rng),
    player: [],
    dealer: [],
    bet: 0,
    bankroll,
    phase: 'betting',
    doubled: false,
    result: null,
    payout: 0,
    message: '',
  };
}

export function settle(state) {
  const playerHand = state.player;
  const dealerHand = state.dealer;

  const pBust = isBust(playerHand);
  const dBust = isBust(dealerHand);

  if (pBust) {
    return { ...state, phase: 'done', result: 'lose', payout: 0, message: 'Bust! Dealer wins', bankroll: state.bankroll };
  }

  if (dBust) {
    return { ...state, phase: 'done', result: 'win', payout: state.bet * 2, message: 'Dealer busts, you win!', bankroll: state.bankroll + state.bet * 2 };
  }

  if (isBlackjack(playerHand) && isBlackjack(dealerHand)) {
    return { ...state, phase: 'done', result: 'push', payout: state.bet, message: 'Push', bankroll: state.bankroll + state.bet };
  }

  if (isBlackjack(playerHand)) {
    return { ...state, phase: 'done', result: 'blackjack', payout: state.bet + Math.floor(state.bet * 1.5), message: 'Blackjack!', bankroll: state.bankroll + state.bet + Math.floor(state.bet * 1.5) };
  }

  if (isBlackjack(dealerHand)) {
    return { ...state, phase: 'done', result: 'lose', payout: 0, message: 'Dealer blackjack', bankroll: state.bankroll };
  }

  const pTotal = handValue(playerHand).total;
  const dTotal = handValue(dealerHand).total;

  if (pTotal > dTotal) {
    return { ...state, phase: 'done', result: 'win', payout: state.bet * 2, message: 'You win!', bankroll: state.bankroll + state.bet * 2 };
  }

  if (pTotal === dTotal) {
    return { ...state, phase: 'done', result: 'push', payout: state.bet, message: 'Push', bankroll: state.bankroll + state.bet };
  }

  return { ...state, phase: 'done', result: 'lose', payout: 0, message: 'Dealer wins', bankroll: state.bankroll };
}

export function startRound(state, bet) {
  if (state.phase !== 'betting' || bet <= 0 || bet > state.bankroll) {
    throw new Error('Invalid bet');
  }

  let shoe = state.shoe;
  if (state.shoe.length < 20) {
    shoe = createShoe(6);
  }

  const c1 = draw(shoe);
  shoe = c1.deck;
  const c2 = draw(shoe);
  shoe = c2.deck;
  const c3 = draw(shoe);
  shoe = c3.deck;
  const c4 = draw(shoe);

  const newBankroll = state.bankroll - bet;

  const newState = {
    ...state,
    bankroll: newBankroll,
    bet,
    phase: 'playing',
    player: [c1.card, c3.card],
    dealer: [c2.card, c4.card],
    doubled: false,
    result: null,
    payout: 0,
    message: '',
  };

  const pBust = isBust(newState.player);
  const dBust = isBust(newState.dealer);
  const pBlackjack = isBlackjack(newState.player);
  const dBlackjack = isBlackjack(newState.dealer);

  if (pBust || dBust || pBlackjack || dBlackjack) {
    return settle(newState);
  }

  return newState;
}

export function hit(state) {
  if (state.phase !== 'playing') {
    throw new Error('Not playing');
  }
  const d = draw(state.shoe);
  const next = {
    ...state,
    shoe: d.deck,
    player: [...state.player, d.card],
  };
  if (isBust(next.player)) {
    return settle(next);
  }
  if (handValue(next.player).total === 21) {
    return stand(next);
  }
  return next;
}

export function stand(state) {
  if (state.phase !== 'playing') {
    throw new Error('Not playing');
  }
  let s = { ...state };
  while (handValue(s.dealer).total < 17) {
    const d = draw(s.shoe);
    s = {
      ...s,
      shoe: d.deck,
      dealer: [...s.dealer, d.card],
    };
  }
  return settle(s);
}

export function doubleDown(state) {
  if (state.phase !== 'playing' || state.player.length !== 2 || state.bankroll < state.bet) {
    throw new Error('Cannot double');
  }
  const d = draw(state.shoe);
  const next = {
    ...state,
    shoe: d.deck,
    bankroll: state.bankroll - state.bet,
    bet: state.bet * 2,
    doubled: true,
    player: [...state.player, d.card],
  };
  if (isBust(next.player)) {
    return settle(next);
  }
  return stand(next);
}

export function nextRound(state) {
  if (state.phase !== 'done') {
    throw new Error('Round not finished');
  }
  return {
    ...state,
    player: [],
    dealer: [],
    bet: 0,
    phase: 'betting',
    doubled: false,
    result: null,
    payout: 0,
    message: '',
  };
}
