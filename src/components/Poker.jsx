import { useState, useEffect, useRef } from 'react'
import { newPokerGame, startHand, applyAction, legalActions } from '../engine/poker.js'
import { playCasinoTurn } from '../engine/pokerAI.js'
import { play } from '../audio/sound.js'
import PlayingCard from './PlayingCard.jsx'
import './poker.css'

export default function Poker({ onBack }) {
  const [game, setGame] = useState(() => newPokerGame(1000, 1000))
  const [raiseTo, setRaiseTo] = useState(0)
  const prevCommunityLength = useRef(0)
  const prevCasinoBet = useRef(0)
  const resultTimeoutRef = useRef(null)

  const inHand = game.street !== 'idle' && game.street !== 'done'
  const myTurn = inHand && game.toAct === 'player'
  const casinoTurn = inHand && game.toAct === 'casino'
  const la = legalActions(game)
  const reveal = game.street === 'done' && game.showdown !== null
  const gameOver = game.street === 'done' && (game.player.chips <= 0 || game.casino.chips <= 0)
  const canRaise = la.actions.includes('raise')
  const canCheck = la.actions.includes('check')

  useEffect(() => {
    if (!casinoTurn) return undefined
    const t = setTimeout(() => {
      setGame((g) => (g.toAct === 'casino' ? playCasinoTurn(g) : g))
    }, 900)
    return () => clearTimeout(t)
  }, [game, casinoTurn])

  useEffect(() => {
    if (myTurn) setRaiseTo(la.minRaiseTo)
  }, [game.street, game.currentBet, game.toAct])

  useEffect(() => {
    const prev = prevCommunityLength.current
    const current = game.community.length
    if (current > prev) {
      const timeouts = []
      for (let i = 0; i < current - prev; i++) {
        const t = setTimeout(() => play('cardFlip'), i * 120)
        timeouts.push(t)
      }
      prevCommunityLength.current = current
      return () => timeouts.forEach((t) => clearTimeout(t))
    }
    prevCommunityLength.current = current
  }, [game.community])

  useEffect(() => {
    const prev = prevCasinoBet.current
    prevCasinoBet.current = game.casino.bet
    if (game.casino.bet > prev && game.street !== 'idle') {
      const t = setTimeout(() => play('bet'), 0)
      return () => clearTimeout(t)
    }
  }, [game.casino.bet, game.street])

  useEffect(() => {
    if (game.street === 'done') {
      if (game.winner === 'player') {
        const t = setTimeout(() => play('win'), 400)
        resultTimeoutRef.current = t
      } else if (game.winner === 'casino') {
        const t = setTimeout(() => play('lose'), 400)
        resultTimeoutRef.current = t
      } else if (game.winner === 'tie') {
        const t = setTimeout(() => play('push'), 400)
        resultTimeoutRef.current = t
      }
    }
    return () => {
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current)
      }
    }
  }, [game.street, game.handNumber])

  const act = (action, amount) => {
    if (action === 'fold') play('fold')
    else if (action === 'check') play('check')
    else if (action === 'call') play('bet')
    else if (action === 'raise') play('bet')
    setGame((g) => applyAction(g, action, amount))
  }
  const deal = () => {
    const timeouts = []
    for (let i = 0; i < 4; i++) {
      const t = setTimeout(() => play('cardDeal'), i * 120)
      timeouts.push(t)
    }
    setGame((g) => startHand(g))
    return () => timeouts.forEach((t) => clearTimeout(t))
  }
  const restart = () => setGame(newPokerGame(1000, 1000))

  const board = []
  for (let i = 0; i < 5; i++) board.push(game.community[i])

  return (
    <div className="pk-table">
      <div className="pk-header">
        <button onClick={onBack}>&lt; Back to Lobby</button>
        <h2>Texas Hold'em</h2>
        <span>Hand #{game.handNumber}</span>
      </div>

      <div className="pk-seat pk-casino">
        <div className="pk-name">
          Casino {game.button === 'casino' && <span className="pk-dealer">D</span>}
          <span className="pk-stack">${game.casino.chips}</span>
          {game.casino.bet > 0 && <span className="pk-bet">bet ${game.casino.bet}</span>}
          {game.casino.allIn && <span className="pk-allin">ALL IN</span>}
        </div>
        <div className="pk-cards">
          {game.casino.hole.length > 0 ? (
            game.casino.hole.map((card, i) => (
              <PlayingCard key={card.id} card={card} faceDown={!reveal} delay={i * 150} />
            ))
          ) : (
            <><PlayingCard /><PlayingCard /></>
          )}
        </div>
        {casinoTurn && <div className="pk-thinking">Casino is thinking...</div>}
      </div>

      <div className="pk-board">
        <div className="pk-pot">Pot: ${game.pot}</div>
        <div className="pk-cards">
          {board.map((card, i) => (
            <PlayingCard key={i} card={card} delay={i * 120} />
          ))}
        </div>
      </div>

      <div className="pk-seat pk-player">
        <div className="pk-cards">
          {game.player.hole.length > 0 ? (
            game.player.hole.map((card, i) => (
              <PlayingCard key={card.id} card={card} delay={i * 150} />
            ))
          ) : (
            <><PlayingCard /><PlayingCard /></>
          )}
        </div>
        <div className="pk-name">
          You {game.button === 'player' && <span className="pk-dealer">D</span>}
          <span className="pk-stack">${game.player.chips}</span>
          {game.player.bet > 0 && <span className="pk-bet">bet ${game.player.bet}</span>}
          {game.player.allIn && <span className="pk-allin">ALL IN</span>}
        </div>
      </div>

      {game.street === 'done' && (
        <div className={'pk-banner ' + (game.winner || '')}>
          {game.message}
          {reveal && (
            <div className="pk-hands">You: {game.showdown.player.name} | Casino: {game.showdown.casino.name}</div>
          )}
        </div>
      )}

      <div className="pk-controls">
        {myTurn && (
          <>
            <button className="pk-btn" onClick={() => act('fold')}>Fold</button>
            <button className="pk-btn" onClick={() => act(canCheck ? 'check' : 'call')}>
              {canCheck ? 'Check' : 'Call $' + la.toCall}
            </button>
            {canRaise && (
              <>
                <input
                  type="range"
                  min={la.minRaiseTo}
                  max={la.maxRaiseTo}
                  step={10}
                  value={Math.min(Math.max(raiseTo, la.minRaiseTo), la.maxRaiseTo)}
                  onChange={(e) => setRaiseTo(Number(e.target.value))}
                />
                <button className="pk-btn" onClick={() => act('raise', Math.min(Math.max(raiseTo, la.minRaiseTo), la.maxRaiseTo))}>
                  Raise to ${Math.min(Math.max(raiseTo, la.minRaiseTo), la.maxRaiseTo)}
                </button>
                <button className="pk-btn" onClick={() => act('raise', la.maxRaiseTo)}>All In</button>
              </>
            )}
          </>
        )}
        {!inHand && !gameOver && (
          <button className="pk-btn pk-deal" onClick={deal}>{game.handNumber === 0 ? 'Deal' : 'Next Hand'}</button>
        )}
        {gameOver && (
          <div className="pk-over">
            {game.player.chips <= 0 ? 'You are out of chips!' : 'You broke the casino!'}
            <button className="pk-btn pk-deal" onClick={restart}>New Game</button>
          </div>
        )}
      </div>
    </div>
  )
}
