import './cards.css'

const SUIT_SYMBOLS = {
  '♠': '♠',
  '♥': '♥',
  '♦': '♦',
  '♣': '♣',
}

const RANK_LABELS = {
  'A': 'A', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
  'J': 'J', 'Q': 'Q', 'K': 'K',
}

export default function PlayingCard({ card, faceDown = false, delay = 0 }) {
  if (!card) {
    return <div className="card" style={{ opacity: 0.3, background: '#333' }} />
  }

  if (faceDown) {
    return (
      <div className="card" style={{ background: '#2a5d2a', border: '2px solid #1a3d1a' }}>
        <span style={{ fontSize: 12, color: '#8aa' }}>DEALER</span>
      </div>
    )
  }

  const isRed = card.suit === '♥' || card.suit === '♦'
  const suitSymbol = SUIT_SYMBOLS[card.suit] || card.suit
  const rankLabel = RANK_LABELS[card.rank] || card.rank

  return (
    <div className={`card ${isRed ? 'red' : 'black'}`} style={{ animationDelay: `${delay}ms` }}>
      <span className="rank">{rankLabel}</span>
      <span className="suit">{suitSymbol}</span>
    </div>
  )
}