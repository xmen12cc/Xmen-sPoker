import { describe, it, expect } from 'vitest';
import { evaluate5, compareHands, HAND_NAMES } from './pokerEval';

const h = (str) => str.split(' ').map(token => {
  const rank = token.slice(0, -1);
  const suit = token.slice(-1);
  // Fix for '10' rank: naive slice gives '1' + suit, check if rank is '1' with a suit char
  if (rank === '1' && ['S','H','D','C'].includes(suit)) {
    return { rank: '10', suit: suit, id: token };
  }
  return { rank, suit, id: token };
});

describe('pokerEval', () => {
  describe('evaluate5', () => {
    it('royal flush', () => {
      const cards = h('AS KS QS JS 10S');
      const result = evaluate5(cards);
      expect(result.name).toBe('Royal Flush');
      expect(result.category).toBe(9);
    });

    it('straight flush (9H 8H 7H 6H 5H)', () => {
      const cards = h('9H 8H 7H 6H 5H');
      const result = evaluate5(cards);
      expect(result.name).toBe('Straight Flush');
      expect(result.category).toBe(8);
    });

    it('wheel straight flush (AH 2H 3H 4H 5H)', () => {
      const cards = h('AH 2H 3H 4H 5H');
      const result = evaluate5(cards);
      expect(result.name).toBe('Straight Flush');
      expect(result.category).toBe(8);
      expect(result.tiebreak).toEqual([5]);
    });

    it('four of a kind with kicker', () => {
      const cards = h('KS KS KS KS AC');
      const result = evaluate5(cards);
      expect(result.name).toBe('Four of a Kind');
      expect(result.category).toBe(7);
    });

    it('full house tiebreak [trip, pair]', () => {
      const cards = h('7H 7D 7S 2D 2C');
      const result = evaluate5(cards);
      expect(result.name).toBe('Full House');
      expect(result.category).toBe(6);
      expect(result.tiebreak).toEqual([7, 2]);
    });

    it('flush', () => {
      const cards = h('AS KS QS JS 9S');
      const result = evaluate5(cards);
      expect(result.name).toBe('Flush');
      expect(result.category).toBe(5);
    });

    it('straight (10 to A)', () => {
      const cards = h('10S JS QS KS AH');
      const result = evaluate5(cards);
      expect(result.name).toBe('Straight');
      expect(result.category).toBe(4);
    });

    it('wheel straight (A2345)', () => {
      const cards = h('AH 2D 3S 4C 5H');
      const result = evaluate5(cards);
      expect(result.name).toBe('Straight');
      expect(result.category).toBe(4);
      expect(result.tiebreak).toEqual([5]);
    });

    it('three of a kind', () => {
      const cards = h('7H 7D 7S 2D 3C');
      const result = evaluate5(cards);
      expect(result.name).toBe('Three of a Kind');
      expect(result.category).toBe(3);
    });

    it('two pair with kicker', () => {
      const cards = h('8H 8D 4D 4C 2S');
      const result = evaluate5(cards);
      expect(result.name).toBe('Two Pair');
      expect(result.category).toBe(2);
      expect(result.tiebreak).toEqual([8, 4, 2]);
    });

    it('pair with kickers', () => {
      const cards = h('8H 8D 4D 3C 2S');
      const result = evaluate5(cards);
      expect(result.name).toBe('Pair');
      expect(result.category).toBe(1);
    });

    it('high card', () => {
      const cards = h('9H 4D 3D 2S AC');
      const result = evaluate5(cards);
      expect(result.name).toBe('High Card');
      expect(result.category).toBe(0);
    });
  });

  describe('compareHands', () => {
    it('higher category wins', () => {
      const a = evaluate5(h('AS KS QS JS 9S')); // flush
      const b = evaluate5(h('AS KS QS JS 10H')); // straight
      expect(compareHands(a, b)).toBe(1);
    });

    it('same category higher tiebreak wins', () => {
      const a = evaluate5(h('AS KS QS JS 9S')); // flush
      const b = evaluate5(h('KH QH JH 9H 8H')); // flush
      expect(compareHands(a, b)).toBe(1);
    });

    it('pair of aces vs pair of kings', () => {
      const a = evaluate5(h('AS KS QS 7H 2H'));
      const b = evaluate5(h('KS QS JS 7H 2H'));
      expect(compareHands(a, b)).toBe(1);
    });

    it('kicker decides: AA K Q 3 vs AA K Q 2', () => {
      const a = evaluate5(h('AS KS QS QH 3H'));
      const b = evaluate5(h('AS KS QS QH 2H'));
      expect(compareHands(a, b)).toBe(1);
    });

    it('identical ranks different suits -> 0', () => {
      const a = evaluate5(h('AS KS QS JS 10H'));
      const b = evaluate5(h('AH KH QH JH 10D'));
      expect(compareHands(a, b)).toBe(0);
    });

    it('wheel straight loses to 6-high straight', () => {
      const a = evaluate5(h('AH 2D 3S 4C 5H')); // wheel straight
      const b = evaluate5(h('6H 5D 4S 3C 2H')); // 6-high straight
      expect(compareHands(a, b)).toBe(-1);
    });

    it('full house 3s over 2s loses to 4s over 2s', () => {
      const a = evaluate5(h('3H 3D 3S 2D 2C'));
      const b = evaluate5(h('4H 4D 4S 2D 2C'));
      expect(compareHands(a, b)).toBe(-1);
    });

    it('A-high flush beats K-high flush', () => {
      const a = evaluate5(h('AH KH QH JH 10H'));
      const b = evaluate5(h('KH QH JH 9H 8H'));
      expect(compareHands(a, b)).toBe(1);
    });

    it('royal flush beats straight flush', () => {
      const a = evaluate5(h('AS KS QS JS 10S')); // royal flush
      const b = evaluate5(h('9H 8H 7H 6H 5H')); // straight flush
      expect(compareHands(a, b)).toBe(1);
    });
  });
});
