import { describe, it, expect } from 'vitest';
import {
  SUITS,
  RANKS,
  createDeck,
  shuffle,
  createShoe,
  draw,
  rankValue,
  suitSymbol,
  isRed
} from './cards.js';

function mulberry32(a) {
  return function () {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) | 0;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

describe('SUITS and RANKS', () => {
  it('SUITS has 4 suits', () => {
    expect(SUITS).toEqual(['S', 'H', 'D', 'C']);
  });

  it('RANKS has 13 ranks', () => {
    expect(RANKS).toEqual(['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']);
  });
});

describe('createDeck', () => {
  it('creates a deck with 52 cards', () => {
    const deck = createDeck();
    expect(deck.length).toBe(52);
  });

  it('all cards have unique ids', () => {
    const deck = createDeck();
    const ids = deck.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(52);
  });

  it('each card has rank, suit, and id properties', () => {
    const deck = createDeck();
    deck.forEach(card => {
      expect(card.rank).toBeDefined();
      expect(card.suit).toBeDefined();
      expect(card.id).toBeDefined();
    });
  });
});

describe('shuffle', () => {
  it('does not mutate the input deck', () => {
    const deck = createDeck();
    const original = JSON.stringify(deck);
    const shuffled = shuffle(deck);
    expect(JSON.stringify(deck)).toBe(original);
  });

  it('keeps the same set of ids after shuffling', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    const originalIds = new Set(deck.map(c => c.id));
    const shuffledIds = new Set(shuffled.map(c => c.id));
    expect(originalIds).toEqual(shuffledIds);
  });

  it('same seed gives identical order', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);
    const deck1 = createDeck();
    const deck2 = createDeck();
    const shuffled1 = shuffle(deck1, rng1);
    const shuffled2 = shuffle(deck2, rng2);
    for (let i = 0; i < shuffled1.length; i++) {
      expect(shuffled1[i].id).toBe(shuffled2[i].id);
    }
  });

  it('different seeds give different order', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(99999);
    const deck1 = createDeck();
    const deck2 = createDeck();
    const shuffled1 = shuffle(deck1, rng1);
    const shuffled2 = shuffle(deck2, rng2);
    let different = false;
    for (let i = 0; i < shuffled1.length; i++) {
      if (shuffled1[i].id !== shuffled2[i].id) {
        different = true;
        break;
      }
    }
    expect(different).toBe(true);
  });
});

describe('createShoe', () => {
  it('createShoe(6) has 312 cards', () => {
    const shoe = createShoe(6);
    expect(shoe.length).toBe(312);
  });

  it('createShoe(1) has 52 cards', () => {
    const shoe = createShoe(1);
    expect(shoe.length).toBe(52);
  });
});

describe('draw', () => {
  it('returns first card and a deck one shorter', () => {
    const deck = createDeck();
    const result = draw(deck);
    expect(result.card.rank).toBe('2');
    expect(result.card.suit).toBe('S');
    expect(result.deck.length).toBe(51);
  });

  it('does not mutate original deck', () => {
    const deck = createDeck();
    const originalLength = deck.length;
    const result = draw(deck);
    expect(deck.length).toBe(originalLength);
  });

  it('throws on empty deck', () => {
    const emptyDeck = [];
    expect(() => draw(emptyDeck)).toThrow('Deck is empty');
  });
});

describe('rankValue', () => {
  it('rankValue("A") === 14', () => {
    expect(rankValue('A')).toBe(14);
  });

  it('rankValue("10") === 10', () => {
    expect(rankValue('10')).toBe(10);
  });

  it('rankValue("K") === 13', () => {
    expect(rankValue('K')).toBe(13);
  });

  it('rankValue("2") === 2', () => {
    expect(rankValue('2')).toBe(2);
  });
});

describe('suitSymbol', () => {
  it('suitSymbol("S") == "\\u2660"', () => {
    expect(suitSymbol('S')).toBe('\u2660');
  });

  it('suitSymbol("H") == "\\u2665"', () => {
    expect(suitSymbol('H')).toBe('\u2665');
  });

  it('suitSymbol("D") == "\\u2666"', () => {
    expect(suitSymbol('D')).toBe('\u2666');
  });

  it('suitSymbol("C") == "\\u2663"', () => {
    expect(suitSymbol('C')).toBe('\u2663');
  });
});

describe('isRed', () => {
  it('isRed("H") is true', () => {
    expect(isRed('H')).toBe(true);
  });

  it('isRed("D") is true', () => {
    expect(isRed('D')).toBe(true);
  });

  it('isRed("S") is false', () => {
    expect(isRed('S')).toBe(false);
  });

  it('isRed("C") is false', () => {
    expect(isRed('C')).toBe(false);
  });
});
