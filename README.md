# Fake Online Store

An idle shop where nothing ships. I started this project to learn TypeScript and later rebuilt it into a
small casual game on top of the [Fake Store API](https://fakestoreapi.com/).

[LIVE DEMO](https://react-online-store-three.vercel.app/)

## How it plays

Pick a mode with the toggle in the header; both share the same cart, coins and save.

- **Cozy Room**: everything you add to the cart moves into a little room: clothes on the rail, jewelry on
  the shelf, gadgets on the desk. Tap Mochi the shopkeeper for extra coins.
- **Fake-o-Mat**: a vending machine. Punch a code like `B3` on the keypad (or your keyboard) and press
  VEND, or tap a slot twice. Sometimes an item gets stuck; shake the machine.

Tap Mochi or shake the machine for coins, then spend them on items. Every item you own earns coins per
second, including while you are away (up to the hopper's limit), and each extra copy of an item costs 15%
more. Coins also buy perks, coupons (a discount on items until the next checkout) and color themes.
Checking out prints a receipt, empties the room and awards stamps, each a permanent income boost. A short
guide explains this on the first visit. Progress is saved in the browser's local storage.

## Tech Stack

- TypeScript and React 19
- TanStack Query for the product request
- Plain CSS with custom properties for the three themes; no UI kit
- Web Audio for the sound effects, so there are no audio files to download
- Vite, Vitest and Testing Library
- Vercel

## Design notes

- The game state lives in a small external store read with `useSyncExternalStore`, not in React context.
  The clock ticks four times a second, and only the components whose slice changed re-render.
- All game rules are pure functions (`src/game/economy.ts`, `src/game/state.ts`) and are unit tested.
- Saved games and API responses are validated before use; tampered or malformed values are dropped.
- Each mode is its own lazily loaded chunk, and the landing page prefetches the products and the store code.

## Running Locally

Requires Node 22.

```bash
npm ci
npm run dev        # local dev server
npm test           # Vitest
npm run lint
npm run build      # type-check, then production build in dist/
```

Deployed on Vercel; `vercel.json` selects the Vite preset and rewrites every path to
`index.html` so `/store` works on refresh.
