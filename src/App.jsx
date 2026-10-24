import { useState } from 'react'
import Blackjack from './components/Blackjack.jsx'

const App = () => {
  const [view, setView] = useState('lobby')

  return (
    <div className="app">
      {view === 'lobby' && (
        <div className="lobby">
          <h1>Xmen's Poker</h1>
          <button onClick={() => setView('blackjack')}>Blackjack</button>
          <button onClick={() => setView('poker')}>Texas Hold'em</button>
        </div>
      )}
      {view === 'blackjack' && (
        <Blackjack onBack={() => setView('lobby')} />
      )}
      {view === 'poker' && (
        <div className="view">
          <h2>Texas Hold'em</h2>
          <p>Coming soon</p>
          <button onClick={() => setView('lobby')}>Back to Lobby</button>
        </div>
      )}
    </div>
  )
}

export default App