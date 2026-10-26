// Safe localStorage helpers: every access is wrapped in try/catch and
// degrades to a no-op (or the fallback) when storage is unavailable,
// e.g. in node tests, private browsing or disabled storage.

export const STORAGE_KEYS = {
  blackjackBankroll: 'xp-bankroll-blackjack',
  rouletteBankroll: 'xp-bankroll-roulette',
  pokerPlayer: 'xp-poker-player',
  pokerCasino: 'xp-poker-casino',
}

export function loadNumber(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const value = Number(raw)
    return Number.isFinite(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function saveNumber(key, value) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    /* storage unavailable — ignore */
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* storage unavailable — ignore */
  }
}
