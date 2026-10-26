import './cards.css'

export default function Chip({ value, onClick, disabled }) {
  return (
    <button
      type="button"
      className="chip"
      data-value={value}
      style={{ '--chip-scale': 1 + (value / 1000) * 0.2 }}
      disabled={disabled}
      aria-label={`Bet ${value}`}
      onClick={onClick}
    >
      ${value}
    </button>
  )
}
