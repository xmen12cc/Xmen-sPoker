import { describe, it, expect } from 'vitest';
import { cardPoints, handValue, isBlackjack, isBust, canSplit, newGame, settle, startRound } from './blackjack.js';
import { createShoe } from './cards.js';

const suits = ['S', 'H', 'D', 'C'];

function makeCard(rank, suit = 'S') {
  return { rank, suit, id: rank + suit };
}

describe('cardPoints', () => {
  it('returns 11 for A', () => {
    expect(cardPoints(makeCard('A'))).toBe(11);
  });
  it('returns 10 for J', () => {
    expect(cardPoints(makeCard('J'))).toBe(10);
  });
  it('returns 10 for Q', () => {
    expect(cardPoints(makeCard('Q'))).toBe(10);
  });
  it('returns 10 for K', () => {
    expect(cardPoints(makeCard('K'))).toBe(10);
  });
  it('returns 10 for 10', () => {
    expect(cardPoints(makeCard('10'))).toBe(10);
  });
  it('returns 5 for 5', () => {
    expect(cardPoints(makeCard('5'))).toBe(5);
  });
});

describe('handValue', () => {
  it('[5,7] total 12 not soft', () => {
    const h = handValue([makeCard('5'), makeCard('7')]);
    expect(h).toEqual({ total: 12, soft: false });
  });
  it('[A,6] 17 soft', () => {
    const h = handValue([makeCard('A'), makeCard('6')]);
    expect(h).toEqual({ total: 17, soft: true });
  });
  it('[A,6,10] 17 not soft', () => {
    const h = handValue([makeCard('A'), makeCard('6'), makeCard('10')]);
    expect(h).toEqual({ total: 17, soft: false });
  });
  it('[A,A] 12 soft', () => {
    const h = handValue([makeCard('A'), makeCard('A')]);
    expect(h).toEqual({ total: 12, soft: true });
  });
  it('[A,A,9] 21 soft', () => {
    const h = handValue([makeCard('A'), makeCard('A'), makeCard('9')]);
    expect(h).toEqual({ total: 21, soft: true });
  });
  it('[A,A,A,8] 21 soft', () => {
    const h = handValue([makeCard('A'), makeCard('A'), makeCard('A'), makeCard('8')]);
    expect(h).toEqual({ total: 21, soft: true });
  });
  it('empty hand total 0', () => {
    const h = handValue([]);
    expect(h).toEqual({ total: 0, soft: false });
  });
  it('[10,5,9] bust total 24', () => {
    const h = handValue([makeCard('10'), makeCard('5'), makeCard('9')]);
    expect(h).toEqual({ total: 24, soft: false });
  });
});

describe('isBlackjack', () => {
  it('isBlackjack([A,K]) true', () => {
    expect(isBlackjack([makeCard('A'), makeCard('K')]));
  });
  it('isBlackjack([A,5,5]) false', () => {
    expect(!isBlackjack([makeCard('A'), makeCard('5'), makeCard('5')]));
  });
  it('isBlackjack([10,5,6]) false', () => {
    expect(!isBlackjack([makeCard('10'), makeCard('5'), makeCard('6')]));
  });
});

describe('isBust', () => {
  it('isBust([10,5,9]) true', () => {
    expect(isBust([makeCard('10'), makeCard('5'), makeCard('9')]));
  });
  it('isBust([A,6]) false', () => {
    expect(!isBust([makeCard('A'), makeCard('6')]));
  });
});

describe('canSplit', () => {
  it('canSplit([8,8]) true', () => {
    expect(canSplit([makeCard('8'), makeCard('8')]));
  });
  it('canSplit([K,Q]) true', () => {
    expect(canSplit([makeCard('K'), makeCard('Q')]));
  });
  it('canSplit([8,9]) false', () => {
    expect(!canSplit([makeCard('8'), makeCard('9')]));
  });
  it('canSplit 3 cards false', () => {
    expect(!canSplit([makeCard('8'), makeCard('8'), makeCard('8')]));
  });
});

describe('round setup', () => {
  const c = (rank, suit = 'S') => ({ rank, suit, id: rank + suit });

  function makeState(shoeCards, bankroll = 1000) {
    let shoe = [];
    for (const c of shoeCards) {
      shoe.push(c);
    }
    while (shoe.length < 20) {
      shoe.push(c('2', 'C'));
    }
    return {
      shoe,
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

  it('newGame has 312-card shoe, bankroll 1000, phase betting', () => {
    const state = newGame();
    expect(state.shoe.length).toBe(312);
    expect(state.bankroll).toBe(1000);
    expect(state.phase).toBe('betting');
  });

  it('startRound deducts bankroll, phase playing, deals player=[shoe[0],shoe[2]] dealer=[shoe[1],shoe[3]]', () => {
    const shoeCards = [c('K', 'H'), c('7', 'D'), c('3', 'S'), c('9', 'C')];
    const state = makeState(shoeCards);
    const newState = startRound(state, 100);
    expect(newState.bankroll).toBe(900);
    expect(newState.phase).toBe('playing');
    expect(newState.player).toEqual([shoeCards[0], shoeCards[2]]);
    expect(newState.dealer).toEqual([shoeCards[1], shoeCards[3]]);
  });

  it('startRound throws on bet 0', () => {
    const state = makeState([]);
    expect(() => startRound(state, 0)).toThrow('Invalid bet');
  });

it('startRound throws on bet > bankroll', () => {
  const state = makeState([]);
  expect(() => startRound(state, 1500)).toThrow('Invalid bet');
});

  it('startRound throws when phase is not betting', () => {
    const state = { ...makeState([]), phase: 'playing' };
    expect(() => startRound(state, 100)).toThrow('Invalid bet');
  });

  it('player blackjack pays 3:2 -> bankroll 1150, result blackjack', () => {
    const shoeCards = [c('A'), c('5'), c('K'), c('6')];
    const state = makeState(shoeCards);
    const newState = startRound(state, 100);
    expect(newState.bankroll).toBe(1150);
    expect(newState.result).toBe('blackjack');
  });

  it('dealer blackjack only -> bankroll 900 result lose', () => {
    const shoeCards = [c('5'), c('A'), c('6'), c('K')];
    const state = makeState(shoeCards);
    const newState = startRound(state, 100);
    expect(newState.bankroll).toBe(900);
    expect(newState.result).toBe('lose');
  });

  it('both blackjack -> bankroll 1000 push', () => {
    const shoeCards = [c('A'), c('A'), c('K'), c('K')];
    const state = makeState(shoeCards);
    const newState = startRound(state, 100);
    expect(newState.bankroll).toBe(1000);
    expect(newState.result).toBe('push');
  });

  it('settle player bust lose', () => {
    const state = {
      shoe: [],
      player: [c('10'), c('9'), c('8')],
      dealer: [c('2'), c('3')],
      bet: 100,
      bankroll: 900,
      phase: 'playing',
      doubled: false,
      result: null,
      payout: 0,
      message: '',
    };
    const result = settle(state);
    expect(result.result).toBe('lose');
    expect(result.payout).toBe(0);
    expect(result.message).toBe('Bust! Dealer wins');
  });

  it('settle dealer bust wins and pays 2x bet', () => {
    const state = {
      shoe: [],
      player: [c('7'), c('7')],
      dealer: [c('A'), c('9'), c('A'), c('A')],
      bet: 100,
      bankroll: 1000,
      phase: 'playing',
      doubled: false,
      result: null,
      payout: 0,
      message: '',
    };
    const result = settle(state);
    expect(result.result).toBe('win');
    expect(result.payout).toBe(200);
    expect(result.bankroll).toBe(1200);
  });

  it('settle higher total wins', () => {
    const state = {
      shoe: [],
      player: [c('10'), c('9')],
      dealer: [c('10'), c('7')],
      bet: 100,
      bankroll: 900,
      phase: 'playing',
      doubled: false,
      result: null,
      payout: 0,
      message: '',
    };
    const result = settle(state);
    expect(result.result).toBe('win');
    expect(result.payout).toBe(200);
    expect(result.bankroll).toBe(1100);
  });

  it('settle equal total push', () => {
    const state = {
      shoe: [],
      player: [c('7'), c('7')],
      dealer: [c('7'), c('7')],
      bet: 100,
      bankroll: 900,
      phase: 'playing',
      doubled: false,
      result: null,
      payout: 0,
      message: '',
    };
    const result = settle(state);
    expect(result.result).toBe('push');
    expect(result.payout).toBe(100);
  });

  it('settle lower total loses', () => {
    const state = {
      shoe: [],
      player: [c('2'), c('2')],
      dealer: [c('7'), c('7')],
      bet: 100,
      bankroll: 900,
      phase: 'playing',
      doubled: false,
      result: null,
      payout: 0,
      message: '',
    };
    const result = settle(state);
    expect(result.result).toBe('lose');
    expect(result.payout).toBe(0);
  });

  it('do not mutate input check', () => {
    const shoeCards = [c('K', 'H'), c('7', 'D'), c('3', 'S'), c('9', 'C')];
    const state = makeState(shoeCards);
    const original = { ...state };
    startRound(state, 100);
    expect(state.phase).toBe('betting');
    expect(state.bet).toBe(0);
    expect(state.bankroll).toBe(1000);
  });

  it('settle both bust is a loss for the player', () => {
    const state = {
      shoe: [],
      player: [c('10'), c('9'), c('5')],
      dealer: [c('10'), c('9'), c('5')],
      bet: 100,
      bankroll: 900,
      phase: 'playing',
      doubled: false,
      result: null,
      payout: 0,
      message: '',
    };
    const result = settle(state);
    expect(result.result).toBe('lose');
    expect(result.payout).toBe(0);
  });
});
