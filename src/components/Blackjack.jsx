import { useState, useEffect, useRef } from 'react'
import { newGame, startRound, hit, stand, doubleDown, nextRound, handValue } from '../engine/blackjack.js'
import PlayingCard from './PlayingCard.jsx'
import Chip from './Chip.jsx'
import Dealer from './Dealer.jsx'
import { play } from '../audio/sound.js'
import './blackjack.css'

export default function Blackjack({ onBack }) {
  const [game, setGame] = useState(() => newGame(1000))
  const [pendingBet, setPendingBet] = useState(0)
  const [round, setRound] = useState(0)
  const [dealerDealing, setDealerDealing] = useState(false)
  const soundTimers = useRef([])

  const later = (fn, ms) => {
    soundTimers.current.push(setTimeout(fn, ms))
  }

  useEffect(() => () => {
    soundTimers.current.forEach(clearTimeout)
    soundTimers.current = []
  }, [])

  const playerTotal = handValue(game.player).total
  const dealerTotal = handValue(game.dealer).total
  const dealerShown = game.phase === 'playing' ? handValue(game.dealer.slice(0, 1)).total : dealerTotal
  const playerCards = game.player
  const dealerCards = game.dealer

  const playerBust = playerTotal > 21
  const dealerBust = dealerTotal > 21
  const playerBusted = game.phase === 'done' && game.result === 'lose' && playerBust

  const handleChipClick = (value) => {
    if (game.phase !== 'betting' || pendingBet + value > game.bankroll) return
    setPendingBet(pendingBet + value)
    play('chip')
  }

  const handleClear = () => {
    setPendingBet(0)
    play('button')
  }

  const handleAllIn = () => {
    if (game.phase !== 'betting' || game.bankroll <= 0) return
    setPendingBet(game.bankroll)
    play('button')
  }

  const handleDeal = () => {
    if (game.phase !== 'betting' || pendingBet <= 0 || pendingBet > game.bankroll) return
    play('bet')
    setGame(startRound(game, pendingBet))
    setPendingBet(0)
    setDealerDealing(true)
    for (let i = 0; i < 4; i++) {
      later(() => play('cardDeal'), i * 150)
    }
  }

  const handleHit = () => {
    if (game.phase !== 'playing') return
    setGame(hit(game))
    play('cardDeal')
    setDealerDealing(true)
  }
  const handleStand = () => {
    if (game.phase !== 'playing') return
    setGame(stand(game))
    play('cardFlip')
    setDealerDealing(true)
  }
  const handleDouble = () => {
    if (game.phase !== 'playing' || game.player.length !== 2 || game.bankroll < game.bet) return
    play('bet')
    setGame(doubleDown(game))
    setDealerDealing(true)
    later(() => play('cardDeal'), 0)
  }

  const handleNext = () => {
    if (game.phase !== 'done') return
    setRound(r => r + 1)
    setGame(nextRound(game))
    setPendingBet(0)
    play('button')
  }

  const handleNewGame = () => {
    setGame(newGame(1000))
    setPendingBet(0)
    play('button')
  }

  useEffect(() => {
    if (game.phase !== 'done' || !game.result) return undefined
    const name = game.result === 'win' || game.result === 'blackjack' ? 'win' : game.result === 'lose' ? 'lose' : 'push'
    const timeout = setTimeout(() => play(name), 500)
    return () => clearTimeout(timeout)
  }, [game.phase, game.result, round])

  useEffect(() => {
    if (dealerDealing) {
      const timeout = setTimeout(() => setDealerDealing(false), 700)
      return () => clearTimeout(timeout)
    }
  }, [dealerDealing])

  const mood = game.phase === 'done'
    ? game.result === 'win' || game.result === 'blackjack'
      ? 'sad'
      : game.result === 'lose'
      ? 'happy'
      : 'idle'
    : dealerDealing
    ? 'dealing'
    : 'idle'

  const net = game.payout - game.bet
  const bannerNet = game.result === 'push'
    ? 'Push — bet returned'
    : game.result === 'win' || game.result === 'blackjack'
    ? `+ $${net}`
    : game.result === 'lose'
    ? `- $${game.bet}`
    : ''

  return (
    <div className="bj-table">
      <div className="bj-header">
        <button className="bj-btn-back" onClick={onBack}>&lt; Back to Lobby</button>
        <h2>Blackjack</h2>
        <div className="bj-header-right">
          <span>Bankroll: ${game.bankroll}</span>
          {game.bankroll <= 0 && game.phase === 'betting' && (
            <button onClick={handleNewGame}>New Game</button>
          )}
        </div>
      </div>

      <div className="bj-dealer">
        <div className="bj-dealer-figure">
          <Dealer key={mood + '-' + round} mood={mood} size={110} />
        </div>
        <div className={`bj-label${game.phase === 'done' && dealerBust ? ' bust-total' : ''}`}>
          Dealer {dealerShown}{game.phase === 'done' && dealerBust ? ' — bust' : ''}
        </div>
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
            <span className="bj-empty">—</span>
          )}
        </div>
      </div>

      <div className="bj-player">
        <div className={`bj-label${playerBusted ? ' bust-total' : ''}`}>
          You {playerTotal}{playerBusted ? ' — bust' : ''}
        </div>
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
            <span className="bj-empty">—</span>
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
            <div className="bj-controls">
              <button className="bj-btn-clear" onClick={handleClear}>Clear</button>
              <button className="bj-btn-clear" onClick={handleAllIn} disabled={game.bankroll <= 0}>All In</button>
              <button
                className="bj-btn-deal"
                onClick={handleDeal}
                disabled={pendingBet <= 0}
              >
                Deal
              </button>
            </div>
          </>
        )}
        {game.phase === 'playing' && (
          <>
            <div className="bj-bet">Bet: ${game.bet}{game.doubled ? ' — doubled' : ''}</div>
            <div className="bj-controls">
              <button className="bj-btn" onClick={handleHit}>Hit</button>
              <button className="bj-btn" onClick={handleStand}>Stand</button>
              <button
                className="bj-btn"
                onClick={handleDouble}
                disabled={game.player.length !== 2 || game.bankroll < game.bet}
                title={game.bankroll < game.bet ? 'Not enough bankroll to double' : undefined}
              >
                Double
              </button>
            </div>
          </>
        )}
        {game.phase === 'done' && (
          <>
            <div className="bj-bet">Bet: ${game.bet}{game.doubled ? ' — doubled' : ''}</div>
            <div className="bj-controls">
              <button className="bj-btn bj-btn-gold" onClick={handleNext}>Next Hand</button>
            </div>
          </>
        )}
      </div>

      {game.phase === 'done' && (
        <div className={`banner ${game.result}${playerBusted ? ' bust' : ''}`} role="status">
          <span className="banner-title">{game.message}</span>
          <span className="banner-net">{bannerNet}</span>
        </div>
      )}
      {game.phase === 'done' && game.bankroll <= 0 && (
        <div className="out-of-chips">
          You are out of chips!
          <button onClick={handleNewGame}>New Game</button>
        </div>
      )}
    </div>
  )
}
