import { useState, useEffect } from 'react'
import { newGame, startRound, hit, stand, doubleDown, nextRound, handValue } from '../engine/blackjack.js'
import PlayingCard from './PlayingCard.jsx'
import Chip from './Chip.jsx'
import { play } from '../audio/sound.js'
import './blackjack.css'

export default function Blackjack({ onBack }) {
  const [game, setGame] = useState(() => newGame(1000))
  const [pendingBet, setPendingBet] = useState(0)
  const [round, setRound] = useState(0)

  const playerTotal = handValue(game.player).total
  const dealerTotal = handValue(game.dealer).total
  const dealerShown = game.phase === 'playing' ? handValue(game.dealer.slice(0, 1)).total : dealerTotal
  const playerCards = game.player
  const dealerCards = game.dealer

  const playerBust = playerTotal > 21
  const dealerBust = dealerTotal > 21

  const handleChipClick = (value) => {
    if (pendingBet + value <= game.bankroll) {
      setPendingBet(pendingBet + value)
      play('chip')
    }
  }

  const handleClear = () => {
    setPendingBet(0)
    play('button')
  }

  const handleDeal = () => {
    if (pendingBet > 0) {
      play('bet')
      setGame(startRound(game, pendingBet))
      setPendingBet(0)
      setTimeout(() => play('cardDeal'), 0)
      setTimeout(() => play('cardDeal'), 150)
      setTimeout(() => play('cardDeal'), 300)
      setTimeout(() => play('cardDeal'), 450)
    }
  }

  const handleHit = () => {
    setGame(hit(game))
    play('cardDeal')
  }
  const handleStand = () => {
    setGame(stand(game))
    play('cardFlip')
  }
  const handleDouble = () => {
    if (game.player.length === 2 && game.bankroll >= game.bet) {
      play('bet')
      setGame(doubleDown(game))
      setTimeout(() => play('cardDeal'), 0)
    }
  }

  const handleNext = () => {
    setRound(r => r + 1)
    setGame(nextRound(game))
    setPendingBet(0)
    play('button')
  }

  useEffect(() => {
    if (game.phase !== 'done' || !game.result) return undefined
    const name = game.result === 'win' || game.result === 'blackjack' ? 'win' : game.result === 'lose' ? 'lose' : 'push'
    const timeout = setTimeout(() => play(name), 500)
    return () => clearTimeout(timeout)
  }, [game.phase, game.result, round])

  return (
    <div className="bj-table">
      <div className="bj-header">
        <button onClick={onBack}>&lt; Back to Lobby</button>
        <h2>Blackjack</h2>
        <div className="bj-header-right">
          <span>Bankroll: ${game.bankroll}</span>
          {game.bankroll <= 0 && game.phase === 'betting' && (
            <button onClick={() => setGame(newGame(1000))}>New Game</button>
          )}
        </div>
      </div>

      <div className="bj-dealer">
        <div className="bj-label">Dealer {dealerShown}</div>
        <div className="bj-hand">
          {dealerCards.length > 0 ? (
            dealerCards.map((card, index) => (
              <PlayingCard
                key={card.id + index + round}
                card={card}
                faceDown={game.phase === 'playing' && index === 1}
                delay={index * 150}
              />
            ))
          ) : (
            <span style={{ color: '#666' }}>—</span>
          )}
        </div>
      </div>

      <div className="bj-player">
        <div className="bj-label">You {playerTotal}</div>
        <div className="bj-hand">
          {playerCards.length > 0 ? (
            playerCards.map((card, index) => (
              <PlayingCard
                key={card.id + index + round}
                card={card}
                delay={index * 150}
              />
            ))
          ) : (
            <span style={{ color: '#666' }}>—</span>
          )}
        </div>
      </div>

      <div className="bj-phase">
        {game.phase === 'betting' && (
          <>
            <div className="bj-bet">Bet: ${pendingBet}</div>
            <div className="bj-chips">
              <Chip value={5} onClick={() => handleChipClick(5)} disabled={pendingBet + 5 > game.bankroll} />
              <Chip value={25} onClick={() => handleChipClick(25)} disabled={pendingBet + 25 > game.bankroll} />
              <Chip value={100} onClick={() => handleChipClick(100)} disabled={pendingBet + 100 > game.bankroll} />
              <Chip value={500} onClick={() => handleChipClick(500)} disabled={pendingBet + 500 > game.bankroll} />
            </div>
            <button className="bj-btn-clear" onClick={handleClear}>Clear</button>
            <button className="bj-btn-clear" onClick={() => setPendingBet(game.bankroll)} disabled={game.bankroll <= 0}>All In</button>
            <button
              className="bj-btn-deal"
              onClick={handleDeal}
              disabled={pendingBet <= 0}
            >
              Deal
            </button>
          </>
        )}
        {game.phase === 'playing' && (
          <div className="bj-controls">
            <button className="bj-btn" onClick={handleHit}>Hit</button>
            <button className="bj-btn" onClick={handleStand}>Stand</button>
            <button
              className="bj-btn"
              onClick={handleDouble}
              disabled={game.player.length !== 2 || game.bankroll < game.bet}
            >
              Double
            </button>
          </div>
        )}
        {game.phase === 'done' && (
          <div className="bj-controls">
            <button className="bj-btn" onClick={handleNext}>Next Hand</button>
          </div>
        )}
      </div>

      {game.phase === 'done' && (
        <div className={`banner ${game.result}`} style={{ animation: 'fadein 0.4s ease' }}>
          {game.message}
          {(game.result === 'win' || game.result === 'blackjack') && game.payout > 0 && (
            <span style={{ color: '#ffd700' }}> (+${game.payout - game.bet})</span>
          )}
        </div>
      )}
      {game.phase === 'done' && game.bankroll <= 0 && (
        <div className="out-of-chips" style={{ textAlign: 'center', color: '#fff', marginTop: '12px', fontSize: '14px' }}>
          You are out of chips!
          <button onClick={() => setGame(newGame(1000))}>New Game</button>
        </div>
      )}
    </div>
  )
}