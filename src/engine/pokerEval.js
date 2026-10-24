export const HAND_NAMES = [
  'High Card',
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush'
];

export function evaluate5(cards) {
  if (cards.length !== 5) {
    throw new Error('evaluate5 expects exactly 5 cards');
  }

  const rankValue = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:11,Q:12,K:13,A:14 };
  const values = cards.map(c => rankValue[c.rank]);
  const suits = cards.map(c => c.suit);

  const sorted = [...values].sort((a, b) => b - a);
  const uniqueValues = [...new Set(sorted)];
  const isWheel = uniqueValues.length === 5 && uniqueValues[0] === 14 && uniqueValues[1] === 5;
  const isRegular = uniqueValues.length === 5 && uniqueValues[0] - uniqueValues[4] === 4;
  const isStraight = isRegular || isWheel;
  const straightHigh = isWheel ? 5 : uniqueValues[0];

  const isFlush = suits.every(s => s === suits[0]);

  const counts = {};
  for (let i = 0; i < values.length; i++) {
    counts[values[i]] = (counts[values[i]] || 0) + 1;
  }
  const groups = Object.entries(counts)
    .map(([value, count]) => ({ value: parseInt(value), count }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  const category = determineCategory(values, suits, isFlush, isStraight, straightHigh, groups, uniqueValues);
  const tiebreak = computeTiebreak(values, straightHigh, isFlush, isStraight, groups);

  return { category, name: HAND_NAMES[category], tiebreak };
}

function determineCategory(values, suits, isFlush, isStraight, straightHigh, groups, uniqueValues) {
  const isWheelStraight = uniqueValues.length === 5 && uniqueValues[0] === 14 && uniqueValues[1] === 5;
  const isStraightFlush = isFlush && isStraight;

  if (isFlush && isStraight) {
    return uniqueValues[0] === 14 && !isWheelStraight ? 9 : 8;
  }
  if (isFlush) {
    return 5;
  }
  if (isStraight) {
    return 4;
  }
  if (groups[0].count === 4) {
    return 7;
  }
  if (groups[0].count === 3 && groups[1].count === 2) {
    return 6;
  }
  if (groups[0].count === 3) {
    return 3;
  }
  if (groups[0].count === 2 && groups[1].count === 2) {
    return 2;
  }
  if (groups[0].count === 2) {
    return 1;
  }
  return 0;
}

function computeTiebreak(values, straightHigh, isFlush, isStraight, groups) {
  if (isFlush && isStraight) {
    return [straightHigh];
  }
  if (isFlush) {
    return [...values];
  }
  if (isStraight) {
    return [straightHigh];
  }
  if (groups[0].count === 4) {
    return [groups[0].value, ...groups.slice(1).map(g => g.value)];
  }
  if (groups[0].count === 3 && groups[1].count === 2) {
    return [groups[0].value, groups[1].value];
  }
  if (groups[0].count === 3) {
    return [groups[0].value, ...groups.slice(1).map(g => g.value)];
  }
  if (groups[0].count === 2 && groups[1].count === 2) {
    return [groups[0].value, groups[1].value, ...groups.slice(2).map(g => g.value)];
  }
  if (groups[0].count === 2) {
    return [groups[0].value, ...groups.slice(1).map(g => g.value)];
  }
  return [...values];
}

export function compareHands(a, b) {
  if (a.category > b.category) return 1;
  if (a.category < b.category) return -1;
  for (let i = 0; i < a.tiebreak.length; i++) {
    if (a.tiebreak[i] > b.tiebreak[i]) return 1;
    if (a.tiebreak[i] < b.tiebreak[i]) return -1;
  }
  return 0;
}

function rankValue(rank) {
  const RANK_VALUES = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:11,Q:12,K:13,A:14 };
  return RANK_VALUES[rank];
}
