import { createShoe } from './cards.js';

export function cardPoints(card) {
  if (card.rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  return Number(card.rank);
}

export function handValue(cards) {
  if (cards.length === 0) {
    return { total: 0, soft: false };
  }
  let total = 0;
  let acesAs11 = 0;
  for (const card of cards) {
    const p = cardPoints(card);
    total += p;
    if (card.rank === 'A') {
      acesAs11++;
    }
  }
  while (total > 21 && acesAs11 > 0) {
    total -= 10;
    acesAs11--;
  }
  return { total, soft: acesAs11 > 0 };
}

export function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function isBust(cards) {
  return handValue(cards).total > 21;
}

export function canSplit(cards) {
  if (cards.length !== 2) return false;
  const a = cards[0];
  const b = cards[1];
  return cardPoints(a) === cardPoints(b);
}
