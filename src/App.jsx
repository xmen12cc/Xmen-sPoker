import { useState } from 'react'
import Blackjack from './components/Blackjack.jsx'
import Poker from './components/Poker.jsx'
import Roulette from './components/Roulette.jsx'
import SoundToggle from './components/SoundToggle.jsx'

const App = () => {
  const [view, setView] = useState('lobby')

  return (
    <div className="app">
      <SoundToggle />
      {view === 'lobby' && (
        <div className="lobby">
          <h1>Xmen's Poker</h1>
          <p className="lobby-tagline">The house always plays fair.</p>
          <div className="lobby-games">
            <button className="game-tile" onClick={() => setView('blackjack')}>
              Blackjack
              <span className="tile-sub">Beat the dealer to 21</span>
            </button>
            <button className="game-tile" onClick={() => setView('poker')}>
              Texas Hold'em
              <span className="tile-sub">Heads-up vs the casino</span>
            </button>
            <button className="game-tile" onClick={() => setView('roulette')}>
              Roulette
              <span className="tile-sub">Spin the wheel, place your bets</span>
            </button>
          </div>
        </div>
      )}
      {view === 'blackjack' && (
        <Blackjack onBack={() => setView('lobby')} />
      )}
      {view === 'poker' && (
        <Poker onBack={() => setView('lobby')} />
      )}
      {view === 'roulette' && (
        <Roulette onBack={() => setView('lobby')} />
      )}
    </div>
  )
}

export default App