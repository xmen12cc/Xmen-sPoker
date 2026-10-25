# Xmen's Poker

A Vite + React casino game application featuring Blackjack and Texas Hold'em.

## Quick Start

**Requirements:** Node.js 18 or newer and npm

1. Clone or open the project folder
2. Run `npm install`
3. Run `npm run dev`
4. Open the printed local URL (usually http://localhost:5173) in a browser

## Other commands

- `npm test` — runs the unit tests
- `npm run build` — production build into dist/
- `npm run preview` — serve the production build locally

## Features

**Blackjack:**
- 6-deck shoe with full deck management
- Hit, stand and double down actions
- Blackjack pays 3:2
- Dealer stands on 17
- Animated dealer shown at the table

**Texas Hold'em:**
- Heads-up vs the casino AI
- 10/20 blind structure
- Fold, check, call, raise, and all-in actions
- Showdown with best 5 of 7 cards
- Animated dealer shown at the table

**Roulette:**
- European single-zero wheel with 37 pockets
- Animated wheel and ball
- Bets on straight numbers, red/black, odd/even, 1–18/19–36, dozens and columns
- Payouts: straight 35:1, dozens and columns 2:1, even-money bets 1:1
- Zero loses all outside bets
- Rebet re-places the previous round's bets; Double doubles the bets on the table (both only when affordable)
- After each spin a coloured badge shows the winning number and a banner shows the net result
- Start with a 1000 bankroll; choose a chip value, click the board to place bets, then spin

**Audio:**
- Synthesized sound effects (Web Audio API, no audio files)
- Play card deals, chip sounds, button clicks, card flips, bets, folds, checks, wins, and losses
- Mute button in the top-right corner
- Mute state is remembered between visits

## How to Play

**Blackjack** — pick chips then press Deal, use Hit/Stand/Double, press Next Hand.

**Texas Hold'em** — the casino acts automatically after you, use the raise slider or all-in, the casino's cards are revealed at showdown; if you run out of chips press New Game.

**Roulette** — European single-zero wheel with 37 pockets. Place bets on straight numbers, red/black, odd/even, 1–18/19–36, dozens and columns. Payouts: straight 35:1, dozens and columns 2:1, even-money bets 1:1. The zero loses all outside bets. Start with a 1000 bankroll, choose a chip value, click the board to place bets, then press Spin. Rebet puts the previous round's bets back and Double doubles what is on the table, both only when the bankroll allows. After the spin the winning number is shown in a coloured badge with the net result in a banner; if you run out of chips press New Game.

## Project Structure

- `src/engine/`: Core game logic
  - `cards.js`: Deck creation, shuffling, card utilities
  - `blackjack.js`: Blackjack game rules and state machine
  - `poker.js`: Heads-up Texas Hold'em state machine (blinds, betting rounds, showdown)
  - `pokerEval.js`: 5-card and best-of-7 hand ranking and comparison
  - `pokerAI.js`: Casino AI decision logic
  - `roulette.js`: European roulette game rules and state machine
- `src/components/`: React UI components
  - `Blackjack.jsx`: Blackjack game component
  - `Poker.jsx`: Texas Hold'em game component
  - `Roulette.jsx`: Roulette game component
  - `RouletteBoard.jsx`: Roulette betting board component
  - `RouletteWheel.jsx`: Animated roulette wheel component
  - `Dealer.jsx`: Animated dealer component
  - `SoundToggle.jsx`: Mute/unmute toggle component
  - `PlayingCard.jsx`: Card rendering component
  - `Chip.jsx`: Chip betting component
- `src/audio/`: Audio utilities
  - `sound.js`: Web Audio API synthesizer (no audio files), mute toggle
- `src/components/**/*.css`: Styling for all components
- `src/engine/*.test.js`: Unit tests for game logic

## Scripts

```bash
npm install      # Install dependencies
npm run dev      # Start development server
npm test         # Run all tests
npm run build    # Build for production
npm run preview  # Preview production build
```