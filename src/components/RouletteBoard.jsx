import { colorOf } from '../engine/roulette.js';

const ROWS = [[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35], [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]];

export default function RouletteBoard({ bets, onBet, disabled, winningNumber }) {
  function amountFor(type, value) {
    if (value == null) {
      return bets.filter(b => b.type === type).reduce((sum, b) => sum + b.amount, 0);
    }
    return bets.filter(b => b.type === type && b.value === value).reduce((sum, b) => sum + b.amount, 0);
  }

  function Cell({ type, value, className, title, children }) {
    return (
      <button
        type='button'
        className={'rb-cell ' + className}
        title={title}
        disabled={disabled}
        onClick={() => onBet(type, value)}
      >
        {children}
        {amountFor(type, value) > 0 && <span className='rb-chip'>{amountFor(type, value)}</span>}
      </button>
    );
  }

  return (
    <div className={'rb-board' + (disabled ? ' rb-disabled' : '')}>
      <div className='rb-main'>
        <Cell type='straight' value={0} className='rb-zero rb-green'>0</Cell>
        <div className='rb-numbers'>
          {ROWS.map((row, i) => (
            <div key={i} className='rb-row'>
              {row.map(n => (
                <Cell
                  key={n}
                  type='straight'
                  value={n}
                  className={'rb-num rb-' + colorOf(n) + (winningNumber === n ? ' rb-win' : '')}
                >
                  {n}
                </Cell>
              ))}
            </div>
          ))}
        </div>
        <div className='rb-columns'>
          <Cell type='column' value={3} className='rb-column' title='Top row, 2 to 1'>2 to 1</Cell>
          <Cell type='column' value={2} className='rb-column' title='Middle row, 2 to 1'>2 to 1</Cell>
          <Cell type='column' value={1} className='rb-column' title='Bottom row, 2 to 1'>2 to 1</Cell>
        </div>
      </div>
      <div className='rb-dozens'>
        <Cell type='dozen' value={1} className='rb-dozen' title='1st 12, 2 to 1'>1st 12</Cell>
        <Cell type='dozen' value={2} className='rb-dozen' title='2nd 12, 2 to 1'>2nd 12</Cell>
        <Cell type='dozen' value={3} className='rb-dozen' title='3rd 12, 2 to 1'>3rd 12</Cell>
      </div>
      <div className='rb-outside'>
        <Cell type='low' value={null} className='rb-outside' title='1-18, 1 to 1'>1-18</Cell>
        <Cell type='even' value={null} className='rb-outside' title='Even, 1 to 1'>Even</Cell>
        <Cell type='red' value={null} className='rb-outside' title='Red, 1 to 1'>
          <span className='rb-diamond rb-diamond-red'></span>
        </Cell>
        <Cell type='black' value={null} className='rb-outside' title='Black, 1 to 1'>
          <span className='rb-diamond rb-diamond-black'></span>
        </Cell>
        <Cell type='odd' value={null} className='rb-outside' title='Odd, 1 to 1'>Odd</Cell>
        <Cell type='high' value={null} className='rb-outside' title='19-36, 1 to 1'>19-36</Cell>
      </div>
    </div>
  );
}
