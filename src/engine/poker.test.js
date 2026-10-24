import { describe, it, expect } from 'vitest';
import { newPokerGame, startHand, postBlind, other, SMALL_BLIND, BIG_BLIND } from './poker.js';

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
