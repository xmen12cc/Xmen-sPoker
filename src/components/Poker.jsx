import { useState, useEffect, useRef } from 'react'
import { newPokerGame, startHand, applyAction, legalActions } from '../engine/poker.js'
import { playCasinoTurn } from '../engine/pokerAI.js'
import { play } from '../audio/sound.js'
import { STORAGE_KEYS, loadNumber, saveNumber } from '../storage.js'
import PlayingCard from './PlayingCard.jsx'
import Dealer from './Dealer.jsx'
import './poker.css'

const STREET_LABELS = { preflop: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River' }

export default function Poker({ onBack }) {
  const [game, setGame] = useState(() => {
    const player = loadNumber(STORAGE_KEYS.pokerPlayer, 0)
    const casino = loadNumber(STORAGE_KEYS.pokerCasino, 0)
    return player > 0 && casino > 0 ? newPokerGame(player, casino) : newPokerGame(1000, 1000)
  })
  const [raiseTo, setRaiseTo] = useState(0)
  const prevCommunityLength = useRef(0)
  const prevCasinoBet = useRef(0)
  const timersRef = useRef([])

  const inHand = game.street !== 'idle' && game.street !== 'done'
  const myTurn = inHand && game.toAct === 'player'
  const casinoTurn = inHand && game.toAct === 'casino'
  const la = legalActions(game)
  const reveal = game.street === 'done' && game.showdown !== null
  const gameOver = game.street === 'done' && (game.player.chips <= 0 || game.casino.chips <= 0)
  const canRaise = la.actions.includes('raise')
  const canCheck = la.actions.includes('check')
  const raiseMin = la.minRaiseTo
  const raiseMax = la.maxRaiseTo
  const clampRaise = (v) => Math.min(Math.max(v, raiseMin), raiseMax)
  const clampedRaise = clampRaise(raiseTo)
  const potRaise = (frac) => clampRaise(Math.round((game.currentBet + game.pot * frac) / 10) * 10)
  const mood =
    game.street === 'preflop' && game.acted.player === false && game.acted.casino === false
      ? 'dealing'
    : game.street === 'done' && game.winner === 'casino'
      ? 'happy'
    : game.street === 'done' && game.winner === 'player'
      ? 'sad'
    : 'idle'

  // sound timeouts scheduled outside effect cleanup (deal) are cleared on unmount
  const later = (fn, ms) => {
    const t = setTimeout(fn, ms)
    timersRef.current.push(t)
  }
  useEffect(() => () => timersRef.current.forEach((t) => clearTimeout(t)), [])

  useEffect(() => {
    if (game.street !== 'done') return
    saveNumber(STORAGE_KEYS.pokerPlayer, game.player.chips)
    saveNumber(STORAGE_KEYS.pokerCasino, game.casino.chips)
  }, [game.street, game.player.chips, game.casino.chips])

  useEffect(() => {
    if (!casinoTurn) return undefined
    const t = setTimeout(() => {
      setGame((g) => (g.toAct === 'casino' ? playCasinoTurn(g) : g))
    }, 900)
    return () => clearTimeout(t)
  }, [game, casinoTurn])

  useEffect(() => {
    if (myTurn) setRaiseTo(la.minRaiseTo)
  }, [myTurn, la.minRaiseTo])

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
    if (game.street !== 'done' || !game.winner) return undefined
    const sound = game.winner === 'player' ? 'win' : game.winner === 'casino' ? 'lose' : 'push'
    const t = setTimeout(() => play(sound), 400)
    return () => clearTimeout(t)
  }, [game.street, game.winner, game.handNumber])

  const act = (action, amount) => {
    if (action === 'fold') play('fold')
    else if (action === 'check') play('check')
    else if (action === 'call') play('bet')
    else if (action === 'raise') play('bet')
    setGame((g) => applyAction(g, action, amount))
  }
  const deal = () => {
    for (let i = 0; i < 4; i++) later(() => play('cardDeal'), i * 120)
    setGame((g) => startHand(g))
  }
  const restart = () => {
    saveNumber(STORAGE_KEYS.pokerPlayer, 1000)
    saveNumber(STORAGE_KEYS.pokerCasino, 1000)
    setGame(newPokerGame(1000, 1000))
  }

  const board = []
  for (let i = 0; i < 5; i++) board.push(game.community[i])

  return (
    <div className="pk-table">
      <div className="pk-rail">
        <div className="pk-header">
          <button className="pk-back" onClick={onBack}>&lt; Back to Lobby</button>
          <h2>Texas Hold'em</h2>
          <span className="pk-hand">Hand #{game.handNumber}</span>
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

        <div className="pk-center">
          <div className="pk-dealer-wrap">
            <Dealer mood={mood} size={90} key={mood + '-' + game.handNumber} />
          </div>
          <div className="pk-board">
            <div className="pk-pot-row">
              <span className="pk-pot">
                {game.street === 'done' ? 'Pot won: $' + game.potWon : 'Pot: $' + game.pot}
              </span>
              {inHand && <span className="pk-street">{STREET_LABELS[game.street]}</span>}
            </div>
            <div className="pk-cards pk-board-cards">
              {board.map((card, i) => (
                <PlayingCard key={i} card={card} delay={i * 120} />
              ))}
            </div>
            {game.lastAction && <div className="pk-log">{game.lastAction}</div>}
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
            <div className="pk-banner-title">{game.message}</div>
            <div className="pk-banner-amount">Pot won: ${game.potWon}</div>
            {reveal && (
              <div className="pk-hands">You: {game.showdown.player.name} | Casino: {game.showdown.casino.name}</div>
            )}
          </div>
        )}

        <div className="pk-controls">
          {myTurn && (
            <>
              <button className="pk-btn pk-btn-fold" onClick={() => act('fold')}>Fold</button>
              <button className="pk-btn pk-btn-call" onClick={() => act(canCheck ? 'check' : 'call')}>
                {canCheck ? 'Check' : 'Call $' + la.toCall}
              </button>
              {canRaise && (
                <div className="pk-raise">
                  <div className="pk-quick">
                    <button className="pk-btn pk-btn-quick" onClick={() => setRaiseTo(clampRaise(raiseMin))}>Min</button>
                    <button className="pk-btn pk-btn-quick" onClick={() => setRaiseTo(potRaise(0.5))}>½ Pot</button>
                    <button className="pk-btn pk-btn-quick" onClick={() => setRaiseTo(potRaise(1))}>Pot</button>
                    <button className="pk-btn pk-btn-allin" onClick={() => act('raise', raiseMax)}>All In</button>
                  </div>
                  <div className="pk-raise-row">
                    <input
                      className="pk-slider"
                      type="range"
                      min={raiseMin}
                      max={raiseMax}
                      step={1}
                      value={clampedRaise}
                      onChange={(e) => setRaiseTo(Number(e.target.value))}
                      aria-label="Raise to amount"
                    />
                    <button className="pk-btn pk-btn-raise" onClick={() => act('raise', clampedRaise)}>
                      Raise to ${clampedRaise}
                    </button>
                  </div>
                </div>
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
    </div>
  )
}
