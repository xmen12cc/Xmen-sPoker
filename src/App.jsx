import { useState } from 'react'
import Blackjack from './components/Blackjack.jsx'
import Poker from './components/Poker.jsx'

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
        <Poker onBack={() => setView('lobby')} />
      )}
    </div>
  )
}

export default App