# LasPoly Web Rebuild — Changelog & Decisions

Living record of what was built, every bug fixed, and every non-obvious decision.
Newest first. Design rationale lives in [superpowers/specs](superpowers/specs/);
per-task plans in [superpowers/plans](superpowers/plans/).

## 2026-07-04 — "The Back Room" visual overhaul (phases 0–6)

Design source of truth: [../docs/idea-brief.md](../docs/idea-brief.md); plan:
[superpowers/plans/back-room-overhaul.md](superpowers/plans/back-room-overhaul.md).
Commits `10107b4..` on `random-fable-enhancements`.

- **Phase 0** — vendored CC0/OFL assets (Fraunces/Inter woff2, dark-wood PBR, warm HDRI;
  `public/assets/ASSETS.md`) + `tools/capture.ts` screenshot gate harness.
- **Phase 1** — the scene became a room: starfield + neon rim deleted, single BACK_ROOM palette
  (neon/classic 3D theme system removed), PBR walnut table, warm key light + shadows + vignette,
  wrought-iron jail, muted group-colour bars.
- **Phase 2** — all CSS extracted to `styles/tokens.css` (+ legacy-alias bridge) / `styles/ui.css`;
  3-zone HUD (player rail with chip discs / table plaque / your rail with capital chip stack);
  event log → hover-expanding ticker; turn timer visible only ≤15 s; DOM theme toggle removed;
  on-board seat money displays deleted; figure names localized.
- **Phase 3** — `director.ts`: all camera movement through one turn grammar (focus → dice → follow
  → present → release), full vs calm intensity, user pointer always wins, reduced-motion cuts.
- **Phase 4** — `ui/deed-card.ts`: one paper deed card as buy prompt (rises from the landed tile via
  `Board3D.projectTile`, Kaufen/Ablehnen printed on it), inspector, and prop/trade item styling.
  Contrast-aware band ink for light group colours.
- **Phase 5** — money made visible: engine emits rent-modifier events (`rentMod*` — monopoly,
  recession, street party, circus, power outage) with DE/EN templates; chips arc payer→payee
  (`board3d/chips.ts`); signed deltas float off the player rail; economy-phase changes pulse the
  plaque.
- **Phase 6** — dead paths removed (empty `handleEvents`, canvas money floats, `buy.header` keys,
  `makeWoodTexture`), HANDOFF rewritten, pre-existing e2e failures baseline-documented (A/B stash
  runs distinguish them from overhaul regressions).

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

### UI overlay pass (QA round) — done
- Header no longer overlaps panels; action-card popup shows localized text for own draws only (others
  to the log); click a tile (or a property in the panel) → full deed card (rent table, costs,
  mortgage, owner) in LPD; per-round special-event toast; language DE/EN toggle wired (per-recipient
  server formatting) + persisted; "?" help dialog closable (X + Esc); lobby figure/colour picker;
  clean return-to-lobby after game-over/leave (no "already in a room").

### Animation, balance-2, and live-bug round — done
- **Engine bugs:** travel-into-bankruptcy deadlock; broadcast card double-bankruptcy; swap re-verify
  mortgage/buildings; hotel-sell deadlock; localized all 26 action-card names; travel once per turn.
- **Balance v2:** single-street hotels rushed by ~round 3 caused ~70% of eliminations. Fix:
  **one building per turn** (classic rule, stops the rush) + ban only single-street **hotels** (houses
  still allowed). Result: 4p termination 56%→**98.5%**, no round-1–3 KOs, early-KO 3.5%. Softened
  `helicopterFlight`/`youGotPromoted`.
- **QoL foundation (server/engine):** net-worth, surrender, lobby game settings (starting-capital /
  building-cost multipliers, bot difficulty), rematch/restart, ready-up, turn-timer + AFK auto-action.
- **Animation queue deadlock:** move/dice/subway animations resolved only via the render loop; in
  headless / throttled rAF they never resolved → serial queue froze (and could freeze the live game).
  Fix: every animation now has a **force-complete safety timer** (snap to destination + resolve), so
  the game can never deadlock. Removed the dice number overlay — the pip faces show the value.
- **Start blocker:** humans now default `ready=true` (ready-up no longer stalls "Warte auf Spielstart").
- **WebSocket port:** client connects to the page's own origin host:port (`wss:` on https), so
  `docker -p 8081:8080` works; `VITE_WS_URL` overrides for split-port dev/e2e.
- **Street labels:** read from OUTSIDE every edge (removed the upside-down top/left flip); doubled
  texture resolution + fonts for crispness; zeroed specular (no top-down glare).

### Live-test round 2 (turn flow, animation order, lobby, i18n) — done
- **Explicit end-of-turn:** a human's turn now ends on a "Zug beenden" confirm (or the 60s timer);
  management (build/mortgage/trade/travel) allowed during the turn-end window. Bots/timer auto-end.
- **Strict serial animation:** dice → token move → action-card popup play one after another; the buy
  prompt and card popup appear only after the token lands; bots animate sequentially.
- **Clockwise movement** (tile layout Z-negated); roll button hides on click; own action-card popup
  waits for Confirm; action-card text now explains the effect + amount.
- **Dice cup** bigger and fixed on its felt spot; dice hidden until the cup lifts, then shown with pip
  faces. Board houses/hotels/factories render reliably.
- **Lobby figure picker** shows car-model thumbnails; colour is unique per player (taken colours greyed).
- **Full client i18n + working language switch:** ~120 DE/EN UI strings + per-player `setLocale`
  (server formats events in the player's locale). Toggle flips the whole UI for that player only.
- **"Mein Eigentum"** (renamed) always visible with own cash; illegal actions greyed; build costs show
  the halved value during the Building-Sale event.
- **Leave** fully exits to the lobby; **street labels** sharper (2048px + anisotropic); **jail siren** trimmed to ~1.2s.
- Known minor leftovers: the turn toast string and a couple historical log lines aren't re-localized;
  dice cup sits slightly toward the top edge.

### Audit round 3 (full QA + code review + QoL gaps) — done
- **Gameplay (engine/server):** bot colours/figures now unique among ALL players (was only vs humans);
  rematch no longer freezes (schedules bots/timer); pay-ransom GO exploit fixed (token reset to 0);
  casino action-card backward-teleport no longer grants free GO; **casino re-rolls fresh dice on
  landing** to decide the payout; bot build-cost crash fixed (+ scheduleBotSteps try/catch);
  **single-street rebalanced** (house cost up, 3-/4-house rent capped to ≤~40% of starting cash so a
  lone street can't one-shot a healthy player); game-settings multipliers clamped.
- **Board-3D:** dice cup rebuilt procedurally (double-sided, bigger, re-shown every roll — fixes the
  half-render + invisible-after-first-roll); **real distinct dice pips** on all six faces (face-UV
  atlas); **wood-grain table texture**; movement strictly after the dice settle; **crisp labels**
  (root cause: mipmaps were OFF → aliasing; now mipmaps + trilinear + anisotropic at 1024px).
- **Client:** leave works as a spectator; **generated/royalty-free background music** + separate
  SFX/Music volume sliders (no copyrighted tracks shipped); remaining German strings localized
  (turn toast, "(Knast)", Bau-Rabatt, tooltips, deed rows); **turn-timer countdown** in the header.
- **QoL batch B:** player inspector (click a player → holdings + net worth); net-worth ranking badges;
  ready-up toggle; surrender + leave-confirm; rematch "Neues Spiel" button; host lobby game-settings UI.
- Verified: 526 unit tests, balance sim 93% finish / 1.5% early-KO / median first-elim turn 90.
- Known follow-ups: some CI specs (management/playthrough/qa-full-game) time out because they need a
  full game-over (slow with bots) — flaky, not product bugs; optional 3D figure preview in the picker.

### Live-test round 4 — done
- **Animation:** dice promise now waits the full ~1550 ms visual (was an early-resolve race that let
  the token move during the cup); `showCup()` hides the previous roll's dice so a turn awaiting a roll
  shows the cup, not leftover dice.
- **Labels:** root-caused the "pixelig" complaint — the label texture had mipmaps OFF (aliasing);
  enabled mipmaps + trilinear + anisotropic at 1024 px; later set a single uniform font size for all tiles.
- **Lobby:** figure picker shows the actual car-model thumbnails labelled Car 1–5 / Police per colour row;
  lobby/room panel no longer clipped at the top (max-height + internal scroll).
- **Player list:** removed the $-chip-icon clutter (kept LPD amount + net-worth rank).
- **Deed card:** highlights the currently-applicable rent/cost row based on the property's buildings.
- **Action card:** popup now reads as a bold title + effect description on separate lines.
- **Audio:** background music is now a synthesized melodic loop (not a drone); separate SFX/Music
  volume sliders. The original copyrighted tracks (Frank Sinatra etc.) are NOT shipped — instead the
  player can drop the originals into `public/assets/music/` for LOCAL/private use (gitignored +
  excluded from the Docker image); deployed builds fall back to the synth loop.
- Verified: 526 unit tests, sim 93 % finish / median first-elim turn 90.

### Live-test round 5 (14-bug pass) — done
- **Names (1):** floating token name billboards halved (0.9→0.45 plane), uniform across all tokens.
- **Colour/figure (2):** colour is now server-assigned and shown read-only; the player only picks a
  **vehicle**, rendered as a live auto-rotating **3D model** (new `figurePreview.ts`, own Babylon
  engine) tinted in their colour. `figureIndex` threaded through `PlayerState`/`createGame`/`room` so
  the chosen model is the in-game token (police model now loaded; token = `player.figureIndex`).
- **HUD row (3):** cash `LPD …` moved to its own line under the net-worth badge (was glued to "NW").
- **Dice/cup/move (4/5/6):** `playDiceAnimationAsync` now resolves EXACTLY when the dice settle (was a
  fixed 1.55 s timeout that fired mid-shake — shake itself ran 2 s, so the token moved while the cup
  was still up and dice hidden). Shake shortened to ~0.5 s; order is now cup → reveal dice → move.
- **Header (7):** `height:48px` → `min-height` + vertical padding so a 4-line centre grows downward
  instead of clipping the top line.
- **Wood (8a):** table enlarged 30→48 and tiling 3→5 so the wood fills the view (no dark backdrop gap).
- **Jail (8b):** `PAY_RANSOM` restarts the freed player on the **P field (pos 10)**, not GO; the client
  snaps the token there (no phantom walk) and rolls from there. Test updated.
- **Action card (9):** popup is now card **title** + **what to do** + Bestätigen (built from the effect
  event "Card: effect", falling back to the draw event for the name).
- **Station travel (10):** only offered in `turn-end` (after rolling and landing), not at turn start.
- **Deed card (11):** refreshes live while open (e.g. after buying a house on it).
- **Deed card (12):** "Tauschen" button on another player's deed opens the trade dialog pre-targeted at
  that owner.
- **Trade dialog (13):** no longer closed on turn change (kept open, selections preserved).
- **Dice faces (14):** face/atlas mapping rebuilt to Babylon's real box-face order; corrected the
  left-handed X-rotation (values 2/5 were inverted). Verified live: rolled "1 und 4" → dice show 1 + 4.
- Tooling: excluded `**/.claude/**` from vitest (a stale agent worktree was double-running the suite).
- Verified: 308 unit tests green; visuals confirmed by Playwright/WebGL screenshots (dice, picker,
  header, wood, HUD). Pre-existing `fix3-4` e2e still fails (clicks Leave once but never confirms the
  leave dialog — predates the confirm flow, unrelated to this pass).

### Live-test round 6 (8-bug pass) — done
- **Street labels (1):** non-corner tile name font halved (148→74 px) so names are 50% smaller, uniform.
- **Lobby scrollbar (2):** inputs/selects were `width:100%` + padding without `box-sizing`, overflowing
  the panel by 20 px → added `box-sizing:border-box`. No more horizontal scrollbar.
- **Audio settings at start (3):** added a ⚙ button to the lobby that opens the settings overlay; moved
  the overlay from `gameHud` (hidden in lobby) to `root` so it shows before a game starts.
- **Dice faces (4):** root-caused the persistent mis-read — the previous "fix" was validated with the
  rotationally-symmetric values 1 & 4. Rebuilt `orientDie` with quaternions and **verified all of 1–6
  in both views** via a scripted matrix; added a ~34° camera-ward tilt so the rolled value is the
  dominant, readable face in the standard (angled) view, not a foreshortened top quad.
- **Header overlap (5):** all top-anchored HUD panels/dialogs (player list, Mein Eigentum, settings,
  help, deed card, special-event toast, inspector, confirm popups) moved from top:56/64 → top:80 so the
  taller multi-line header never covers them.
- **BGM reset (6):** the client calls `startBgm("game")` on every state message and `start()` did
  `if (running) stop()` — so every roll/SFX restarted the music. `start()` is now idempotent per mode.
- **Active-player indicator (7):** replaced the flat disc *under* the token (which also showed under
  jailed players in the cage) with a bobbing, spinning downward cone hovering *above* the active token.
- **Casino roll (8):** landing on the casino now pauses in a new `awaiting-casino` phase; the player
  rolls the casino dice themselves via a new `ROLL_CASINO` command (button + dice-cup, phase-aware).
  Bots/turn-timer auto-roll it. Engine/bot/server/i18n + casino unit tests updated.
- Verified: 308 unit tests green; dice (all 6 values), lobby, header offsets, active indicator and the
  3D figure preview confirmed via Playwright/WebGL screenshots.

### Live-test round 7 (2 follow-ups) — done
- **Dice lie flat again:** round 6's camera-ward tilt made the dice look "schräg". Reverted the tilt —
  dice now lie flat on the felt with the rolled value face-up (orientation still verified for 1–6).
- **Room-panel h-scrollbar:** off-screen `<select>` `<option>`s pushed `scrollWidth` ~4px past the
  panel. Added `overflow-x: hidden` to `#lobby` and `#roomPanel` so no horizontal scrollbar ever shows.
- Verified: 308 unit tests green; flat dice + no scrollbar confirmed via screenshots.

## Open / in progress — animation & render polish (next)

- Client animation QUEUE: play each player's dice+move animation to completion before applying the
  next state; buy prompt only when the token LANDS; no random jumps / forward-then-back snap; bots
  can't appear to move simultaneously.
- Real dice pip faces (drop the number overlay); labels not covered by colour bar; fix upside-down /
  outside labels on 2 edges; larger/crisper labels (readable in standard + top-down); LPD (not €) in
  on-board displays; subway-dive animation for station travel (underground model); travel once/round.
- Clarify: the "Sobald ich die Kamera bewege …" request was cut off.
- `web-rebuild` branch not yet merged to `main` / pushed (awaiting user go-ahead).
