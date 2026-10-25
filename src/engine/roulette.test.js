import { describe, it, expect, beforeEach } from 'vitest';
import {
  WHEEL_ORDER,
  RED_NUMBERS,
  colorOf,
  spin,
  BET_TYPES,
  PAYOUT_ODDS,
  isWinningBet,
  betReturn,
  newRouletteGame,
  placeBet,
  clearBets,
  resolveRound,
  nextRoulette,
} from './roulette.js';

describe('WHEEL_ORDER', () => {
  it('has 37 unique numbers', () => {
    expect(WHEEL_ORDER.length).toBe(37);
    const seen = new Set();
    for (let i = 0; i < WHEEL_ORDER.length; i++) {
      const n = WHEEL_ORDER[i];
      expect(seen.has(n)).toBe(false);
      seen.add(n);
    }
  });

  it('covers 0..36 when sorted', () => {
    const sorted = [...WHEEL_ORDER].sort((a, b) => a - b);
    expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]);
  });

  it('starts with 0', () => {
    expect(WHEEL_ORDER[0]).toBe(0);
  });
});

describe('RED_NUMBERS', () => {
  it('has 18 entries', () => {
    expect(RED_NUMBERS.length).toBe(18);
  });

  it('contains 1, 3, 32, 36', () => {
    expect(RED_NUMBERS).toContain(1);
    expect(RED_NUMBERS).toContain(3);
    expect(RED_NUMBERS).toContain(32);
    expect(RED_NUMBERS).toContain(36);
  });
});

describe('colorOf', () => {
  it('gives green for 0', () => {
    expect(colorOf(0)).toBe('green');
  });

  it('gives red for 1', () => {
    expect(colorOf(1)).toBe('red');
  });

  it('gives red for 3', () => {
    expect(colorOf(3)).toBe('red');
  });

  it('gives red for 32', () => {
    expect(colorOf(32)).toBe('red');
  });

  it('gives red for 36', () => {
    expect(colorOf(36)).toBe('red');
  });

  it('gives black for 2', () => {
    expect(colorOf(2)).toBe('black');
  });

  it('gives black for 4', () => {
    expect(colorOf(4)).toBe('black');
  });

  it('gives black for 26', () => {
    expect(colorOf(26)).toBe('black');
  });

  it('gives black for 35', () => {
    expect(colorOf(35)).toBe('black');
  });

  it('exactly 18 red and 18 black among 1..36', () => {
    let redCount = 0;
    let blackCount = 0;
    for (let n = 1; n <= 36; n++) {
      const c = colorOf(n);
      if (c === 'red') {
        redCount++;
      } else if (c === 'black') {
        blackCount++;
      }
    }
    expect(redCount).toBe(18);
    expect(blackCount).toBe(18);
  });
});

describe('spin', () => {
  it('rng returning 0 gives 0', () => {
    const rng = () => 0;
    expect(spin(rng)).toBe(0);
  });

  it('rng returning 0.999999 gives 36', () => {
    const rng = () => 0.999999;
    expect(spin(rng)).toBe(36);
  });

  it('over 500 draws every result is an integer 0..36', () => {
    const rng = () => Math.random();
    let allIntegers = true;
    for (let i = 0; i < 500; i++) {
      const r = spin(rng);
      if (r < 0 || r > 36) {
        allIntegers = false;
        break;
      }
    }
    expect(allIntegers).toBe(true);
  });
});

describe('BET_TYPES', () => {
  it('has all expected types', () => {
    expect(BET_TYPES).toEqual({
      straight: 'straight',
      red: 'red',
      black: 'black',
      odd: 'odd',
      even: 'even',
      low: 'low',
      high: 'high',
      dozen: 'dozen',
      column: 'column',
    });
  });
});

describe('PAYOUT_ODDS', () => {
  it('has correct payout odds', () => {
    expect(PAYOUT_ODDS).toEqual({
      straight: 35,
      red: 1,
      black: 1,
      odd: 1,
      even: 1,
      low: 1,
      high: 1,
      dozen: 2,
      column: 2,
    });
  });
});

describe('isWinningBet', () => {
  let state;

  beforeEach(() => {
    state = newRouletteGame();
  });

  describe('straight', () => {
    it('straight hit on 7', () => {
      const bet = { type: 'straight', value: 7, amount: 10 };
      expect(isWinningBet(bet, 7)).toBe(true);
    });

    it('straight miss on 7', () => {
      const bet = { type: 'straight', value: 7, amount: 10 };
      expect(isWinningBet(bet, 3)).toBe(false);
    });

    it('straight on 0', () => {
      const bet = { type: 'straight', value: 0, amount: 10 };
      expect(isWinningBet(bet, 0)).toBe(true);
    });
  });

  describe('red', () => {
    it('red bet wins on 1', () => {
      const bet = { type: 'red', value: 1, amount: 10 };
      expect(isWinningBet(bet, 1)).toBe(true);
    });

    it('red bet loses on 0', () => {
      const bet = { type: 'red', value: 1, amount: 10 };
      expect(isWinningBet(bet, 0)).toBe(false);
    });
  });

  describe('black', () => {
    it('black bet wins on 2', () => {
      const bet = { type: 'black', value: 2, amount: 10 };
      expect(isWinningBet(bet, 2)).toBe(true);
    });

    it('black bet loses on 1', () => {
      const bet = { type: 'black', value: 2, amount: 10 };
      expect(isWinningBet(bet, 1)).toBe(false);
    });
  });

  describe('odd', () => {
    it('odd bet wins on 3', () => {
      const bet = { type: 'odd', value: 3, amount: 10 };
      expect(isWinningBet(bet, 3)).toBe(true);
    });

    it('odd bet loses on 0', () => {
      const bet = { type: 'odd', value: 3, amount: 10 };
      expect(isWinningBet(bet, 0)).toBe(false);
    });
  });

  describe('even', () => {
    it('even bet wins on 2', () => {
      const bet = { type: 'even', value: 2, amount: 10 };
      expect(isWinningBet(bet, 2)).toBe(true);
    });

    it('even bet loses on 0', () => {
      const bet = { type: 'even', value: 2, amount: 10 };
      expect(isWinningBet(bet, 0)).toBe(false);
    });
  });

  describe('low', () => {
    it('low bet wins on 1', () => {
      const bet = { type: 'low', value: 1, amount: 10 };
      expect(isWinningBet(bet, 1)).toBe(true);
    });

    it('low bet loses on 0', () => {
      const bet = { type: 'low', value: 1, amount: 10 };
      expect(isWinningBet(bet, 0)).toBe(false);
    });

    it('low bet wins on 18', () => {
      const bet = { type: 'low', value: 1, amount: 10 };
      expect(isWinningBet(bet, 18)).toBe(true);
    });

    it('low bet loses on 19', () => {
      const bet = { type: 'low', value: 1, amount: 10 };
      expect(isWinningBet(bet, 19)).toBe(false);
    });
  });

  describe('high', () => {
    it('high bet wins on 19', () => {
      const bet = { type: 'high', value: 19, amount: 10 };
      expect(isWinningBet(bet, 19)).toBe(true);
    });

    it('high bet loses on 0', () => {
      const bet = { type: 'high', value: 19, amount: 10 };
      expect(isWinningBet(bet, 0)).toBe(false);
    });

    it('high bet loses on 18', () => {
      const bet = { type: 'high', value: 19, amount: 10 };
      expect(isWinningBet(bet, 18)).toBe(false);
    });
  });

  describe('dozen', () => {
    it('dozen1 wins on 1', () => {
      const bet = { type: 'dozen', value: 1, amount: 10 };
      expect(isWinningBet(bet, 1)).toBe(true);
    });

    it('dozen1 wins on 12', () => {
      const bet = { type: 'dozen', value: 1, amount: 10 };
      expect(isWinningBet(bet, 12)).toBe(true);
    });

    it('dozen1 loses on 13', () => {
      const bet = { type: 'dozen', value: 1, amount: 10 };
      expect(isWinningBet(bet, 13)).toBe(false);
    });

    it('dozen1 loses on 24', () => {
      const bet = { type: 'dozen', value: 1, amount: 10 };
      expect(isWinningBet(bet, 24)).toBe(false);
    });

    it('dozen1 loses on 36', () => {
      const bet = { type: 'dozen', value: 1, amount: 10 };
      expect(isWinningBet(bet, 36)).toBe(false);
    });

    it('dozen2 wins on 13', () => {
      const bet = { type: 'dozen', value: 2, amount: 10 };
      expect(isWinningBet(bet, 13)).toBe(true);
    });

    it('dozen2 wins on 24', () => {
      const bet = { type: 'dozen', value: 2, amount: 10 };
      expect(isWinningBet(bet, 24)).toBe(true);
    });

    it('dozen2 loses on 1', () => {
      const bet = { type: 'dozen', value: 2, amount: 10 };
      expect(isWinningBet(bet, 1)).toBe(false);
    });

    it('dozen2 loses on 25', () => {
      const bet = { type: 'dozen', value: 2, amount: 10 };
      expect(isWinningBet(bet, 25)).toBe(false);
    });

    it('dozen2 loses on 36', () => {
      const bet = { type: 'dozen', value: 2, amount: 10 };
      expect(isWinningBet(bet, 36)).toBe(false);
    });

    it('dozen3 wins on 25', () => {
      const bet = { type: 'dozen', value: 3, amount: 10 };
      expect(isWinningBet(bet, 25)).toBe(true);
    });

    it('dozen3 wins on 36', () => {
      const bet = { type: 'dozen', value: 3, amount: 10 };
      expect(isWinningBet(bet, 36)).toBe(true);
    });

    it('dozen3 loses on 1', () => {
      const bet = { type: 'dozen', value: 3, amount: 10 };
      expect(isWinningBet(bet, 1)).toBe(false);
    });

    it('dozen3 loses on 12', () => {
      const bet = { type: 'dozen', value: 3, amount: 10 };
      expect(isWinningBet(bet, 12)).toBe(false);
    });

    it('dozen3 loses on 24', () => {
      const bet = { type: 'dozen', value: 3, amount: 10 };
      expect(isWinningBet(bet, 24)).toBe(false);
    });
  });

  describe('column', () => {
    it('column1 wins on 1', () => {
      const bet = { type: 'column', value: 1, amount: 10 };
      expect(isWinningBet(bet, 1)).toBe(true);
    });

    it('column1 wins on 34', () => {
      const bet = { type: 'column', value: 1, amount: 10 };
      expect(isWinningBet(bet, 34)).toBe(true);
    });

    it('column1 loses on 2', () => {
      const bet = { type: 'column', value: 1, amount: 10 };
      expect(isWinningBet(bet, 2)).toBe(false);
    });

    it('column1 loses on 35', () => {
      const bet = { type: 'column', value: 1, amount: 10 };
      expect(isWinningBet(bet, 35)).toBe(false);
    });

    it('column2 wins on 2', () => {
      const bet = { type: 'column', value: 2, amount: 10 };
      expect(isWinningBet(bet, 2)).toBe(true);
    });

    it('column2 wins on 35', () => {
      const bet = { type: 'column', value: 2, amount: 10 };
      expect(isWinningBet(bet, 35)).toBe(true);
    });

    it('column2 loses on 1', () => {
      const bet = { type: 'column', value: 2, amount: 10 };
      expect(isWinningBet(bet, 1)).toBe(false);
    });

    it('column2 loses on 34', () => {
      const bet = { type: 'column', value: 2, amount: 10 };
      expect(isWinningBet(bet, 34)).toBe(false);
    });

    it('column3 wins on 3', () => {
      const bet = { type: 'column', value: 3, amount: 10 };
      expect(isWinningBet(bet, 3)).toBe(true);
    });

    it('column3 wins on 36', () => {
      const bet = { type: 'column', value: 3, amount: 10 };
      expect(isWinningBet(bet, 36)).toBe(true);
    });

    it('column3 loses on 1', () => {
      const bet = { type: 'column', value: 3, amount: 10 };
      expect(isWinningBet(bet, 1)).toBe(false);
    });

    it('column3 loses on 2', () => {
      const bet = { type: 'column', value: 3, amount: 10 };
      expect(isWinningBet(bet, 2)).toBe(false);
    });

    it('column3 loses on 34', () => {
      const bet = { type: 'column', value: 3, amount: 10 };
      expect(isWinningBet(bet, 34)).toBe(false);
    });
  });

  it('0 loses every non-straight bet', () => {
    const redBet = { type: 'red', value: 1, amount: 10 };
    expect(isWinningBet(redBet, 0)).toBe(false);
    const oddBet = { type: 'odd', value: 3, amount: 10 };
    expect(isWinningBet(oddBet, 0)).toBe(false);
    const evenBet = { type: 'even', value: 2, amount: 10 };
    expect(isWinningBet(evenBet, 0)).toBe(false);
    const lowBet = { type: 'low', value: 1, amount: 10 };
    expect(isWinningBet(lowBet, 0)).toBe(false);
    const highBet = { type: 'high', value: 19, amount: 10 };
    expect(isWinningBet(highBet, 0)).toBe(false);
    const dozen1Bet = { type: 'dozen', value: 1, amount: 10 };
    expect(isWinningBet(dozen1Bet, 0)).toBe(false);
    const dozen2Bet = { type: 'dozen', value: 2, amount: 10 };
    expect(isWinningBet(dozen2Bet, 0)).toBe(false);
    const dozen3Bet = { type: 'dozen', value: 3, amount: 10 };
    expect(isWinningBet(dozen3Bet, 0)).toBe(false);
    const col1Bet = { type: 'column', value: 1, amount: 10 };
    expect(isWinningBet(col1Bet, 0)).toBe(false);
    const col2Bet = { type: 'column', value: 2, amount: 10 };
    expect(isWinningBet(col2Bet, 0)).toBe(false);
    const col3Bet = { type: 'column', value: 3, amount: 10 };
    expect(isWinningBet(col3Bet, 0)).toBe(false);
  });
});

describe('betReturn', () => {
  let state;

  beforeEach(() => {
    state = newRouletteGame();
  });

  it('straight 10 hitting returns 360', () => {
    const bet = { type: 'straight', value: 17, amount: 10 };
    const result = betReturn(bet, 17);
    expect(result).toBe(360);
  });

  it('red 10 winning returns 20', () => {
    const bet = { type: 'red', value: 1, amount: 10 };
    const result = betReturn(bet, 1);
    expect(result).toBe(20);
  });

  it('dozen 2 amount 10 winning returns 30', () => {
    const bet = { type: 'dozen', value: 2, amount: 10 };
    const result = betReturn(bet, 13);
    expect(result).toBe(30);
  });

  it('column 1 amount 10 winning returns 30', () => {
    const bet = { type: 'column', value: 1, amount: 10 };
    const result = betReturn(bet, 34);
    expect(result).toBe(30);
  });

  it('any losing bet returns the stake (not zero)', () => {
    const bet = { type: 'red', value: 1, amount: 10 };
    const result = betReturn(bet, 3);
    // 3 is a red number, so this bet wins (betReturn returns amount*(odds+1) = 10*2 = 20)
    expect(result).toBe(20);
  });

  it('a losing bet on a non-winning number returns 0', () => {
    const bet = { type: 'red', value: 1, amount: 10 };
    const result = betReturn(bet, 2);
    expect(result).toBe(0);
  });
});

describe('placeBet', () => {
  let state;

  beforeEach(() => {
    state = newRouletteGame();
  });

  it('newRouletteGame defaults to 1000', () => {
    const game = newRouletteGame();
    expect(game.bankroll).toBe(1000);
  });

  it('placeBet reduces the bankroll and adds the bet', () => {
    state = placeBet(state, 'straight', 7, 100);
    expect(state.bankroll).toBe(900);
  });

  it('the same type and value merges into one entry with summed amount', () => {
    state = placeBet(state, 'straight', 7, 100);
    state = placeBet(state, 'straight', 7, 50);
    expect(state.bets.length).toBe(1);
    expect(state.bets[0].amount).toBe(150);
  });

  it('the original state object is not mutated', () => {
    const originalBankroll = state.bankroll;
    const originalBets = JSON.stringify(state.bets);
    state = placeBet(state, 'straight', 7, 100);
    expect(state.bankroll).toBe(originalBankroll - 100);
    expect(JSON.stringify(state.bets)).not.toBe(originalBets);
  });

  it('placeBet throws for amount 0', () => {
    expect(() => {
      state = placeBet(state, 'straight', 7, 0);
    }).toThrow();
  });

  it('placeBet throws for amount above the bankroll', () => {
    expect(() => {
      state = placeBet(state, 'straight', 7, 1001);
    }).toThrow();
  });

  it('placeBet throws when phase is not betting', () => {
    state = newRouletteGame();
    state = placeBet(state, 'straight', 7, 10);
    state = resolveRound(state, 7);
    expect(() => {
      state = placeBet(state, 'straight', 7, 10);
    }).toThrow('Not in betting phase');
  });

  it('clearBets refunds everything', () => {
    state = placeBet(state, 'straight', 100, 7);
    state = placeBet(state, 'red', 50, 1);
    state = clearBets(state);
    expect(state.bankroll).toBe(1000);
    expect(state.bets.length).toBe(0);
  });

  it('clearBets throws when not in betting phase', () => {
    state = newRouletteGame();
    state = placeBet(state, 'straight', 7, 10);
    state = resolveRound(state, 7);
    expect(() => {
      state = clearBets(state);
    }).toThrow('Not in betting phase');
  });

  it('resolveRound throws with no bets', () => {
    state = newRouletteGame();
    expect(() => {
      state = resolveRound(state, 7);
    }).toThrow('No bets placed');
  });

  it('resolving red 100 plus straight 7 amount 5 on number 7 leaves bankroll 1275, lastNet 275, phase done, lastNumber 7 and a message mentioning win', () => {
    state = placeBet(state, 'red', 1, 100);
    state = placeBet(state, 'straight', 7, 5);
    state = resolveRound(state, 7);
    expect(state.bankroll).toBe(1275);
    expect(state.lastNet).toBe(275);
    expect(state.phase).toBe('done');
    expect(state.lastNumber).toBe(7);
    expect(state.history[0]).toBe(7);
    expect(state.message).toContain('win');
  });

  it('a losing round red 100 resolved on 0 leaves bankroll 900, lastNet -100 and a message mentioning lose', () => {
    state = placeBet(state, 'red', 1, 100);
    state = resolveRound(state, 0);
    expect(state.bankroll).toBe(900);
    expect(state.lastNet).toBe(-100);
    expect(state.phase).toBe('done');
    expect(state.history[0]).toBe(0);
    expect(state.message).toContain('lose');
  });

  it('history keeps newest first', () => {
    state = newRouletteGame();
    state = placeBet(state, 'straight', 10, 7);
    state = resolveRound(state, 7);
    state = nextRoulette(state);
    state = placeBet(state, 'red', 10, 1);
    state = resolveRound(state, 1);
    state = nextRoulette(state);
    expect(state.history[0]).toBe(1);
    expect(state.history[1]).toBe(7);
  });

  it('history is capped at 12 after 15 resolved rounds', () => {
    state = newRouletteGame();
    for (let i = 0; i < 15; i++) {
      if (i > 0) {
        state = nextRoulette(state);
      }
      state = placeBet(state, 'straight', (i + 1) % 37, 10);
      state = resolveRound(state, (i + 1) % 37);
    }
    expect(state.history.length).toBe(12);
  });

  it('nextRoulette throws when phase is not done', () => {
    state = newRouletteGame();
    expect(() => {
      nextRoulette(state);
    }).toThrow('Round not finished');
  });

  it('nextRoulette otherwise returns phase betting, empty bets and lastNet 0', () => {
    state = newRouletteGame();
    state = placeBet(state, 'straight', 7, 10);
    state = resolveRound(state, 7);
    const result = nextRoulette(state);
    expect(result.phase).toBe('betting');
    expect(result.bets.length).toBe(0);
    expect(result.lastNet).toBe(0);
  });
});
