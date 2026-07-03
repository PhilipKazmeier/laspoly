# Implementation Plan: The Back Room Overhaul

> Source of truth for direction/scope/tokens: [docs/idea-brief.md](../../idea-brief.md). Read it first.
> Status: ready to execute · Created 2026-07-03 · Branch: continue on `random-fable-enhancements` or a new `back-room` branch off it.

Six phases, strictly ordered (each builds on the last). Every phase ends with a **verification gate**: capture screenshots with the harness from Phase 0 and *read them* (HANDOFF §5 — "fixed" visuals that nobody looked at were the last effort's failure mode), plus `npm test` green.

## Codebase facts this plan is built on (verified 2026-07-03)

- `src/board3d.ts` is a 3-line shim; real code is `src/board3d/` — `board3d.ts` (1259 ln), `effects.ts`, `dice.ts`, `tiles.ts`, `buildings.ts`, `constants.ts`.
- All overlay CSS is an inline template string in `ui.ts:28–636` (tokens at 30–49), injected by `injectStyles()` (ui.ts:1291). `index.html` has a second inline `<style>`. **No .css file exists.** `ui.ts` is 4170 lines.
- Camera today: `ArcRotateCamera` created at `board3d/board3d.ts:107`, instant `setView` presets (779), and a manual win-orbit (`playWinCelebration`, 1119). No tweens, no focus/follow, no Director.
- `StateQueue.processEntry` (`main.ts:98`) already sequences dice (159) → movers (171–197) → card draw (210) → money floats (221) → HUD (229–282). Director hooks go exactly there.
- Dead code: `Board3D.handleEvents` is an **empty body** (board3d.ts:774) still called from main.ts:103. (HANDOFF's mention of dead `update`/`applyStateDiffs` is stale — those are gone; update HANDOFF when touching this.)
- The "stray bot card" from the audit screenshots is the **Player Inspector** (`ui.ts:2350–2405`, CSS `#playerInspector` at 525) — a real feature, wrongly placed/styled, and it appeared without any player-row click during the audit; diagnose the unprompted trigger in Phase 2.
- Figure names are hardcoded mixed-language in `ui.ts:2636` (`"Car 1"… "🎩 Zylinder"`).
- Player colors: picker uses `FIGURE_COLORS` (shared/protocol.ts:32); 3D tokens use `PLAYER_COLOR_HEX` in `board3d/constants.ts:101–131`. The chip palette lands in both places.
- Assets on hand: `tex_felt.png`, `cardpattern.png`, dollar textures, OBJ models, 6 SFX. **No fonts, no wood texture, no HDRI.**

## Hard constraints (apply to every phase)

- **Keep existing element IDs** (`#rollBtn`, `#nickname`, `#createRoom`, `#startGame`, `#eventLog`, `#buyOfferBuyBtn`, `#endTurnBtn`, …). 17 Playwright spec files select on them. Restyle and re-parent freely; do not rename. If a panel is deleted, grep `packages/client/tests/` first and update specs in the same commit.
- **i18n:** every new user-facing string gets DE + EN keys together (`t()` client, `formatEvent` server events; `ALL_EVENT_KEYS` coverage test).
- **Engine purity:** any `shared` change stays deterministic — no `Date.now`/`Math.random`.
- **Ports:** e2e uses 8080 + 4173; kill both before/after. Never leave servers running. No Docker.
- **Tokens only:** after Phase 2, no raw hex/px in components — everything reads `tokens.css` custom properties.

---

## Phase 0 — Assets & screenshot harness (½ day)

Everything later depends on these files existing.

1. **Fonts:** download Fraunces + Inter (OFL), subset to latin + `€äöüÄÖÜß`, vendor as woff2 under `public/assets/fonts/`. Record license + source in new `public/assets/ASSETS.md`.
2. **Wood texture:** CC0 walnut/dark-oak PBR set (albedo + normal, ≤2K) → `public/assets/tex/`. Fallback if sourcing stalls: procedural wood via `DynamicTexture` gradient+grain (acceptable v1).
3. **Environment:** one small warm interior `.env`/`.hdr` (Babylon IBL) → `public/assets/env/`. Fallback: skip IBL, tune analytic lights only.
4. **Screenshot harness:** commit `packages/client/tools/capture.ts` (adapted from the session's audit script): boots a page against dev server, plays create-room → start → roll → buy with 3 bots, saves `01-lobby … 08-bots` PNGs to `test-results/capture/`. This is the verification gate tool for every phase.

**Gate:** harness runs green from a clean checkout; ASSETS.md lists every file with license.

## Phase 1 — The Room (scene rework, ~1 day)

Target: the board sits on a wood table in a warm dark room. All in `src/board3d/`.

1. **Delete the space void:** remove starfield skybox + `makeStarfieldTexture` (`effects.ts:113–…`), replace `initEnvironment` with warm near-black clear color + optional IBL from Phase 0. Keep the dust motes (`initDust`) but retint warm — dust in a key light reads as atmosphere.
2. **Delete the neon rim:** `board3d.ts:203–226` incl. its `addGlowMesh` registration. Review remaining glow users (dice cup glow `dice.ts:87`, ownership frames `buildings.ts:372`) — glow layer stays only if Phase 1 retunes them to lamplight instead of neon.
3. **Table:** enlarge the `table` mesh to fill the frame at default camera, apply wood PBR (`PBRMaterial`, albedo+normal from Phase 0); felt (`tex_felt.png`, retinted to `--color-felt` #1b3a2c) becomes an inset panel under the board center only.
4. **Lighting:** replace the 3-light rig (`board3d.ts:124–135`) with: one warm `DirectionalLight` key (~#ffd9a0, shadows on via existing `Effects.initShadows`), one very low warm hemispheric fill, vignette in the pipeline (`initPipeline`). Suppress the old `PointLight`.
5. **Props material pass:** dice cup (`dice.ts` `cupMat:79`) → dark leather/wood, brass rim; jail cage (`tiles.ts:395`) → dark iron, warm sign.
6. **Camera presets:** retune `setView` standard/top for the larger table; nudge default radius/beta so the table edge frames the shot.

**Gate:** harness screenshots show no stars, no neon, readable board, warm shadows, at both views. Read them at full size. `npm test` + smoke spec green.

## Phase 2 — tokens.css + HUD rebuild (~1½ days)

Target: three HUD zones at rest, one token system, fonts live.

1. **Extract CSS:** move `ui.ts:28–636` out of TS into `src/styles/tokens.css` (the brief §7 block, verbatim) + `src/styles/ui.css`, imported from `main.ts` (Vite bundles). Delete `injectStyles`. Move `index.html` inline styles into `ui.css`. Add `@font-face` for Fraunces/Inter.
2. **Rebuild the HUD to 3 zones** (rewrite `buildGameHud`/`buildGameHeader`, ui.ts:1433/1533):
   - **Player rail** (top-left): chip-colored cards (chip palette in both `FIGURE_COLORS` picker styling and `constants.ts PLAYER_COLOR_HEX`), name, LPD (tabular), rank; active player lifts (`--shadow-raised`).
   - **Table plaque** (top-right): round + economy phase, engraved-label style; turn timer hidden until ≤15s (`showTurnTimer`, ui.ts:2540).
   - **Your rail** (bottom-right): money as chip-stack graphic + placeholder card-fan slot (filled in Phase 4) + the one contextual action (`#rollBtn`/`#endTurnBtn` restyled brass).
3. **Event log → ticker:** one line bottom-center, hover/click expands to scrollback (keep `#eventLog` id inside). Never empty: seed with round-start line.
4. **Restyle in place (structure unchanged):** lobby, room panel, settings, chat (collapses to a bubble), toasts, trade panel — new tokens, Fraunces headings, brass focus rings, 3 radii.
5. **Bug kills:** figure names → proper DE/EN i18n keys (replace `ui.ts:2636` literals); Player Inspector — find why it opened unprompted in the audit, then restyle + dock it (opens from player-rail click, one at a time, anchored under the rail, never over the your-rail zone); remove on-board money label planes (`updatePlayerDisplays`, board3d.ts:554) — the player rail owns that info now.
6. **Split `ui.ts`** opportunistically: `ui/styles` done above; pull `ui/hud.ts`, `ui/panels.ts`, `ui/i18n.ts` as each area is rewritten. No big-bang refactor.

**Gate:** harness screenshots: at-rest frame shows exactly 3 zones + ticker; only brass as accent; fonts visibly Fraunces/Inter (check a heading and a money value). Full e2e suite runs (update selectors only where panels died). Success criterion §4.2 checked here.

## Phase 3 — The Director (~1 day)

Target: every turn plays as focus → roll → follow → resolve → release.

1. **New `src/director.ts`:** owns the `ArcRotateCamera` (Board3D exposes it or hands it over at construction). API: `focusPlayer(id)`, `diceMoment()`, `follow(tokenMesh)`, `presentTile(pos)`, `release()`, `setIntensity('full'|'calm')`, `celebrate(winnerId)`. Eased tweens on alpha/beta/radius/target (manual lerp with `--ease-out` curve or Babylon `Animation`); every move interruptible; user pointer input pauses direction for that turn (respect existing pointer-abort pattern from `playWinCelebration`).
2. **Hook into `StateQueue.processEntry`** (`main.ts`): before dice at 159 → `focusPlayer` + `diceMoment`; mover loop 171–197 → `follow`; after resolve → `release`. Intensity: `full` when `rollerId === myId`, else `calm` (calm = gentle lean toward the active quadrant, no follow).
3. **Migrate** `playWinCelebration`'s orbit into `Director.celebrate`; `setView` becomes Director presets (keep the ui.ts:1580 toggle working).
4. **Reduced motion:** `prefers-reduced-motion` ⇒ all Director moves become instant cuts (settle ≤1 frame).
5. **Repurpose or delete** the dead `handleEvents` call (main.ts:103) — either it becomes the Director's event feed or it dies; update HANDOFF's stale dead-code note either way.

**Gate:** play (don't just screenshot) one full human turn and 5 bot rounds: your turn choreographs, bot turns stay calm, dragging the camera mid-animation never fights you. Reduced-motion OS setting produces cuts. e2e green (timeouts in specs must still hold — Director adds ≤600ms per phase; if smoke times out, shorten calm-mode moves, don't raise spec timeouts).

## Phase 4 — The deed card (~1 day)

Target: one physical card component, four uses.

1. **Component** `src/ui/deed-card.ts`: paper ground, group color band, Fraunces name, rent table with current-rent row highlighted (logic exists in `showDeedCard`, ui.ts:2077), price footer, optional action buttons. Data in, DOM out; consumes tokens only.
2. **World→screen projection helper** (`board3d` exposes `projectTile(pos): {x,y}` using `Vector3.Project`), so DOM cards can anchor to tiles each frame while the camera moves.
3. **Buy prompt:** replace `buildBuyOfferPanel` (ui.ts:2042) — the card rises from the landed tile (projected anchor, `--duration-cinematic`, Director holds `presentTile`), Kaufen/Ablehnen printed on the card. Keep `#buyOfferBuyBtn`/`#buyOfferDeclineBtn` ids on the new buttons.
4. **Inspector + tile click:** `showDeedCard` popup and hover tooltip (`showDeedTooltip`, 2933) render the same component (tooltip = scaled-down, no actions).
5. **Card fan:** "Mein Eigentum" list (`buildMyPropsPanel`, 1909 / `refreshMyPropsPanel`, 3604) becomes the fan in the your-rail: face-down slot when empty, hover lifts a card, click opens it with the manage actions (mortgage/sell/build move onto the card footer).
6. **Trade panel:** offers render as small deed cards in the two-column builder instead of text rows (structure of the trade flow unchanged).

**Gate:** harness extended with a buy-moment capture: popup never precedes token landing (§4.3), card visually anchors to its tile while the camera settles. Full e2e + a manual trade round.

## Phase 5 — Money you can see (~1 day)

Target: zero money changes without visible cause (§4.1).

1. **Chips in 3D:** new `src/board3d/chips.ts` — instanced cylinder chips in the player chip colors; `flyChips(fromSeat|tile, toSeat, amount)` arcs a small stack (count ∝ log of amount), lands with the existing `rent.mp3`/`buy.mp3`.
2. **Wire into `processEntry`:** the money-diff pass (main.ts:221, currently `showMoneyFloat` canvas text) additionally derives payer→payee pairs from events (rent, buy, tax, card effects, trade) and triggers `flyChips`; `showMoneyFloat` gets replaced by DOM deltas floating off the player-rail cards (signed, `--color-ok`/`--color-danger`, tabular).
3. **Rent arithmetic:** check the rent `GameEvent` payload in `shared/types.ts` — if base rent and economy-phase multiplier aren't in it, add fields in the engine (pure change + tests) and extend DE/EN catalogues so ticker + payment toast can show "Grundmiete 80 × Rezession 1,5 = 120 LPD an Bot 2". This is the wonkiness-hypothesis test from the brief (§5).
4. **Economy-phase legibility:** phase changes get a plaque moment (Director `presentTile`-style focus on the plaque + one ticker line stating the concrete effect: "Rezession: Mieten ×1,5").

**Gate:** watch 10 bot rounds via the harness in headed mode: every LPD change has chips or a delta, every rent shows its arithmetic. Engine tests green incl. new event fields; `ALL_EVENT_KEYS` coverage passes.

## Phase 6 — Sweep & acceptance (~½ day)

1. Delete remaining dead paths (old buy panel, old money labels, unused CSS, empty `handleEvents` if not repurposed). Grep for raw hex/px outside `styles/`.
2. Update `docs/HANDOFF.md` (board3d layout, Director, styles location, stale dead-code note) and `docs/CHANGELOG.md`.
3. Full acceptance against brief §4: run the harness, produce the **before/after pair** (before-images preserved from the 2026-07-03 audit), check all four criteria, `npm test` + full e2e + `npm run sim` green, kill all ports.
4. Flinch test: side-by-side of the same buy moment, old vs new, goes to the project owner.

---

## Order rationale & risk valves

- Scene before HUD because the HUD's contrast/shadows are tuned against the real background, not the void.
- HUD before Director because choreography needs the final anchor positions (rails, plaque) to frame around.
- Cards before money because chips land relative to rails/fan positions.
- **If a phase overruns:** Phase 1 fallback = procedural wood + analytic lights only; Phase 3 fallback = full mode ships, calm mode = static; Phase 5 fallback = DOM deltas + arithmetic ship, 3D chips move to Later. Never compress the verification gates.
