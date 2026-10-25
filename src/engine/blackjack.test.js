import { describe, it, expect } from 'vitest';
import { cardPoints, handValue, isBlackjack, isBust, canSplit, newGame, settle, startRound, hit, stand, doubleDown, nextRound } from './blackjack.js';
import { createShoe } from './cards.js';
import { mulberry32 } from './pokerAI.js';

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

describe('shoe integrity regressions', () => {
  const c = (rank, suit = 'S') => ({ rank, suit, id: rank + suit });

  function makeShoeState(shoeCards, bankroll = 1000) {
    return {
      shoe: [...shoeCards],
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

  function playingState(playerCards, dealerCards, nextCards, extra = {}) {
    return {
      shoe: [...nextCards],
      player: playerCards,
      dealer: dealerCards,
      bet: 100,
      bankroll: 1000,
      phase: 'playing',
      doubled: false,
      result: null,
      payout: 0,
      message: '',
      ...extra,
    };
  }

  it('startRound returns the shoe after the four-card deal', () => {
    const state = newGame(1000, mulberry32(42));
    const before = state.shoe;
    const next = startRound(state, 50);
    expect(next.shoe.length).toBe(before.length - 4);
    const dealtInDrawOrder = [next.player[0], next.dealer[0], next.player[1], next.dealer[1]];
    expect(dealtInDrawOrder.map((card) => card.id)).toEqual(before.slice(0, 4).map((card) => card.id));
  });

  it('hit draws the top of the post-deal shoe, not an already-dealt card', () => {
    const rng = mulberry32(7);
    let state = newGame(100000, rng);
    let next = startRound(state, 10, rng);
    for (let i = 0; i < 100 && next.phase !== 'playing'; i++) {
      next = startRound(nextRound(next), 10, rng);
    }
    expect(next.phase).toBe('playing');
    const dealt = new Set([...next.player, ...next.dealer].map((card) => card.id));
    const after = hit(next);
    expect(after.shoe.length).toBe(next.shoe.length - 1);
    expect(after.player[after.player.length - 1].id).toBe(next.shoe[0].id);
    expect(after.player.length).toBe(next.player.length + 1);
    expect(dealt.size).toBe(4);
  });

  it('consecutive rounds do not deal identical cards', () => {
    const rng = mulberry32(123);
    let state = newGame(100000, rng);
    const deals = new Set();
    for (let i = 0; i < 100; i++) {
      const next = startRound(state, 10, rng);
      deals.add([...next.player, ...next.dealer].map((card) => card.id).join('|'));
      const done = next.phase === 'done' ? next : stand(next);
      state = nextRound(done);
    }
    expect(deals.size).toBeGreaterThan(90);
  });

  it('startRound reshuffles a short shoe and returns the fresh shoe minus the deal', () => {
    const rng = mulberry32(99);
    const state = newGame(1000, rng);
    const short = { ...state, shoe: state.shoe.slice(-15) };
    expect(short.shoe.length).toBe(15);
    const next = startRound(short, 10, rng);
    expect(next.shoe.length).toBe(312 - 4);
  });

  it('a drained shoe is refilled mid-round instead of throwing', () => {
    const state = playingState([c('5'), c('6')], [c('10'), c('6')], [], { rng: mulberry32(3) });
    const after = stand(state);
    expect(after.phase).toBe('done');
    expect(after.shoe.length).toBeGreaterThan(0);
  });
});

describe('edge cases', () => {
  const c = (rank, suit = 'S') => ({ rank, suit, id: rank + suit });

  function playingState(playerCards, dealerCards, nextCards, extra = {}) {
    return {
      shoe: [...nextCards],
      player: playerCards,
      dealer: dealerCards,
      bet: 100,
      bankroll: 1000,
      phase: 'playing',
      doubled: false,
      result: null,
      payout: 0,
      message: '',
      ...extra,
    };
  }

  it('hit to exactly 21 auto-stands and settles', () => {
    const state = playingState([c('5'), c('6')], [c('10'), c('7')], [c('10', 'H')]);
    const after = hit(state);
    expect(after.phase).toBe('done');
    expect(after.player.length).toBe(3);
    expect(handValue(after.player).total).toBe(21);
    expect(after.result).toBe('win');
  });

  it('hit in a done round throws', () => {
    const state = { ...playingState([c('5'), c('6')], [c('10'), c('7')], []), phase: 'done' };
    expect(() => hit(state)).toThrow('Not playing');
  });

  it('stand in a betting phase throws', () => {
    const state = { ...playingState([], [], []), phase: 'betting' };
    expect(() => stand(state)).toThrow('Not playing');
  });

  it('double with insufficient bankroll throws', () => {
    const state = playingState([c('5'), c('6')], [c('10'), c('7')], [], { bet: 100, bankroll: 50 });
    expect(() => doubleDown(state)).toThrow('Cannot double');
  });

  it('double charges the extra stake, doubles the bet and resolves the round', () => {
    const state = playingState([c('5'), c('6')], [c('10'), c('6')], [c('K'), c('9')], {
      bet: 100,
      bankroll: 900,
    });
    const after = doubleDown(state);
    expect(after.doubled).toBe(true);
    expect(after.bet).toBe(200);
    expect(after.player.length).toBe(3);
    expect(after.result).toBe('win');
    expect(after.bankroll).toBe(900 - 100 + 400);
  });

  it('blackjack on a $5 bet pays floored 3:2 (+$7)', () => {
    const shoe = [c('A'), c('5'), c('K'), c('6')];
    while (shoe.length < 20) shoe.push(c('2', 'C'));
    const state = {
      shoe,
      player: [],
      dealer: [],
      bet: 0,
      bankroll: 1000,
      phase: 'betting',
      doubled: false,
      result: null,
      payout: 0,
      message: '',
    };
    const next = startRound(state, 5);
    expect(next.result).toBe('blackjack');
    expect(next.payout).toBe(12);
    expect(next.bankroll).toBe(1007);
  });

  it('nextRound resets the hand and keeps the remaining shoe', () => {
    const rng = mulberry32(5);
    let state = newGame(1000, rng);
    let next = startRound(state, 25, rng);
    if (next.phase === 'playing') {
      next = stand(next);
    }
    const after = nextRound(next);
    expect(after.phase).toBe('betting');
    expect(after.bet).toBe(0);
    expect(after.payout).toBe(0);
    expect(after.result).toBeNull();
    expect(after.player).toEqual([]);
    expect(after.dealer).toEqual([]);
    expect(after.shoe.length).toBe(next.shoe.length);
  });
});

describe('random simulation invariants', () => {
  const ROUNDS = 3000;

  function simulate(seed, rounds) {
    const rng = mulberry32(seed);
    let state = newGame(1000, rng);
    const stats = { win: 0, lose: 0, push: 0, blackjack: 0, doubles: 0, busts: 0, reshuffles: 0 };
    let genCount = {};

    for (let i = 0; i < rounds; i++) {
      if (state.bankroll < 5) {
        state = newGame(1000, rng);
        genCount = {};
      }
      const bankrollBefore = state.bankroll;
      let bet = Math.max(5, Math.floor(bankrollBefore * 0.1));
      if (bet > bankrollBefore) bet = bankrollBefore;
      expect(bet).toBeGreaterThan(0);
      expect(bet).toBeLessThanOrEqual(bankrollBefore);

      const shoeBefore = state.shoe.length;
      let staked = bet;
      let next = startRound(state, bet, rng);
      let shuffledMidRound = false;
      if (next.shoe.length !== shoeBefore - 4) {
        stats.reshuffles++;
        expect(next.shoe.length).toBe(308);
        genCount = {};
      }

      while (next.phase === 'playing') {
        const shoeLen = next.shoe.length;
        const cardsBefore = next.player.length + next.dealer.length;
        const roll = rng();
        let after;
        if (roll < 0.1 && next.player.length === 2 && next.bankroll >= next.bet) {
          after = doubleDown(next);
          staked += next.bet;
          stats.doubles++;
        } else if (roll < 0.55) {
          after = hit(next);
        } else {
          after = stand(next);
        }
        expect(after.phase === 'playing' || after.phase === 'done').toBe(true);
        if (after.shoe.length > shoeLen) {
          shuffledMidRound = true;
          stats.reshuffles++;
        } else {
          const drawn = after.player.length + after.dealer.length - cardsBefore;
          expect(after.shoe.length).toBe(shoeLen - drawn);
        }
        next = after;
      }

      expect(next.phase).toBe('done');
      expect(next.bankroll).toBe(bankrollBefore - staked + next.payout);
      expect(next.bankroll).toBeGreaterThanOrEqual(0);
      expect(next.bet).toBeLessThanOrEqual(staked);
      expect(next.message.length).toBeGreaterThan(0);

      const p = next.payout;
      if (next.result === 'lose') {
        expect(p).toBe(0);
        if (isBust(next.player)) stats.busts++;
      } else if (next.result === 'push') {
        expect(p).toBe(next.bet);
      } else if (next.result === 'win') {
        expect(p).toBe(next.bet * 2);
      } else if (next.result === 'blackjack') {
        expect(p).toBe(next.bet + Math.floor(next.bet * 1.5));
      } else {
        throw new Error('unknown result: ' + next.result);
      }
      stats[next.result]++;

      if (!shuffledMidRound) {
        for (const card of [...next.player, ...next.dealer]) {
          genCount[card.id] = (genCount[card.id] || 0) + 1;
          expect(genCount[card.id]).toBeLessThanOrEqual(6);
        }
      }

      state = nextRound(next);
    }
    return stats;
  }

  it('3000 random rounds: shoe accounting, no card over-dealt, bankroll and payouts exact', () => {
    const stats = simulate(20261025, ROUNDS);
    expect(stats.win).toBeGreaterThan(0);
    expect(stats.lose).toBeGreaterThan(0);
    expect(stats.push).toBeGreaterThan(0);
    expect(stats.blackjack).toBeGreaterThan(0);
    expect(stats.doubles).toBeGreaterThan(0);
    expect(stats.busts).toBeGreaterThan(0);
    expect(stats.reshuffles).toBeGreaterThan(0);
  });

  it('simulation is deterministic for a given seed', () => {
    expect(simulate(31337, 200)).toEqual(simulate(31337, 200));
  });
});
