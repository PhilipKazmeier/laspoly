# LasPoly Web — Handoff / Takeover Guide

This is the single entry point for anyone (human or agent) taking over the project.
Read this, then [CHANGELOG.md](CHANGELOG.md) (full history of every fix/decision) and the
design spec in [superpowers/specs/](superpowers/specs/).

**Status:** Feature-complete and visually rebuilt ("The Back Room" overhaul, 2026-07-04 — see
docs/idea-brief.md + docs/superpowers/plans/back-room-overhaul.md): single warm-room identity,
3-zone HUD on design tokens, camera Director, deed-card system, visible money flow. 362 unit tests
green, balance sim ~90% finish, e2e green except the documented pre-existing failures (§5). Work is
on branch **`random-fable-enhancements`**, **not merged/pushed** — merge/push only when the user
asks.

---

## 1. What this is

A modern browser rebuild of the decompiled JavaFX 3D Monopoly-style game **LasPoly**
(original lives in `old-java/`, reference only — not built). Stack: TypeScript monorepo (npm
workspaces), Babylon.js 3D client, authoritative Node WebSocket server, AI bots, Docker-deployable.

## 2. Repo layout

```
packages/
  shared/   pure deterministic rule ENGINE + board data + i18n + wire protocol (no I/O)
  server/   authoritative ws + http server: rooms, lobby, bots, spectators, turn timer
  client/   Vite + Babylon.js 3D client + HTML overlay UI
old-java/   the original decompiled JavaFX game — REFERENCE ONLY (mechanics, assets, layout)
docs/       CHANGELOG.md (history), HANDOFF.md (this), superpowers/{specs,plans}
Dockerfile.web, docker-compose.web.yml, DEPLOY-WEB.md   single-container deploy
```

### packages/shared/src (the engine — start here for rules)
- `types.ts` — `GameState`, `PlayerState`, `Command` union, `GameEvent`, `GameSettings`, phases
  (`awaiting-roll | awaiting-buy | turn-end | finished`).
- `engine.ts` — **the reducer**: `createGame(opts)`, `applyCommand(state, command) → {state, events}`,
  plus pure helpers (`netWorth`, `legalCommandsFor`, `buildingChargeCost`, `canBuild`, …). All game
  rules live here. Deterministic; uses `rng.ts` only (no `Date.now`/`Math.random`).
- `rng.ts` — seedable mulberry32 (state is one uint32 inside `GameState`, so games replay exactly).
- `board.ts` — `BoardDefinition` types + registry (`getBoard`, `listBoards`), tile helpers, geometry
  constants (`TRACK_SIZE=40`, `JAIL_POS=40`).
- `boards/{vegas,oehringen,heilbronn}.json` — board data (40 tiles, groups, prices, rent tables,
  rules block). `vegas` is the original numbers; the two cities reuse the same tiers with local names.
- `i18n.ts` — `Locale`, DE/EN message catalogues for every `GameEvent` key + action-card names,
  `formatEvent(event, locale)`. `ALL_EVENT_KEYS` is coverage-tested.
- `protocol.ts` — `VERSION` + the `ClientMessage`/`ServerMessage` unions, `RoomView`/`RoomPlayer`,
  `FIGURE_COLORS`/`FIGURE_COUNT`. **This is the wire contract — read it for exact message shapes.**
- `bot.ts` — `botDecide(state) → Command` (deterministic; respects difficulty + one-build-per-turn).
- `sim.ts` — headless balance/fairness harness (`npm run sim`): plays seeded bot games, asserts
  invariants, reports finish rate / early-KO / elimination timing / snowball.
- `index.ts` — barrel re-export.

### packages/server/src
- `room.ts` — `GameRoom` (lobby players, colours/figures, ready-up, `start`/`restart`,
  `applyHumanCommand`, `stepBots`, per-locale `toView`) + `RoomManager` + `pickAutoAction` (turn-timer).
- `index.ts` — `ws` + node `http` on `PORT` (default 8080). Serves `packages/client/dist` if present
  (single-container). Handles all `ClientMessage`s, drives bots (`scheduleBotSteps`, wrapped in
  try/catch), per-room 60s `scheduleTurnTimer` (auto-END_TURN/roll on expiry), per-recipient locale
  broadcast (`broadcastState`), session resume, room cleanup, input validation + rate limit + origin
  allowlist + `/health`.

### packages/client/src
- `main.ts` — wires net + board3d + ui; **`StateQueue`** = the serial animation queue (processes one
  `state` at a time: dice → token move → HUD/popups, strictly in order so bots never overlap and the
  buy/card prompt only shows after the token lands). Also the `onMessage` switch (incl. `room`,
  `turnTimer`, `resume`).
- `board3d/` (directory; `board3d.ts` at src root is a re-export shim) — the Babylon scene.
  `board3d/board3d.ts` = orchestrator (camera, lights, PBR walnut table, tokens + movement,
  `projectTile` world→screen anchor, `flyMoney`); `tiles.ts` (board geometry, jail cage, deck);
  `dice.ts` (cup + pip dice, `playDiceAnimationAsync` waits the full visual); `buildings.ts`
  (buildings + ownership markers); `effects.ts` (vignette pipeline, glow, warm key light + shadows,
  HDRI IBL, dust); `chips.ts` (money chips arcing payer→payee); `constants.ts` (BACK_ROOM palette,
  geometry helpers, `muteColor`). **Single visual identity** — the old neon/classic theme system is
  gone (docs/idea-brief.md is the design source of truth).
- `director.ts` — ALL camera movement: turn grammar `focus → diceMoment → follow → present →
  release`, full (my turn) vs calm (bots) intensity, pointer-down = user override for that turn,
  reduced-motion → cuts. StateQueue calls it; nothing else may drive the camera.
- `styles/tokens.css` + `styles/ui.css` — the design tokens ("The Back Room", brief §7) and all
  overlay CSS (extracted from ui.ts; tokens.css still carries a legacy-alias block that shrinks as
  components are rebuilt). Fonts: vendored Fraunces + Inter (`public/assets/fonts`, see ASSETS.md).
- `ui/deed-card.ts` — THE deed card: one paper component for the buy prompt (rises from its tile,
  anchored via `projectTile`), the tile/prop inspector, and (styling) the my-properties/trade items.
- `ui.ts` — remaining HTML overlay: lobby, room (figure picker, ready-up, game-settings, share
  link), 3-zone game HUD (player rail, table plaque, your rail), event ticker (hover to expand log +
  chat), buy/build/mortgage/trade/travel flows, action-card popup, surrender/leave-confirm,
  game-over + rematch, toasts, turn-timer (visible only ≤15 s), settings, full client i18n `t()`
  table, `showMoneyDelta` (rail money floats).
- `tools/capture.ts` (`npm run capture` with dev server running) — the screenshot verification
  harness; READ its images (docs/superpowers/plans/back-room-overhaul.md gates).
- `net.ts` — typed ws wrapper; WS URL follows the page origin (`wss:` on https), `VITE_WS_URL`
  override for split-port dev/e2e; session save/load/clear.
- `audio.ts` — SFX player + `BgmPlayer` (plays original tracks from `/assets/music/*` if present,
  else a synthesized melodic loop; SFX/Music volume + mute).

## 3. Run / test / build / deploy

```bash
npm install
npm test                 # vitest: engine/server/i18n/balance — 526 tests
npm run sim              # headless balance harness
npm run dev              # server :8080 + client (Vite); open the printed URL
npm run build -w @laspoly/client
npm run test:e2e         # Playwright (client) — see gotchas below
```
Deploy: single container — see [DEPLOY-WEB.md](../DEPLOY-WEB.md) (`Dockerfile.web`). Server serves
client + ws on one port; `/health` for orchestrators; non-root; graceful SIGTERM.

## 4. Architecture in one paragraph

The **pure engine** (`shared`) is the single source of truth: `applyCommand` is a deterministic
reducer returning a new state + a list of localizable `GameEvent`s. The **server** owns the
authoritative `GameState` per room, validates every human command (turn/phase/ownership), runs bots
and the turn timer with the same engine, and broadcasts state formatted per recipient locale. The
**client** never computes game logic — it sends intent `Command`s and renders incoming `state`
through a **serial animation queue** so visuals play in order. Boards are data; the same engine powers
the server, the bots, and the headless test/balance harness.

## 5. Conventions & gotchas (IMPORTANT — these bit us repeatedly)

- **Ports:** e2e uses **8080 (server)** and **4173 (vite preview)**. Playwright config now uses
  `reuseExistingServer: true`. Always `pkill`/free 8080+4173 **before and after** running specs; leftover
  servers cause `EADDRINUSE` and "port already used" failures. Never leave servers running.
- **Do NOT crash the Docker daemon.** Earlier `docker build`/`run` loops destabilised it. The web
  image is already verified; avoid touching Docker unless explicitly asked.
- **Subagents:** when delegating implementation, instruct them to work **inline with Edit/Write/Bash
  only — do NOT call the Agent tool** (delegating subagents stalled repeatedly). Run agents that touch
  the **same files or the same ports sequentially**, not in parallel, to avoid concurrent-edit
  corruption. Different-package/no-port agents can run in parallel.
- **Verify visuals with screenshots you actually READ.** Several "fixed" visual bugs were not really
  fixed because agents trusted code over a screenshot. Capture a close-up and look at it.
- **i18n:** every user-facing string goes through `t()` (client) / `formatEvent` (server events).
  Add DE + EN keys together; `ALL_EVENT_KEYS`/i18n tests enforce coverage.
- **Determinism:** engine must stay pure — no `Date.now()`/`Math.random()`; use `state.rng`. This is
  what makes tests, replay, and bots reproducible.
- **Music licensing:** the original BGM tracks are copyrighted (incl. a Frank Sinatra song). They live
  in `packages/client/public/assets/music/` for **local/private use only** — **gitignored AND excluded
  from the Docker image**. Deployed builds fall back to the synth loop. Do not commit or ship them.
- **Commits:** keep the green-tests discipline — commit per logical change with the
  `Co-Authored-By: Claude Opus 4.8 (1M context)` trailer. Work stays on `web-rebuild`.

## 6. Testing

- Unit/integration: `npm test` (vitest) — `shared/*.test.ts` (engine, buildings, swap, special-events,
  i18n, boards, fixes) + `server/*.test.ts` (room, features, security, fixes). 526 tests.
- Balance: `npm run sim`.
- e2e: `packages/client/tests/*.spec.ts` (Playwright). The per-feature specs pass; a few full-game
  specs (`management`, `playthrough`, `qa-full-game`, `smoke`) are **flaky/slow because they need a
  full game-over** with bots — they time out in CI but are **not product bugs**. Several `g2-*.spec.ts`
  are ad-hoc verification artifacts that can be pruned.

## 7. Known issues / open items (good next tasks)

- **Bot action-card popup (QA M1):** reportedly the human sees a popup for a *bot's* card draw, but it
  could not be reproduced in tests and the `ev.playerId === myId` guard in `main.ts` looks correct.
  If seen live, inspect how the server sets `playerId` on `actionCard` events.
- **3D figure preview:** the lobby picker shows 2D model thumbnails; a true rotating 3D preview was
  deferred.
- **Flaky/slow e2e** full-game specs (see §6) — consider a server "fast game" test flag or bots-only
  assertions instead of UI-driven game-over.
- **Pre-existing e2e failures** (baseline-confirmed by A/B stash runs 2026-07-04, NOT caused by the
  back-room overhaul): `management.spec` mortgage autopilot, `playthrough.spec:88` and
  `qa-full-game.spec:130/706` (full-game 3-minute autopilots — turn animations outpace the budget),
  `ui-overlay.spec` 8 / 6+DE→EN / 9, `fix3-3` (strict-mode: two `button[title='Einstellungen']`).
  Timing-sensitive anim specs flake under parallel workers — run visual specs with `--workers=1`.
- **Balance tail:** ~7% of bot sims don't terminate within the cap when 3 wealthy players hoard cash
  (real human games end via the turn flow); revisit only if it surfaces in play.
- Deferred QoL ideas (from the audit): deed-card on hover, end-game stats screen, observe-only join on
  a started room, colour-blind palette / reduced-motion, mobile/responsive layout, persistent nickname.

## 8. "Where do I change X?" index

| Want to change… | File |
|---|---|
| A game rule, rent, jail, building, casino, action card | `packages/shared/src/engine.ts` |
| Board tiles / prices / rents / a new city | `packages/shared/boards/*.json` (+ register in `board.ts`) |
| A wire message | `packages/shared/src/protocol.ts` (+ server `index.ts` handler + client `net.ts`/`main.ts`) |
| Bot behaviour / difficulty | `packages/shared/src/bot.ts` |
| Any on-screen text / translation | `i18n.ts` (events) and `ui.ts` `t()` table (UI) |
| 3D look: board, tokens, dice, cup, labels, animations | `packages/client/src/board3d.ts` |
| HTML panels / HUD / lobby | `packages/client/src/ui.ts` |
| Turn order / when prompts appear (animation sequencing) | `packages/client/src/main.ts` (`StateQueue`) |
| Server rooms / bots / turn timer / validation | `packages/server/src/{room,index}.ts` |
| Sounds / music | `packages/client/src/audio.ts` |
| Balance tuning + measurement | `boards/*.json` rules/tiers + `packages/shared/src/sim.ts` |

## 9. History

Every fix and the rationale for each decision (architecture, balance v1/v2, the four live-test rounds)
is in [CHANGELOG.md](CHANGELOG.md). Per-task plans are in [superpowers/plans/](superpowers/plans/);
the original design/spec in [superpowers/specs/](superpowers/specs/).
