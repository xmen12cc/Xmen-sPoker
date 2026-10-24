import { suitSymbol, isRed } from '../engine/cards.js'
import './cards.css'

export default function PlayingCard({ card, faceDown = false, delay = 0, label = '' }) {
  if (!card) {
    return <div className="card card-empty" />
  }
  if (faceDown) {
    return (
      <div className="card card-back" style={{ animationDelay: delay + 'ms' }}>
        <span className="card-back-label">{label}</span>
      </div>
    )
  }
  return (
    <div className={'card ' + (isRed(card.suit) ? 'red' : 'black')} style={{ animationDelay: delay + 'ms' }}>
      <span className="rank">{card.rank}</span>
      <span className="suit">{suitSymbol(card.suit)}</span>
    </div>
  )
}
