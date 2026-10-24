import { describe, it, expect } from 'vitest';
import { cardPoints, handValue, isBlackjack, isBust, canSplit } from './blackjack.js';
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
