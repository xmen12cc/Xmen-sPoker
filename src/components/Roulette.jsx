import React, { useState, useRef, useEffect } from 'react';
import { newRouletteGame, placeBet, clearBets, rebet, doubleBets, resolveRound, nextRoulette, spin, colorOf } from '../engine/roulette.js';
import RouletteBoard from './RouletteBoard.jsx';
import RouletteWheel from './RouletteWheel.jsx';
import Chip from './Chip.jsx';
import { play } from '../audio/sound.js';
import './roulette.css';

const CHIP_VALUES = [5, 25, 100, 500];

function staked(bets) {
  return bets.reduce((sum, b) => sum + b.amount, 0);
}

function Roulette({ onBack }) {
  const [game, setGame] = useState(() => newRouletteGame(1000));
  const [chipValue, setChipValue] = useState(25);
  const [spinId, setSpinId] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pendingNumber, setPendingNumber] = useState(null);
  const [error, setError] = useState('');
  const soundTimeouts = useRef([]);

  const clearTimers = () => {
    soundTimeouts.current.forEach((id) => clearTimeout(id));
    soundTimeouts.current = [];
  };

  useEffect(() => {
    return clearTimers;
  }, []);

  useEffect(() => {
    if (game.phase !== 'done') return;
    if (game.lastNet > 0) play('win');
    else if (game.lastNet < 0) play('lose');
    else play('push');
  }, [game.phase, game.lastNet]);

  const handleWheelDone = () => {
    if (!spinning) return;
    if (pendingNumber === null) return;
    setGame((prev) => resolveRound(prev, pendingNumber));
    setSpinning(false);
  };

  const handleBet = (type, value) => {
    if (spinning || game.phase !== 'betting') return;
    if (chipValue > game.bankroll) {
      setError(`Bankroll too low for the $${chipValue} chip`);
      return;
    }
    setGame((prev) => placeBet(prev, type, value, chipValue));
    play('chip');
    setError('');
  };

  const handleChipSelect = (v) => {
    if (spinning) return;
    setChipValue(v);
    if (v > game.bankroll) {
      setError(`Bankroll too low for the $${v} chip`);
    } else {
      setError('');
    }
  };

  const handleSpin = () => {
    if (spinning) return;
    if (game.phase !== 'betting') return;
    if (game.bets.length === 0) return;
    const n = spin();
    setPendingNumber(n);
    play('spin');

    clearTimers();
    setSpinId((id) => id + 1);
    setSpinning(true);
    setError('');

    const tickDels = [0, 150, 320, 520, 760, 1040, 1360, 1720];
    tickDels.forEach((d) => {
      soundTimeouts.current.push(setTimeout(() => play('tick'), d));
    });

    soundTimeouts.current.push(setTimeout(() => play('ballDrop'), 3600));
  };

  const handleClearBets = () => {
    if (spinning || game.phase !== 'betting' || game.bets.length === 0) return;
    setGame((prev) => clearBets(prev));
    play('check');
    setError('');
  };

  const handleRebet = () => {
    if (spinning || game.phase !== 'betting' || game.lastBets.length === 0) return;
    if (staked(game.lastBets) > game.bankroll) {
      setError('Not enough bankroll to rebet');
      return;
    }
    setGame((prev) => rebet(prev));
    play('chip');
    setError('');
  };

  const handleDouble = () => {
    if (spinning || game.phase !== 'betting' || game.bets.length === 0) return;
    if (staked(game.bets) > game.bankroll) {
      setError('Not enough bankroll to double');
      return;
    }
    setGame((prev) => doubleBets(prev));
    play('chip');
    setError('');
  };

  const handleNextRound = () => {
    setGame((prev) => nextRoulette(prev));
    setPendingNumber(null);
  };

  const handleNewGame = () => {
    clearTimers();
    setGame(newRouletteGame(1000));
    setPendingNumber(null);
    setSpinning(false);
    setError('');
  };

  const rebetDisabled = spinning || game.phase !== 'betting' || game.lastBets.length === 0 || staked(game.lastBets) > game.bankroll;
  const doubleDisabled = spinning || game.phase !== 'betting' || game.bets.length === 0 || staked(game.bets) > game.bankroll;
  const onTable = staked(game.bets);
  const outOfChips = game.bankroll <= 0 && (game.phase === 'done' || (game.phase === 'betting' && game.bets.length === 0));
  const bannerTone = game.lastNet > 0 ? 'rl-win' : game.lastNet < 0 ? 'rl-lose' : 'rl-even';

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

      <div className='rl-on-table'>On table: ${onTable}</div>

      <RouletteBoard
        bets={game.bets}
        onBet={handleBet}
        disabled={spinning || game.phase !== 'betting'}
        winningNumber={game.phase === 'done' ? game.lastNumber : null}
      />

      <div className='rl-chips'>
        {CHIP_VALUES.map((v) => (
          <div key={v} className={'rl-chip-wrap' + (chipValue === v ? ' rl-chip-selected' : '')}>
            <Chip value={v} onClick={() => handleChipSelect(v)} disabled={spinning || v > game.bankroll} />
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
          className='rl-btn rl-rebet'
          onClick={handleRebet}
          disabled={rebetDisabled}
        >
          Rebet
        </button>
        <button
          className='rl-btn rl-double'
          onClick={handleDouble}
          disabled={doubleDisabled}
        >
          Double
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
        <div className='rl-result'>
          <div className={'rl-result-badge rl-badge-' + colorOf(game.lastNumber)}>
            {game.lastNumber}
          </div>
          <div className={'rl-banner ' + bannerTone + (game.lastNet !== 0 ? ' rl-pulse' : '')}>
            {game.message}
          </div>
        </div>
      )}

      {game.phase === 'done' && !outOfChips && (
        <button className='rl-btn rl-next' onClick={handleNextRound}>
          Next Round
        </button>
      )}

      {outOfChips && (
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
          {game.history.length === 0 ? (
            <span className='rl-history-empty'>No spins yet</span>
          ) : (
            game.history.map((n, index) => (
              <span key={index} className={'rl-hist rl-hist-' + colorOf(n)}>
                {n}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Roulette;
