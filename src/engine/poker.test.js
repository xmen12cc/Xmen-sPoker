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
  it('handles a player with only 5 chips: all-in small blind runs out to showdown', () => {
    const s = startHand(newPokerGame(5, 1000), mulberry32(1));
    expect(s.player.totalBet).toBe(5);
    expect(s.player.allIn).toBe(true);
    expect(s.player.chips).toBeGreaterThanOrEqual(0);
    expect(s.street).toBe('done');
    expect(s.toAct).toBe(null);
    expect(s.pot).toBe(0);
    expect(s.player.chips + s.casino.chips).toBe(1005);
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

describe('showdown', () => {
  const c = (rank, suit) => ({ rank, suit, id: rank + suit });
  const total = (s) => s.player.chips + s.casino.chips + s.pot;
  function checkDown(s) {
    let guard = 0;
    while (s.toAct && guard++ < 50) {
      const la = legalActions(s);
      s = applyAction(s, la.actions.includes('check') ? 'check' : 'call');
    }
    return s;
  }
  function rigged(playerHole, casinoHole, board) {
    const s = startHand(newPokerGame(), mulberry32(1));
    return { ...s, player: { ...s.player, hole: playerHole }, casino: { ...s.casino, hole: casinoHole }, deck: board };
  }

  it('player wins: player holds A♠ A♥ against K♠ K♥ on board [2♣ 7♦ 9♥ J♠ 3♦] (high card 9)', () => {
    const s = checkDown(rigged([c('A', 'S'), c('A', 'H')], [c('K', 'S'), c('K', 'H')], [c('2', 'C'), c('7', 'D'), c('9', 'H'), c('J', 'S'), c('3', 'D')]));
    expect(s.street).toBe('done');
    expect(s.winner).toBe('player');
    expect(s.community.length).toBe(5);
    expect(s.player.chips).toBe(1020);
    expect(s.casino.chips).toBe(980);
    expect(s.pot).toBe(0);
    expect(s.showdown).not.toBeNull();
    expect(s.showdown.amount).toBe(40);
  });

  it('casino wins: player holds K K against A A on the same board', () => {
    const s = checkDown(rigged([c('K', 'S'), c('K', 'H')], [c('A', 'S'), c('A', 'H')], [c('2', 'C'), c('7', 'D'), c('9', 'H'), c('J', 'S'), c('3', 'D')]));
    expect(s.street).toBe('done');
    expect(s.winner).toBe('casino');
    expect(s.player.chips).toBe(980);
    expect(s.casino.chips).toBe(1020);
    expect(s.pot).toBe(0);
  });

  it('tie: both hold 2♣ 3♦ against board [A♠ K♠ Q♠ J♠ 10♠] (royal flush)', () => {
    const s = checkDown(rigged([c('2', 'C'), c('3', 'D')], [c('2', 'H'), c('3', 'S')], [c('A', 'S'), c('K', 'S'), c('Q', 'S'), c('J', 'S'), c('10', 'S')]));
    expect(s.street).toBe('done');
    expect(s.winner).toBe('tie');
    expect(s.player.chips).toBe(1000);
    expect(s.casino.chips).toBe(1000);
  });

  it('chip conservation: total of startHand is 2000 and remains 2000 after checkDown', () => {
    const s0 = startHand(newPokerGame(), mulberry32(3));
    expect(total(s0)).toBe(2000);
    const s = checkDown(s0);
    expect(total(s)).toBe(2000);
  });

  it('all-in call: player raises all-in and casino calls', () => {
    const s0 = startHand(newPokerGame(), mulberry32(5));
    const a = applyAction(s0, 'raise', 1000);
    expect(a.player.allIn).toBe(true);
    const b = applyAction(a, 'call');
    expect(b.street).toBe('done');
    expect(b.community.length).toBe(5);
    expect(b.pot).toBe(0);
    expect(b.player.chips + b.casino.chips).toBe(2000);
  });

  it('all-in fold: casino folds to player all-in raise', () => {
    const s0 = startHand(newPokerGame(), mulberry32(5));
    const a = applyAction(s0, 'raise', 1000);
    const b = applyAction(a, 'fold');
    expect(b.street).toBe('done');
    expect(b.winner).toBe('player');
    expect(b.player.chips).toBe(1020);
    expect(b.casino.chips).toBe(980);
    expect(b.player.chips + b.casino.chips).toBe(2000);
  });

  it('uncalled bet refund: casino is short and player gets refund', () => {
    const s0 = startHand(newPokerGame(1000, 100), mulberry32(5));
    const a = applyAction(s0, 'raise', 1000);
    expect(a.toAct).toBe('casino');
    const b = applyAction(a, 'call');
    expect(b.street).toBe('done');
    expect(b.player.chips + b.casino.chips).toBe(1100);
    expect(b.pot).toBe(0);
  });

  it('heads-up first-to-act postflop: after player call and casino check, toAct is casino (the non-button)', () => {
    const s = applyAction(applyAction(startHand(newPokerGame(), mulberry32(1)), 'call'), 'check');
    expect(s.street).toBe('flop');
    const casinoIsNonButton = s.toAct === 'casino';
    expect(casinoIsNonButton).toBe(true);
  });

  it('street progression: after player call, casino check (flop), then casino check and player check -> turn, then both check -> river, then both check -> done', () => {
    let s = startHand(newPokerGame(), mulberry32(1));
    s = applyAction(s, 'call');
    expect(s.street).toBe('preflop');
    expect(s.community.length).toBe(0);

    s = applyAction(s, 'check');
    expect(s.street).toBe('flop');
    expect(s.community.length).toBe(3);
    expect(s.toAct).toBe('casino');

    s = applyAction(s, 'check');
    expect(s.street).toBe('flop');
    expect(s.community.length).toBe(3);

    s = applyAction(s, 'check');
    expect(s.street).toBe('turn');
    expect(s.community.length).toBe(4);

    s = applyAction(s, 'check');
    expect(s.street).toBe('turn');
    expect(s.community.length).toBe(4);

    s = applyAction(s, 'check');
    expect(s.street).toBe('river');
    expect(s.community.length).toBe(5);

    s = applyAction(s, 'check');
    expect(s.street).toBe('river');
    expect(s.community.length).toBe(5);

    s = applyAction(s, 'check');
    expect(s.street).toBe('done');
    expect(s.community.length).toBe(5);
  });

  it('raise cannot be made over an all-in opponent', () => {
    const s0 = startHand(newPokerGame(), mulberry32(5));
    const a = applyAction(s0, 'raise', 1000);
    const la = legalActions(a);
    expect(la.actions).not.toContain('raise');
  });
});
