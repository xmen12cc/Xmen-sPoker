import { legalActions, applyAction, BIG_BLIND } from './poker.js';
import { evaluateBest } from './pokerEval.js';
import { rankValue } from './cards.js';

const CATEGORY_STRENGTH = [0.25, 0.5, 0.7, 0.8, 0.85, 0.9, 0.95, 0.98, 1, 1];

export function preflopStrength(hole) {
  const a = rankValue(hole[0].rank);
  const b = rankValue(hole[1].rank);
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  if (a === b) return 0.6 + (a / 14) * 0.4;
  let score = ((high + low) / 28) * 0.6;
  if (hole[0].suit === hole[1].suit) score += 0.08;
  if (high - low <= 2) score += 0.05;
  return Math.min(score, 0.95);
}

export function handStrength(state, who) {
  const seat = state[who];
  if (state.community.length === 0) return preflopStrength(seat.hole);
  const ev = evaluateBest([...seat.hole, ...state.community]);
  let s = CATEGORY_STRENGTH[ev.category];
  if (ev.category === 0) {
    const top = Math.max(...seat.hole.map((c) => rankValue(c.rank)));
    s += (top / 14) * 0.1;
  }
  return s;
}

export function casinoDecision(state, rng = Math.random) {
  const la = legalActions(state);
  const canRaise = la.actions.includes('raise');
  const canCheck = la.actions.includes('check');
  const strength = handStrength(state, 'casino') + (rng() - 0.5) * 0.2;
  const bluff = rng() < 0.08;
  if (strength > 0.75 || (bluff && canRaise)) {
    if (canRaise) {
      const frac = strength > 0.9 ? 0.9 : 0.5;
      const size = Math.round((state.pot * frac) / 10) * 10;
      const target = Math.min(la.maxRaiseTo, Math.max(la.minRaiseTo, state.currentBet + size));
      return { action: 'raise', amount: target };
    }
    return { action: canCheck ? 'check' : 'call', amount: 0 };
  }
  if (canCheck) return { action: 'check', amount: 0 };
  const potOdds = la.toCall / (state.pot + la.toCall);
  if (la.toCall <= BIG_BLIND && strength >= 0.35) return { action: 'call', amount: 0 };
  if (strength >= potOdds + 0.2) return { action: 'call', amount: 0 };
  return { action: 'fold', amount: 0 };
}

export function playCasinoTurn(state, rng = Math.random) {
  if (state.toAct !== 'casino') return state;
  const d = casinoDecision(state, rng);
  return applyAction(state, d.action, d.amount);
}

export function mulberry32(a) {
  return function() {
    a = a | 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) | 0;
    t = t ^ t >>> 14;
    return (t >>> 0) / 4294967296;
  };
}
