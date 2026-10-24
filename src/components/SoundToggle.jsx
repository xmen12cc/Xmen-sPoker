import { useState } from 'react'
import { isMuted, toggleMuted, play } from '../audio/sound.js'
import './soundToggle.css'

export default function SoundToggle() {
  const [muted, setMuted] = useState(isMuted())

  function handleClick() {
    const nowMuted = toggleMuted()
    setMuted(nowMuted)
    if (!nowMuted) {
      play('button')
    }
  }

  return (
    <button
      className="sound-toggle"
      type="button"
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      title={muted ? 'Unmute sound' : 'Mute sound'}
      onClick={handleClick}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
        {!muted && (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        )}
        {muted && (
          <>
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        )}
      </svg>
    </button>
  )
}
