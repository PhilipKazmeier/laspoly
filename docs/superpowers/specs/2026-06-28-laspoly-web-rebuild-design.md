# LasPoly Web Rebuild — Design

**Date:** 2026-06-28
**Status:** Approved (proceed autonomously, phased)

## Goal

Rebuild the decompiled JavaFX 3D Monopoly-style game **LasPoly** as a modern, browser-playable
3D game on a Node/TypeScript + Babylon.js stack. Reproduce the original gameplay faithfully, fix
its bugs and balancing, and layer in a set of requested improvements. Ship as a Docker container.

## Stack decisions

- **Monorepo:** npm workspaces, TypeScript everywhere.
- **Client:** Vite + Babylon.js (3D), HTML/CSS overlay for UI (non-modal panels).
- **Server:** Node + `ws` (plain WebSocket, JSON protocol). Authoritative game state. In-memory.
- **Rule engine:** lives in `packages/shared` as a **pure, deterministic reducer** — no I/O, seedable
  RNG. Same engine runs on the server (authoritative), drives bots, and powers headless tests.
- **Accounts:** none. Nickname per room (the original's register/login is overkill for a party game).
- **Art direction:** refreshed Las-Vegas-neon identity, original asset names kept, new/polished assets.

```
packages/
  shared/   types, board schema, action protocol, rule engine (pure), RNG, i18n message templates
  server/   ws server, lobby + rooms, authoritative game loop, bot driver
  client/   Babylon scene, HTML overlay UI, ws client
boards/     vegas.json (original 1:1), oehringen.json, heilbronn.json   (extendable)
```

## Why a pure rule engine

A single `reduce(state, command, rng) -> { state, events[] }` is the spine:
- **Security** — server computes all money/state; client only sends intent commands. Kills the
  original's whole class of "client controls money" bugs.
- **Self-testing** — full games simulate headlessly in Node; assert invariants (money conserved,
  no negative balance unless bankrupt, game terminates) over thousands of seeded games.
- **Bots & replay** — bots call the same engine to evaluate moves; seeded RNG makes runs reproducible.

## Original game facts (extracted from source — authoritative)

- **Board:** 40 tracked fields (`TRACK_SIZE=40`), internal index 40 = Prison corner. `wrap = floorMod(pos+steps, 40)`.
- **Field order** (from `FieldConfiguration.loadFields`): 0 GO, 1 Arndt Ave, 2 PayToCasino(100), 3 Frank Sinatra Route,
  4 Winnick Way, 5 Caesar Station, 6 Rochelle St, 7 ActionField, 8 Jacoby St, 9 Singer Route, 10 Free Parking,
  11 Fulano, 12 Big Wheel (attraction), 13 West Ave, 14 Monterro Fwy, 15 Westgate Station, 16 Hardwick St,
  17 ActionField, 18 Park Road, 19 Casino Street, 20 Casino, 21 St Louis Square, 22 ActionField, 23 Bellagio Path,
  24 Kennedy Ave, 25 Linq Station, 26 Theresia Fwy, 27 Circus (attraction), 28 Douglas Promenade, 29 Heaven Ave,
  30 Go-To-Prison, 31 Edison Walker St, 32 ActionField, 33 Crosswood Ave, 34 Showcase Road, 35 Grand Central Station,
  36 PayToCasino(100), 37 Winchester 95, 38 Paradise Road, 39 Las Vegas Strip; corner 40 Prison.
- **Color groups (12):** brown, deeppink, turquoise, violet, mistyrose, orange, lightgreen, red, yellow,
  darkviolet, darkgreen, royalblue. Plus station group (4) and attraction group (2).
- **`StreetPriceInfo` 12-int layout** = `[price, mortgage, houseCost, hotelCost, factoryCost, factoryRevenue, baseRent, rent1H, rent2H, rent3H, rent4H, rentHotel]`. (Verified: index1 = price/2 = mortgage.)
- **Street rent** (`Street.onFigureEntered`): no buildings → baseRent, ×2 if owner holds the full group;
  1 house → rent1H, …, 4 houses → rent4H, hotel → rentHotel; **factory** owned by self pays `factoryRevenue` to self.
  Mortgaged → no rent. Can't pay → `kickPlayer(lostNoMoneyLeft)`.
- **Constants:** `INITIAL_CAPITAL=1300`, GO land `ON_START_MONEY=400`, GO pass `OVER_START_MONEY=200`,
  `PAY_TO_CASINO=100`, `RANSOM_COSTS=50`, `MORTGAGE_MULTIPLIER=1.1` (unmortgage = mortgage×1.1).
- **Building rules** (`Street.canConstruct*`): full group required; build evenly (≤1 diff in group); max 4
  houses; hotel replaces 4 houses; factory only on empty even group, excludes houses/hotels. Sell evenly.
- **Dice/turn:** 2×d6; doubles → extra roll; 3 doubles → prison. Prison counter starts at 3; pay 50, roll
  doubles, or auto-release after counter expires.
- **Casino (field 20):** jackpot pool; landing with doubles pays out a share (6 → larger share).
- **Attractions:** rent = dice sum × multiplier (×4 if 1 owned, ×10 if both).
- **Stations:** tiered rent by count owned + ticket travel between stations.
- **Action cards:** shuffled deck (move, single/broadcast transaction, repair-per-building cards).
- **Network (original):** REST + SSE, `ActionType` enum (ROLLED, MOVE_FIGURE, TRANSACTION, BUILDING,
  MORTGAGE, SWAP_OFFER, ACTION_CARD, KICK_PLAYER, NEXT_USER, FINISH, …). We replace transport with ws
  but keep the action vocabulary as our event types.

> Exact rent tables for all 24 streets live in `boards/vegas.json`, transcribed verbatim from
> `FieldConfiguration.loadStreetPriceInfos()`.

## Board / city data schema

`BoardDefinition` (JSON): `{ id, name, currency, tiles[40], groups[], decks }`. Each tile is one of:
`go | property(street) | station | attraction | tax | action | freeparking | gotoprison | casino | prison`.
Street tile carries `{ name, group, price, mortgage, houseCost, hotelCost, factoryCost, factoryRevenue, rent[6] }`.

Ships with `vegas` (original numbers), `oehringen` (74613), `heilbronn` — city variants reuse the vegas
price/rent tiers (rename only) so balancing is tuned once. New city = drop a JSON into `boards/`.

## Bug fixes carried over

All fixes recorded in `bugs.md` (insufficient-funds rejection, double GO payout, prison release count,
casino/attraction uninitialized-dice payout, swap payment atomicity, NPE guards, desync handling, …) are
designed into the engine from the start rather than patched. Plus the two new reports:
- **Non-modal dialogs** — UI is HTML overlay panels that never block the rest of the UI.
- **Balancing** — addressed via the balance harness (below).

## Balancing

Rent/price tables are the single source of balancing truth. A `balance` harness simulates N seeded
bot games and reports: median game length, bankruptcy rate, runaway-leader factor, dead-money. Tune
table values (data only — no rule changes) until games are fair. Starting capital and casino-pool size
are the primary knobs.

## Requested improvements (mapped to phases)

| # | Improvement | Phase |
|---|-------------|-------|
| Property deed cards shown on board per player | Deed stack per seat | 3 |
| Money stack visualization per player ($1/$10/$100) | Chip stacks | 3 |
| Keep gameplay, minimal optimization | balancing + bugfixes only | 0,3 |
| Security fixes | authoritative server, validation, rate limit | 0,1,4 |
| Per-round Special Event ("Circus in town") | event system | 3 |
| Complete system messages (DE/EN) | templated i18n events | 1,3 |
| Loser keeps watching | spectator mode | 3 |
| Version ID in UI | HUD badge | 1 |
| Docker, browser-playable | multi-stage image | 1 |
| Bugfixes | engine design + carryover | all |
| Design refresh + new assets | Vegas neon | 3 |
| City selection datasets | board JSON + picker | 3 |
| AI bots | shared engine driver | 1 |
| Self-testing | headless sim + Playwright | 0,4 |

## Phasing

- **Phase 0 — Foundation:** monorepo, board schema, `vegas.json`, deterministic rule engine + unit
  tests (TDD) + headless sim harness. No UI; fully testable.
- **Phase 1 — MVP slice:** ws server (lobby/rooms), minimal Babylon client: board render, roll → move →
  buy → rent → jail → bankruptcy, turn flow, chat/system messages, 1 human + bots, version badge,
  Docker, browser-playable end-to-end.
- **Phase 2 — Parity:** houses/hotel/factory, mortgage, swap/trade, action cards, casino pool, attractions,
  station travel.
- **Phase 3 — Improvements:** special events, deed cards on board, money stacks, spectator, full i18n
  messages, design refresh + assets, city datasets, balancing tuning.
- **Phase 4 — Polish:** deployment hardening, self-test suite, security pass.

## Testing strategy (continuous)

- **Engine:** Vitest unit tests per rule (TDD), driven from `boards/vegas.json`.
- **Invariants:** headless harness plays full seeded bot games and asserts money conservation, legal
  states, termination.
- **Server:** integration test for lobby/room/turn over ws.
- **UI:** Playwright smoke (load, create room, roll, see board) — also usable via the `/browse` skill.

## Out of scope (for now)

Persistent accounts/DB, ranked matchmaking, mobile-native build, sound redesign (keep/port existing).
