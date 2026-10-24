import { describe, it, expect } from 'vitest';
import { newPokerGame, startHand, postBlind, other, SMALL_BLIND, BIG_BLIND, applyAction, legalActions } from './poker.js';

function mulberry32(a) {
  return function () {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

describe('newPokerGame', () => {
  it('returns a game with both chips 1000, street idle, and pot 0', () => {
    const g = newPokerGame();
    expect(g.player.chips).toBe(1000);
    expect(g.casino.chips).toBe(1000);
    expect(g.street).toBe('idle');
    expect(g.pot).toBe(0);
  });
});

describe('other', () => {
  it('returns the opponent', () => {
    expect(other('player')).toBe('casino');
    expect(other('casino')).toBe('player');
  });
});

describe('first hand', () => {
  it('sets up the first hand correctly', () => {
    const s = startHand(newPokerGame(), mulberry32(1));
    expect(s.button).toBe('player');
    expect(s.player.bet).toBe(10);
    expect(s.casino.bet).toBe(20);
    expect(s.player.chips).toBe(990);
    expect(s.casino.chips).toBe(980);
    expect(s.pot).toBe(30);
    expect(s.toAct).toBe('player');
    expect(s.currentBet).toBe(20);
    expect(s.street).toBe('preflop');
    expect(s.handNumber).toBe(1);
  });
});

describe('second hand', () => {
  it('sets up the second hand correctly', () => {
    const s = startHand(newPokerGame(), mulberry32(1));
    const s2 = startHand({ ...s, street: 'idle' }, mulberry32(2));
    expect(s2.button).toBe('casino');
    expect(s2.casino.bet).toBe(10);
    expect(s2.player.bet).toBe(20);
    expect(s2.toAct).toBe('casino');
    expect(s2.handNumber).toBe(2);
  });
});

describe('hole cards and deck', () => {
  it('each seat has 2 hole cards, community is empty, and deck has 48 cards', () => {
    const s = startHand(newPokerGame(), mulberry32(1));
    expect(s.player.hole.length).toBe(2);
    expect(s.casino.hole.length).toBe(2);
    expect(s.community.length).toBe(0);
    const ids = [...s.player.hole, ...s.casino.hole].map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(4);
    expect(s.deck.length).toBe(48);
  });
});

describe('seeded rng produces identical results', () => {
  it('same seed gives identical hole cards', () => {
    const s1 = startHand(newPokerGame(), mulberry32(7));
    const s2 = startHand(newPokerGame(), mulberry32(7));
    expect(s1.player.hole).toEqual(s2.player.hole);
  });
});

describe('startHand does not mutate its input', () => {
  it('preserves the original game state', () => {
    const g = newPokerGame();
    const before = JSON.stringify(g);
    startHand(g, mulberry32(1));
    expect(JSON.stringify(g)).toBe(before);
  });
});

describe('short stack', () => {
  it('handles a player with only 5 chips', () => {
    const s = startHand(newPokerGame(5, 1000), mulberry32(1));
    expect(s.player.bet).toBe(5);
    expect(s.player.allIn).toBe(true);
    expect(s.player.chips).toBe(0);
  });
});

describe('throws Cannot start hand', () => {
  it('throws when player has 0 chips', () => {
    expect(() => startHand(newPokerGame(0, 1000))).toThrow();
  });
});

describe('postBlind', () => {
  it('posts a blind correctly', () => {
    const seat = { chips: 100, hole: [], bet: 0, totalBet: 0, folded: false, allIn: false };
    const result = postBlind(seat, 10);
    expect(result.chips).toBe(90);
    expect(result.bet).toBe(10);
    expect(result.totalBet).toBe(10);
    expect(result.allIn).toBe(false);
  });
});

describe('actions', () => {
  const start = () => startHand(newPokerGame(), mulberry32(1));

  it('legalActions(start()): actions equal ["fold","call","raise"], toCall 10, minRaiseTo 40, maxRaiseTo 1000', () => {
    const s = start();
    const { actions, toCall, minRaiseTo, maxRaiseTo } = legalActions(s);
    expect(actions).toEqual(['fold', 'call', 'raise']);
    expect(toCall).toBe(10);
    expect(minRaiseTo).toBe(40);
    expect(maxRaiseTo).toBe(1000);
  });

  it('fold: s = applyAction(start(), "fold"): s.street "done", s.winner "casino", s.pot 0, s.player.chips 990, s.casino.chips 1010, s.toAct null', () => {
    const s = applyAction(start(), 'fold');
    expect(s.street).toBe('done');
    expect(s.winner).toBe('casino');
    expect(s.pot).toBe(0);
    expect(s.player.chips).toBe(990);
    expect(s.casino.chips).toBe(1010);
    expect(s.toAct).toBe(null);
  });

  it('call then check: a = applyAction(start(), "call"); expect a.toAct "casino", a.street "preflop", a.player.bet 20; b = applyAction(a, "check"); expect b.street "flop", b.community.length 3, b.toAct "casino", b.player.bet 0, b.casino.bet 0, b.pot 40, b.currentBet 0', () => {
    const a = applyAction(start(), 'call');
    expect(a.toAct).toBe('casino');
    expect(a.street).toBe('preflop');
    expect(a.player.bet).toBe(20);
    const b = applyAction(a, 'check');
    expect(b.street).toBe('flop');
    expect(b.community.length).toBe(3);
    expect(b.toAct).toBe('casino');
    expect(b.player.bet).toBe(0);
    expect(b.casino.bet).toBe(0);
    expect(b.pot).toBe(40);
    expect(b.currentBet).toBe(0);
  });

  it('raise: r = applyAction(start(), "raise", 60); expect r.player.bet 60, r.player.chips 940, r.currentBet 60, r.minRaise 40, r.toAct "casino"; c = applyAction(r, "call"); expect c.street "flop", c.pot 120, c.casino.chips 940', () => {
    const r = applyAction(start(), 'raise', 60);
    expect(r.player.bet).toBe(60);
    expect(r.player.chips).toBe(940);
    expect(r.currentBet).toBe(60);
    expect(r.minRaise).toBe(40);
    expect(r.toAct).toBe('casino');
    const c = applyAction(r, 'call');
    expect(c.street).toBe('flop');
    expect(c.pot).toBe(120);
    expect(c.casino.chips).toBe(940);
  });

  it('raise too small: expect(() => applyAction(start(), "raise", 25)).toThrow()', () => {
    expect(() => applyAction(start(), 'raise', 25)).toThrow();
  });

  it('check while owing: expect(() => applyAction(start(), "check")).toThrow()', () => {
    expect(() => applyAction(start(), 'check')).toThrow();
  });

  it('re-raise: r = applyAction(start(),"raise",60); rr = applyAction(r,"raise",140); expect rr.currentBet 140, rr.toAct "player", rr.minRaise 80', () => {
    const r = applyAction(start(), 'raise', 60);
    const rr = applyAction(r, 'raise', 140);
    expect(rr.currentBet).toBe(140);
    expect(rr.toAct).toBe('player');
    expect(rr.minRaise).toBe(80);
  });

  it('acting after the hand ends throws: expect(() => applyAction(applyAction(start(), "fold"), "check")).toThrow()', () => {
    expect(() => applyAction(applyAction(start(), 'fold'), 'check')).toThrow();
  });

  it('immutability: JSON.stringify of start() before and after applyAction(s,"call") is unchanged', () => {
    const s = start();
    const before = JSON.stringify(s);
    applyAction(s, 'call');
    expect(JSON.stringify(s)).toBe(before);
  });
});
