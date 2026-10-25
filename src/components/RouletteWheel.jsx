import { useEffect, useRef } from 'react'
import { WHEEL_ORDER, colorOf } from '../engine/roulette.js'
import './rouletteWheel.css'

const WHEEL_TURNS = 5
const BALL_TURNS = 8

export default function RouletteWheel({ spinId, result, spinning, onDone }) {
  const lastSpinId = useRef(spinId)

  const slotIndex = result === null ? 0 : WHEEL_ORDER.indexOf(result)
  const slotAngle = slotIndex * 360 / 37
  const wheelEnd = WHEEL_TURNS * 360
  const ballEnd = slotAngle - BALL_TURNS * 360

  const handleEnd = (e) => {
    if (e.target === e.currentTarget && spinning && lastSpinId.current === spinId) {
      lastSpinId.current = spinId + 1
      onDone && onDone()
    }
  }

  useEffect(() => {
    if (!spinning) {
      lastSpinId.current = spinId
    }
  }, [spinning, spinId])

  return (
    <div className='rw-wrap'>
      <div
        key={'wheel-' + spinId}
        className={'rw-wheel' + (spinning ? ' rw-spinning' : '')}
        style={{ '--wheel-end': wheelEnd + 'deg' }}
      >
        {WHEEL_ORDER.map((n, i) => (
          <div
            key={n}
            className={'rw-slot rw-' + colorOf(n)}
            style={{ transform: 'rotate(' + (i * 360 / 37) + 'deg)' }}
          >
            <span className='rw-num'>{n}</span>
          </div>
        ))}
        <div className='rw-hub'></div>
      </div>
      <div
        key={'ball-' + spinId}
        className={'rw-ball-orbit' + (spinning ? ' rw-spinning' : '') + (!spinning && result !== null ? ' rw-stopped' : '')}
        style={{ '--ball-end': ballEnd + 'deg' }}
        onAnimationEnd={handleEnd}
      >
        <div className='rw-ball'></div>
      </div>
      <div className='rw-pointer'></div>
    </div>
  )
}
