import { useState } from 'react'
import Blackjack from './components/Blackjack.jsx'
import Poker from './components/Poker.jsx'
import Roulette from './components/Roulette.jsx'
import SoundToggle from './components/SoundToggle.jsx'
import { STORAGE_KEYS, loadNumber, removeKey } from './storage.js'

const SpadeIcon = () => (
  <svg viewBox="0 0 24 24" width="42" height="42" fill="currentColor" aria-hidden="true">
    <path d="M12 2C9.2 6.6 4 9.3 4 13.2a4.3 4.3 0 0 0 7.4 3L10.4 21h3.2l-1-4.8a4.3 4.3 0 0 0 7.4-3C20 9.3 14.8 6.6 12 2Z" />
  </svg>
)

const CardsIcon = () => (
  <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="3.2" y="4.6" width="9" height="13" rx="1.6" transform="rotate(-10 7.7 11.1)" />
    <rect x="11.8" y="6.4" width="9" height="13" rx="1.6" transform="rotate(10 16.3 12.9)" />
  </svg>
)

const WheelIcon = () => (
  <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3v5.8M12 15.2V21M3 12h5.8M15.2 12H21M5.6 5.6l4.1 4.1M14.3 14.3l4.1 4.1M18.4 5.6l-4.1 4.1M9.7 14.3l-4.1 4.1" />
  </svg>
)

const savedBankroll = (key) => {
  const saved = loadNumber(key, 1000)
  return saved > 0 ? saved : 1000
}

const GAMES = [
  {
    id: 'blackjack',
    name: 'Blackjack',
    rule: 'Blackjack pays 3:2, dealer stands on 17',
    icon: <SpadeIcon />,
    wallet: () => `Bankroll $${savedBankroll(STORAGE_KEYS.blackjackBankroll)}`,
  },
  {
    id: 'poker',
    name: "Texas Hold'em",
    rule: 'No-limit heads-up vs the casino, blinds 10/20',
    icon: <CardsIcon />,
    wallet: () =>
      `You $${savedBankroll(STORAGE_KEYS.pokerPlayer)} — Casino $${savedBankroll(STORAGE_KEYS.pokerCasino)}`,
  },
  {
    id: 'roulette',
    name: 'Roulette',
    rule: 'Single zero, straight numbers pay 35:1',
    icon: <WheelIcon />,
    wallet: () => `Bankroll $${savedBankroll(STORAGE_KEYS.rouletteBankroll)}`,
  },
]

function Lobby({ onPlay }) {
  const [resetToken, setResetToken] = useState(0)

  const handleReset = () => {
    if (!window.confirm('Reset all saved bankrolls and stacks to 1000?')) return
    Object.values(STORAGE_KEYS).forEach(removeKey)
    setResetToken((t) => t + 1)
  }

  return (
    <div className="lobby">
      <header className="lobby-header">
        <h1>Xmen's Poker</h1>
        <p className="lobby-tagline">The house always plays fair.</p>
      </header>
      <div className="lobby-games">
        {GAMES.map((game, index) => (
          <button
            key={game.id}
            type="button"
            className="game-tile"
            style={{ '--tile-delay': `${index * 140}ms` }}
            onClick={() => onPlay(game.id)}
          >
            <span className="tile-icon">{game.icon}</span>
            <span className="tile-name">{game.name}</span>
            <span className="tile-rule">{game.rule}</span>
            <span className="tile-wallet">{game.wallet()}</span>
            <span className="tile-play">Play</span>
          </button>
        ))}
      </div>
      <button type="button" className="lobby-reset" onClick={handleReset}>
        Reset all progress
      </button>
    </div>
  )
}

const App = () => {
  const [view, setView] = useState('lobby')

  return (
    <div className="app">
      <SoundToggle />
      {view === 'lobby' && <Lobby onPlay={setView} />}
      {view === 'blackjack' && <Blackjack onBack={() => setView('lobby')} />}
      {view === 'poker' && <Poker onBack={() => setView('lobby')} />}
      {view === 'roulette' && <Roulette onBack={() => setView('lobby')} />}
    </div>
  )
}

export default App
