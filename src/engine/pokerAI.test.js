import { describe, it, expect } from 'vitest';
import { newPokerGame, startHand, applyAction, legalActions } from './poker.js';
import { preflopStrength, handStrength, casinoDecision, playCasinoTurn } from './pokerAI.js';
import { mulberry32 } from './pokerAI.js';

const c = (rank, suit) => ({ rank, suit, id: rank + suit });

describe('preflopStrength', () => {
  it('AA is stronger than suited connectors', () => {
    expect(preflopStrength([c('A','S'), c('A','H')])).toBeGreaterThan(preflopStrength([c('K','S'), c('Q','H')]));
  });
  it('suited connectors are stronger than offsuit', () => {
    expect(preflopStrength([c('K','S'), c('Q','H')])).toBeGreaterThan(preflopStrength([c('7','C'), c('2','H')]));
  });
  it('pair of 2s is stronger than 7-2 offsuit', () => {
    expect(preflopStrength([c('2','S'), c('2','H')])).toBeGreaterThan(preflopStrength([c('7','C'), c('2','H')]));
  });
  it('preflopStrength result is never above 1', () => {
    expect(preflopStrength([c('A','S'), c('A','H')])).toBeLessThanOrEqual(1);
  });
});

describe('handStrength', () => {
  it('trips gives strength >= 0.8', () => {
    const s = startHand(newPokerGame(), mulberry32(1));
    s.casino.hole = [c('A','S'), c('A','H')];
    s.community = [c('A','D'), c('7','C'), c('2','D')];
    expect(handStrength(s, 'casino')).toBeGreaterThanOrEqual(0.8);
  });
  it('high card hand has strength < 0.4', () => {
    const s = startHand(newPokerGame(), mulberry32(1));
    s.casino.hole = [c('9','S'), c('4','H')];
    s.community = [c('A','D'), c('7','C'), c('2','D')];
    expect(handStrength(s, 'casino')).toBeLessThan(0.4);
  });
});

describe('casinoDecision', () => {
  it('raises with strong hand when rng=0.5', () => {
    const s0 = startHand(newPokerGame(), mulberry32(1));
    const a = applyAction(s0, 'call');
    a.casino.hole = [c('A','S'), c('A','H')];
    const d = casinoDecision(a, () => 0.5);
    expect(d.action).toBe('raise');
    expect(d.amount).toBeGreaterThanOrEqual(legalActions(a).minRaiseTo);
    expect(d.amount).toBeLessThanOrEqual(legalActions(a).maxRaiseTo);
  });
  it('checks with weak hand in big blind when rng=0.5', () => {
    const s0 = startHand(newPokerGame(), mulberry32(1));
    const a = applyAction(s0, 'call');
    a.casino.hole = [c('7','C'), c('2','H')];
    const d = casinoDecision(a, () => 0.5);
    expect(d.action).toBe('check');
  });
  it('folds weak hand facing a big raise when rng=0.5', () => {
    const s0 = startHand(newPokerGame(), mulberry32(1));
    const r = applyAction(s0, 'raise', 400);
    r.casino.hole = [c('7','C'), c('2','H')];
    const d = casinoDecision(r, () => 0.5);
    expect(d.action).toBe('fold');
  });
});

describe('playCasinoTurn', () => {
  it('returns state unchanged when toAct is not casino', () => {
    const s0 = startHand(newPokerGame(), mulberry32(1));
    expect(playCasinoTurn(s0)).toBe(s0);
  });
});

describe('simulation', () => {
  it('completes 100 simulations with chip conservation', () => {
    for (let seed = 1; seed <= 100; seed++) {
      let s = startHand(newPokerGame(), mulberry32(seed));
      const rng = mulberry32(seed + 1000);
      let guard = 0;
      while (s.toAct && guard++ < 200) {
        if (s.toAct === 'casino') {
          s = playCasinoTurn(s, rng);
        } else {
          const la = legalActions(s);
          const pick = la.actions[Math.floor(rng() * la.actions.length)];
          s = applyAction(s, pick, pick === 'raise' ? la.minRaiseTo : 0);
        }
      }
      expect(s.street).toBe('done');
      expect(guard).toBeLessThan(200);
      expect(s.player.chips + s.casino.chips).toBe(2000);
    }
  });
});
