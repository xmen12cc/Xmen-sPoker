import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEYS, loadNumber, removeKey, saveNumber } from './storage.js'

let store

beforeEach(() => {
  store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
})

afterEach(() => {
  delete globalThis.localStorage
})

describe('storage helpers', () => {
  it('round-trips a saved number', () => {
    saveNumber('xp-test', 1250)
    expect(loadNumber('xp-test', 1000)).toBe(1250)
  })

  it('returns the fallback when the key is missing', () => {
    expect(loadNumber('xp-missing', 1000)).toBe(1000)
  })

  it('returns the fallback for values that are not finite numbers', () => {
    saveNumber('xp-bad', 'not-a-number')
    expect(loadNumber('xp-bad', 42)).toBe(42)
    saveNumber('xp-nan', Number.NaN)
    expect(loadNumber('xp-nan', 7)).toBe(7)
  })

  it('degrades to a no-op when localStorage is unavailable', () => {
    delete globalThis.localStorage
    expect(loadNumber('xp-test', 5)).toBe(5)
    expect(() => saveNumber('xp-test', 5)).not.toThrow()
    expect(() => removeKey('xp-test')).not.toThrow()
  })

  it('removeKey deletes the stored value', () => {
    saveNumber('xp-test', 99)
    removeKey('xp-test')
    expect(loadNumber('xp-test', 1)).toBe(1)
  })

  it('exposes the shared persistence keys', () => {
    expect(STORAGE_KEYS).toEqual({
      blackjackBankroll: 'xp-bankroll-blackjack',
      rouletteBankroll: 'xp-bankroll-roulette',
      pokerPlayer: 'xp-poker-player',
      pokerCasino: 'xp-poker-casino',
    })
  })
})
