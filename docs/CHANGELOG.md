# LasPoly Web Rebuild — Changelog & Decisions

Living record of what was built, every bug fixed, and every non-obvious decision.
Newest first. Design rationale lives in [superpowers/specs](superpowers/specs/);
per-task plans in [superpowers/plans](superpowers/plans/).

## Architecture decisions (why)

- **TS monorepo, pure deterministic engine in `packages/shared`.** `reduce(state, command) → {state, events}`
  with a seedable RNG (state is one uint32). One engine serves three masters: the authoritative
  server, the bots, and the headless test/balance harness. This is what makes self-testing,
  determinism, and the security model possible.
- **Authoritative WebSocket server** (`ws`, in-memory). Clients send only intent commands; the server
  computes all money/state. Kills the original's "client controls money" bug class.
- **Babylon.js client** with an HTML overlay HUD. All dialogs are NON-MODAL (a core requirement —
  the original's modal dialogs froze the whole UI).
- **Boards are data** (`packages/shared/boards/*.json`) conforming to one schema; city variants reuse
  the Vegas tiers so balancing is tuned once. New city = drop a JSON + register it.
- **Stack/transport chosen by the user:** Babylon.js + TS, MVP-slice-first, online rooms + AI bots,
  refreshed Vegas identity. Accounts intentionally omitted (nickname per room).

## Balance decisions

- **Casino swing tamed** (Phase 3c): payout shares moved into board rules and lowered
  (six 0.5→0.35, double 0.25→0.2). A single 6-double could otherwise ~double a player's cash.
  Measured: early-leader win-rate dropped to the random baseline; payout/cash swing cut 3–4×.
- **Single-street groups + building speed** (QA round): the board has four 1-street groups
  (brown/violet/lightgreen/darkviolet). Owning the one street trivially satisfies the even-build
  rule, so a player could rush 0→hotel in a single turn and one-shot opponents by ~round 3
  (measured: ~70% of all eliminations, 45% of single-hotel rents exceeded the victim's entire cash).
  - First attempt — **ban building on <2-street groups**: removed instant-KOs (17.5%→0.5%) but
    overcorrected, ~44% of games never terminated.
  - Final decision — **one building per turn** (classic Monopoly rule) + **ban only single-street
    HOTELS** (the lethal one-shot), houses still allowed but paced. Result: 4p termination
    56%→**98.5%**, zero round-1–3 rush KOs, early-KO 3.5%, median ~135 turns. Single streets still
    earn doubled monopoly base rent.
- **Action-card deck** measured fair overall (net slightly positive, only `helicopterFlight` ever
  caused bankruptcies). Softened `helicopterFlight` 50→35 and `youGotPromoted` 20→15.

## Bug fixes

### QA round (deep review — code review + balance sim + live playthrough)
- **TRAVEL into bankruptcy deadlocked the game** — the turn never advanced; now calls
  `continueOrAdvance` after the charge.
- **Broadcast "pay each player" card emitted duplicate `bankrupt` events** — loop now stops at the
  payer's bankruptcy (single event).
- **Swap could transfer a property that was mortgaged/built after the offer** — `RESPOND_SWAP`
  re-verifies mortgage/building status and rejects; offered props are locked from management while
  a swap is pending.
- **Hotel demolition deadlock** — selling a hotel set the tile to 4 houses which, beside siblings at
  4, froze the whole group (`>=` check); changed to `>` so equal counts can sell down.
- **Action-card events showed raw IDs** (`move-random`, `gamblingTax`) — all 26 cards now have
  localized DE/EN names; events render the friendly name.
- **Server "Already in a room" blocker** — after a game you couldn't create a new one;
  `createRoom`/`joinRoom` now auto-leave any stale room, and finished/empty rooms are cleaned up.
- **Language switch did nothing** — `setLocale` wired; `state` is now formatted per-recipient locale.
- (Server) **bot-step crash guard** and **`wentToJail` log key casing** — addressed in the server pass.

### Earlier
- **Zero-height HUD overlay** made the HUD invisible — full-viewport overlay with pointer-events
  passthrough.
- **create-room only worked with 3 bots** — `|| 3` masked a zero bot count; now any 0–5.
- **Reload kicked you out** — session token + `resume` message restores you into the running game.
- Plus the full set of original `old-java/bugs.md` issues, designed into the engine from the start.

## QoL / feature additions

- Per-round **Special Events** (circus, boom, recession, jackpot, building-sale, quiet day) with full
  DE/EN explanations.
- **City datasets**: Las Vegas, Öhringen (74613), Heilbronn — real local street names, identical tiers.
- **Lobby figure/colour selection** (server/protocol; unique per player).
- Money **chip stacks** and per-player **deed strips**; **header bar** (room/turn/round/event, view
  toggle, settings, help, leave, version); **spectator mode**; **chat**; reconnect.
- Visuals: wooden table, labeled tiles, jail cage, action-card deck, vehicle tokens, dice + dice-cup
  animation, figure movement, action-card reveal.

## Deployment

- Single-container `Dockerfile.web` (build client → server serves http + ws on one port). Hardened:
  non-root user, `/health`, graceful SIGTERM, `HEALTHCHECK`. CI workflow runs unit tests + build + e2e.
  See [../DEPLOY-WEB.md](../DEPLOY-WEB.md).

## Testing

- `npm test` — unit/engine/server/i18n/balance (478 tests at last count).
- `npm run sim` — headless seeded bot games with invariant checks + balance/fairness metrics.
- `npm run test:e2e` — Playwright (lobby → game → animations, screenshot-verified).

### Board-3D visual rework (QA round) — done
- Colour bars moved to the inner (centre-facing) edge; street labels horizontal + wrapping below the bar.
- Tokens shrunk + clustered so they no longer overlap; movement confirmed CLOCKWISE; backward
  teleports jump directly instead of walking the long way.
- Click the dice cup to roll; after a roll the cup vanishes and the two dice rest on the felt showing
  the real value (DynamicTexture pip faces, no reliance on OBJ face layout); the token moves only
  after the dice animation finishes.
- On-tile ownership markers (owner-colour stripe, grey if mortgaged); per-player money + deed displays
  at the four board corners; top-down view de-glared (specular zeroed, lights tuned) and readable.
- New hooks `setRollHandler` / `setTileClickHandler` (backward-compatible).

## Open / in progress

- UI pass (header overlap, action-card text display, enlarge property card, event banner, language
  toggle UI, closable "?" dialog, lobby figure picker UI, already-in-room client reset, wire
  tile-click → property-card detail popup). On-board corner panels are cramped — tidy in this pass.
- Clarify: the "Sobald ich die Kamera bewege …" request was cut off.
- `web-rebuild` branch not yet merged to `main` / pushed (awaiting user go-ahead).
