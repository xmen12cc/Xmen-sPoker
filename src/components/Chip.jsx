import './cards.css'

export default function Chip({ value, onClick, disabled }) {
  return (
    <div
      className="chip"
      data-value={value}
      style={{ transform: `scale(${1 + (value / 1000) * 0.2})` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Bet ${value}`}
    >
      ${value}
    </div>
  )
}