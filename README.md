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

**Texas Hold'em:**
- Heads-up vs the casino AI
- 10/20 blind structure
- Fold, check, call, raise, and all-in actions
- Showdown with best 5 of 7 cards

## How to Play

**Blackjack:** Aim for 21 without busting. Beat the dealer's hand to win.

**Texas Hold'em:** Use your 2 hole cards combined with 5 community cards to make the best 5-card hand.

## How to Play

- **Blackjack** — pick chips then press Deal, use Hit/Stand/Double, press Next Hand
- **Texas Hold'em** — the casino acts automatically after you, use the raise slider or all-in, the casino's cards are revealed at showdown; if you run out of chips press New Game

## Project Structure

- `src/engine/`: Core game logic
  - `cards.js`: Deck creation, shuffling, card utilities
  - `blackjack.js`: Blackjack game rules and state machine
  - `poker.js`: Heads-up Texas Hold'em state machine (blinds, betting rounds, showdown)
  - `pokerEval.js`: 5-card and best-of-7 hand ranking and comparison
  - `pokerAI.js`: Casino AI decision logic
- `src/components/`: React UI components
  - `Blackjack.jsx`: Blackjack game component
  - `Poker.jsx`: Texas Hold'em game component
  - `PlayingCard.jsx`: Card rendering component
  - `Chip.jsx`: Chip betting component

## Scripts

```bash
npm install      # Install dependencies
npm run dev      # Start development server
npm test         # Run all tests
npm run build    # Build for production
npm run preview  # Preview production build
```