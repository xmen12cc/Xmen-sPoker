import React, { useState } from 'react';
import { newRouletteGame, placeBet, clearBets, resolveRound, nextRoulette, spin, colorOf } from '../engine/roulette.js';
import RouletteBoard from './RouletteBoard.jsx';
import RouletteWheel from './RouletteWheel.jsx';
import Chip from './Chip.jsx';
import './roulette.css';

const CHIP_VALUES = [5, 25, 100, 500];

function Roulette({ onBack }) {
  const [game, setGame] = useState(() => newRouletteGame(1000));
  const [chipValue, setChipValue] = useState(25);
  const [spinId, setSpinId] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pendingNumber, setPendingNumber] = useState(null);
  const [error, setError] = useState('');

  const handleWheelDone = () => {
    if (!spinning) return;
    if (pendingNumber === null) return;
    setGame((g) => resolveRound(g, pendingNumber));
    setSpinning(false);
  };

  const handleBet = (type, value) => {
    if (spinning) return;
    try {
      setGame(placeBet(game, type, value, chipValue));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSpin = () => {
    if (spinning) return;
    if (game.phase !== 'betting') return;
    if (game.bets.length === 0) return;
    const n = spin();
    setPendingNumber(n);
    setSpinId(spinId + 1);
    setSpinning(true);
    setError('');
  };

  const handleClearBets = () => {
    setGame(clearBets(game));
    setError('');
  };

  const handleNextRound = () => {
    setGame(nextRoulette(game));
    setPendingNumber(null);
  };

  const handleNewGame = () => {
    setGame(newRouletteGame(1000));
    setPendingNumber(null);
    setSpinning(false);
    setError('');
  };

  return (
    <div className='rl-table'>
      <div className='rl-header'>
        <button className='rl-back-btn' onClick={onBack}>Back to Lobby</button>
        <div className='rl-title'>Roulette</div>
        <div className='rl-bankroll'>Bankroll: ${game.bankroll}</div>
      </div>

      <RouletteWheel
        spinId={spinId}
        result={pendingNumber !== null ? pendingNumber : game.lastNumber}
        spinning={spinning}
        onDone={handleWheelDone}
      />

      <RouletteBoard
        bets={game.bets}
        onBet={handleBet}
        disabled={spinning || game.phase !== 'betting'}
        winningNumber={game.phase === 'done' ? game.lastNumber : null}
      />

      <div className='rl-chips'>
        {CHIP_VALUES.map((v) => (
          <div key={v} className={'rl-chip-wrap' + (chipValue === v ? ' rl-chip-selected' : '')}>
            <Chip value={v} onClick={() => setChipValue(v)} disabled={spinning} />
          </div>
        ))}
      </div>

      <div className='rl-chip-value'>Chip: ${chipValue}</div>

      <div className='rl-controls'>
        <button
          className='rl-btn rl-clear'
          onClick={handleClearBets}
          disabled={game.phase !== 'betting' || spinning || game.bets.length === 0}
        >
          Clear Bets
        </button>
        <button
          className='rl-btn rl-spin'
          onClick={handleSpin}
          disabled={spinning || game.phase !== 'betting' || game.bets.length === 0}
        >
          Spin
        </button>
      </div>

      {error && <div className='rl-error'>{error}</div>}

      {game.phase === 'done' && (
        <div className={'rl-banner ' + (game.lastNet > 0 ? 'rl-win' : game.lastNet < 0 ? 'rl-lose' : 'rl-even')}>
          {game.message}
        </div>
      )}

      {game.phase === 'done' && (
        <button className='rl-btn rl-next' onClick={handleNextRound}>
          Next Round
        </button>
      )}

      {game.bankroll <= 0 && game.phase === 'betting' && game.bets.length === 0 && (
        <div className='rl-out-of-chips'>
          <div>You are out of chips!</div>
          <button className='rl-btn rl-newgame' onClick={handleNewGame}>
            New Game
          </button>
        </div>
      )}

      <div className='rl-history'>
        <div className='rl-history-title'>History</div>
        <div className='rl-history-strip'>
          {game.history.map((n, index) => (
            <span key={index} className={'rl-hist rl-hist-' + colorOf(n)}>
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Roulette;