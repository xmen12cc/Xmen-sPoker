import { describe, it, expect } from 'vitest';
import { newPokerGame, startHand, legalActions, applyAction } from './poker.js';
import { mulberry32 } from './pokerAI.js';

function pickAction(state, rng) {
  const la = legalActions(state);
  const r = rng();
  if (la.actions.includes('raise') && r < 0.25) {
    const span = la.maxRaiseTo - la.minRaiseTo;
    const to = r < 0.05 ? la.maxRaiseTo : la.minRaiseTo + Math.floor(rng() * (span + 1));
    return ['raise', to];
  }
  if (r < 0.35) return ['fold', 0];
  return [la.actions.includes('check') ? 'check' : 'call', 0];
}

describe('poker fuzz', () => {
  it('conserves chips and always terminates', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = mulberry32(seed);
      const pc = 100 + Math.floor(rng() * 1900);
      const cc = 100 + Math.floor(rng() * 1900);
      const total = pc + cc;
      let g = newPokerGame(pc, cc);
      const log = [];
      try {
        for (let h = 0; h < 30 && g.player.chips > 0 && g.casino.chips > 0; h++) {
          g = startHand(g, rng);
          let steps = 0;
          while (g.toAct) {
            const [a, amt] = pickAction(g, rng);
            log.push(g.street + ':' + g.toAct + ':' + a + ':' + amt);
            g = applyAction(g, a, amt);
            expect(g.player.chips + g.casino.chips + g.pot).toBe(total);
            expect(g.player.chips).toBeGreaterThanOrEqual(0);
            expect(g.casino.chips).toBeGreaterThanOrEqual(0);
            steps++;
            expect(steps).toBeLessThan(60);
          }
          expect(g.street).toBe('done');
          expect(g.pot).toBe(0);
          expect(g.winner).not.toBeNull();
          expect(g.player.chips + g.casino.chips).toBe(total);
        }
      } catch (e) {
        throw new Error('seed ' + seed + ' failed: ' + e.message + ' | last actions: ' + log.slice(-8).join(', '));
      }
    }
  });
});