export const SUITS = ['S', 'H', 'D', 'C'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const RANK_VALUES = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:11,Q:12,K:13,A:14 };
export const SUIT_SYMBOLS = { 'S':'\u2660','H':'\u2665','D':'\u2666','C':'\u2663' };

export function createDeck() {
  const deck = [];
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = 0; j < SUITS.length; j++) {
      deck.push({
        rank: RANKS[i],
        suit: SUITS[j],
        id: RANKS[i] + SUITS[j]
      });
    }
  }
  return deck;
}

export function shuffle(deck, rng = Math.random) {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

export function createShoe(numDecks, rng = Math.random) {
  let shoe = [];
  for (let d = 0; d < numDecks; d++) {
    shoe = shoe.concat(createDeck());
  }
  return shuffle(shoe, rng);
}

export function draw(deck) {
  if (deck.length === 0) {
    throw new Error('Deck is empty');
  }
  return { card: deck[0], deck: deck.slice(1) };
}

export function rankValue(rank) {
  return RANK_VALUES[rank];
}

export function suitSymbol(suit) {
  return SUIT_SYMBOLS[suit];
}

export function isRed(suit) {
  return suit === 'H' || suit === 'D';
}
