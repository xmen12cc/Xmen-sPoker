// parents should change the key prop when the mood changes so one-shot animations restart.
import './dealer.css';

export default function Dealer({ mood = 'idle', size = 160 }) {
  const cls = 'dealer dealer-' + mood;

  return (
    <div className={cls} style={{ width: size, height: size * 140 / 120 }}>
      <svg viewBox='0 0 120 140' width='100%' height='100%' role='img' aria-label='Dealer'>
        <g className='dealer-body'>
          {/* torso */}
          <rect x={30} y={80} width={60} height={60} rx={10} fill='#1b1b2f' />
          {/* white shirt triangle */}
          <polygon points='50,80 70,80 60,115' fill='#ffffff' />
          {/* red bow tie */}
          <polygon points='54,84 60,92 66,84' fill='#c0392b' />
          <polygon points='54,84 60,76 66,84' fill='#c0392b' />
          {/* head */}
          <circle cx={60} cy={52} r={24} fill='#f1c27d' />
          {/* dealer visor */}
          <rect x={38} y={30} width={44} height={9} rx={4} fill='#2d5a27' />
          <rect x={38} y={37} width={44} height={2} fill='#ffd700' />
          {/* eyes */}
          <g className='dealer-eyes'>
            <circle cx={50} cy={50} r={4.5} fill='#ffffff' />
            <circle cx={50} cy={50} r={2} fill='#222' />
            <circle cx={70} cy={50} r={4.5} fill='#ffffff' />
            <circle cx={70} cy={50} r={2} fill='#222' />
          </g>
          {/* eyebrows */}
          {mood === 'idle' && (
            <>
              <line x1={45} y1={43} x2={55} y2={43} stroke='#333' strokeWidth={2} strokeLinecap='round' />
              <line x1={65} y1={43} x2={75} y2={43} stroke='#333' strokeWidth={2} strokeLinecap='round' />
            </>
          )}
          {mood === 'dealing' && (
            <>
              <line x1={45} y1={43} x2={55} y2={43} stroke='#333' strokeWidth={2} strokeLinecap='round' />
              <line x1={65} y1={43} x2={75} y2={43} stroke='#333' strokeWidth={2} strokeLinecap='round' />
            </>
          )}
          {mood === 'happy' && (
            <>
              <line x1={45} y1={43} x2={55} y2={43} stroke='#333' strokeWidth={2} strokeLinecap='round' />
              <line x1={65} y1={43} x2={75} y2={43} stroke='#333' strokeWidth={2} strokeLinecap='round' />
            </>
          )}
          {mood === 'sad' && (
            <>
              <line x1={45} y1={45} x2={55} y2={41} stroke='#333' strokeWidth={2} strokeLinecap='round' />
              <line x1={65} y1={41} x2={75} y2={45} stroke='#333' strokeWidth={2} strokeLinecap='round' />
            </>
          )}
          {/* mouth */}
          {mood === 'idle' && (
            <path d='M52 62 Q60 68 68 62' fill='none' stroke='#7a2e2e' strokeWidth={1.5} strokeLinecap='round' />
          )}
          {mood === 'dealing' && (
            <path d='M52 62 Q60 68 68 62' fill='none' stroke='#7a2e2e' strokeWidth={1.5} strokeLinecap='round' />
          )}
          {mood === 'happy' && (
            <path d='M48 60 Q60 76 72 60 Z' fill='none' stroke='#7a2e2e' strokeWidth={1.5} strokeLinecap='round' />
          )}
          {mood === 'sad' && (
            <path d='M52 68 Q60 60 68 68' fill='none' stroke='#7a2e2e' strokeWidth={1.5} strokeLinecap='round' />
          )}
          {/* left arm */}
          <g className='dealer-arm-left'>
            <line x1={34} y1={88} x2={16} y2={112} stroke='#1b1b2f' strokeWidth={9} strokeLinecap='round' />
            <circle cx={16} cy={112} r={6} fill='#f1c27d' />
          </g>
          {/* right arm */}
          <g className='dealer-arm-right'>
            <line x1={86} y1={88} x2={104} y2={112} stroke='#1b1b2f' strokeWidth={9} strokeLinecap='round' />
            <circle cx={104} cy={112} r={6} fill='#f1c27d' />
          </g>
          {/* dealing card - only when mood === 'dealing' */}
          {mood === 'dealing' && (
            <rect className='dealer-card' x={98} y={100} width={12} height={17} rx={2} fill='#fff' stroke='#999' />
          )}
        </g>
      </svg>
    </div>
  );
}
