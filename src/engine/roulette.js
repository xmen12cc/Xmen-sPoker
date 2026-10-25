export const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function colorOf(n) {
  if (n === 0) return 'green';
  if (RED_NUMBERS.includes(n)) return 'red';
  return 'black';
}

export function spin(rng = Math.random) {
  return Math.floor(rng() * 37);
}

export const BET_TYPES = {
  straight: 'straight',
  red: 'red',
  black: 'black',
  odd: 'odd',
  even: 'even',
  low: 'low',
  high: 'high',
  dozen: 'dozen',
  column: 'column',
};

export function isWinningBet(bet, number) {
  if (number === 0) return bet.type === 'straight' && bet.value === 0;
  if (bet.type === 'straight') return number === bet.value;
  if (bet.type === 'red') return colorOf(number) === 'red';
  if (bet.type === 'black') return colorOf(number) === 'black';
  if (bet.type === 'odd') return number % 2 === 1 && number !== 0;
  if (bet.type === 'even') return number % 2 === 0 && number !== 0;
  if (bet.type === 'low') return number >= 1 && number <= 18;
  if (bet.type === 'high') return number >= 19 && number <= 36;
  if (bet.type === 'dozen') {
    if (bet.value === 1) return number >= 1 && number <= 12;
    if (bet.value === 2) return number >= 13 && number <= 24;
    if (bet.value === 3) return number >= 25 && number <= 36;
  }
  if (bet.type === 'column') {
    if (bet.value === 1) return number % 3 === 1 && number >= 1;
    if (bet.value === 2) return number % 3 === 2 && number >= 1;
    if (bet.value === 3) return number % 3 === 0 && number >= 1;
  }
  return false;
}

export const PAYOUT_ODDS = {
  straight: 35,
  red: 1,
  black: 1,
  odd: 1,
  even: 1,
  low: 1,
  high: 1,
  dozen: 2,
  column: 2,
};

export function betReturn(bet, number) {
  if (!isWinningBet(bet, number)) return 0;
  return bet.amount * (PAYOUT_ODDS[bet.type] + 1);
}

export function newRouletteGame(bankroll = 1000) {
  return {
    bankroll,
    bets: [],
    phase: 'betting',
    lastNumber: null,
    history: [],
    lastNet: 0,
    lastBets: [],
    message: '',
  };
}

function totalStaked(bets) {
  return bets.reduce((sum, b) => sum + b.amount, 0);
}

export function placeBet(state, type, value, amount) {
  if (state.phase !== 'betting') {
    throw new Error('Not in betting phase');
  }
  if (amount <= 0 || amount > state.bankroll) {
    throw new Error('Invalid bet amount');
  }
  const existingIndex = state.bets.findIndex(b => b.type === type && b.value === value);
  let newBets;
  if (existingIndex >= 0) {
    newBets = [...state.bets];
    newBets[existingIndex] = { ...newBets[existingIndex], amount: newBets[existingIndex].amount + amount };
  } else {
    newBets = [...state.bets, { type, value, amount }];
  }
  return { ...state, bankroll: state.bankroll - amount, bets: newBets };
}

export function clearBets(state) {
  if (state.phase !== 'betting') {
    throw new Error('Not in betting phase');
  }
  let refund = 0;
  for (const bet of state.bets) {
    refund += bet.amount;
  }
  return { ...state, bankroll: state.bankroll + refund, bets: [], phase: 'betting', message: '' };
}

export function rebet(state) {
  if (state.phase !== 'betting') {
    throw new Error('Not in betting phase');
  }
  if (state.lastBets.length === 0) {
    throw new Error('No previous bets to rebet');
  }
  if (totalStaked(state.lastBets) > state.bankroll) {
    throw new Error('Not enough bankroll to rebet');
  }
  let next = state;
  for (const bet of state.lastBets) {
    next = placeBet(next, bet.type, bet.value, bet.amount);
  }
  return next;
}

export function doubleBets(state) {
  if (state.phase !== 'betting') {
    throw new Error('Not in betting phase');
  }
  if (state.bets.length === 0) {
    throw new Error('No bets to double');
  }
  if (totalStaked(state.bets) > state.bankroll) {
    throw new Error('Not enough bankroll to double');
  }
  return {
    ...state,
    bankroll: state.bankroll - totalStaked(state.bets),
    bets: state.bets.map(b => ({ ...b, amount: b.amount * 2 })),
  };
}

export function resolveRound(state, number) {
  if (state.phase !== 'betting' || state.bets.length === 0) {
    throw new Error('No bets placed');
  }
  let totalReturn = 0;
  for (const bet of state.bets) {
    totalReturn += betReturn(bet, number);
  }
  const staked = state.bets.reduce((a, b) => a + b.amount, 0);
  const net = totalReturn - staked;
  let message = '';
  if (net > 0) {
    message = `Number ${number} ${colorOf(number)} - you win $${net}`;
  } else if (net < 0) {
    message = `Number ${number} ${colorOf(number)} - you lose $${-net}`;
  } else {
    message = `Number ${number} ${colorOf(number)} - break even`;
  }
  return {
    ...state,
    bankroll: state.bankroll + totalReturn,
    phase: 'done',
    lastNumber: number,
    history: [number, ...state.history].slice(0, 12),
    lastNet: net,
    lastBets: state.bets.map(b => ({ ...b })),
    bets: state.bets,
    message,
  };
}

export function nextRoulette(state) {
  if (state.phase !== 'done') {
    throw new Error('Round not finished');
  }
  return {
    ...state,
    bets: [],
    phase: 'betting',
    message: '',
    lastNet: 0,
  };
}
