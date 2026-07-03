# Idea Brief: LasPoly — "The Back Room" Overhaul

> Status: final · Created: 2026-07-03 · Last updated: 2026-07-03
> This document is the source of truth for the visual/feel overhaul of LasPoly. Update it when decisions change.
> Scope note: this brief covers an **overhaul of the existing, feature-complete game** (see `docs/HANDOFF.md`), not a new product. Where template sections assume a greenfield app, they are adapted accordingly.

## 1. Pitch

LasPoly is mechanically complete and technically solid — deterministic engine, authoritative server, bots, i18n, 526 green tests — but it doesn't *feel* like a product: the HUD is seven unrelated floating panels over a board drifting in a purple space void, animations play in one static wide shot, and money changes hands invisibly. This overhaul gives the game one coherent identity — **a private casino back room**: the board sits on a real table in warm light, the UI becomes physical objects (deed cards, chips, a brass plaque), and every turn is choreographed by a single camera director so cause and effect are always visible.

**One-liner:** Make LasPoly feel like a filmed physical table instead of a debug view.

## 2. Problem & Audience

- **Target user:** Sven + friends/family playing in the browser; bots fill empty seats.
- **Moment of use:** casual multiplayer sessions; players range from host (expert) to first-time guests joining via share link.
- **What exists today instead:** the current client — playable but visually incoherent (space void + neon rim + paper board + felt), HUD clutter, static camera, illegible money flow. A 22-phase polish pass (2026-07-03) improved details without an art direction and did not change the verdict.
- **Why now:** the game is feature-complete; feel is the only thing between "works" and "want to play again." Diagnosis established that the failure is a *missing north star*, not missing polish — fixing it requires a directed redesign, which this brief provides.

## 3. Core Loop

A player takes a turn → the table responds like a filmed physical object (camera, dice, card, chips) → they instantly understand what changed and why → they lean in for the next turn.

## 4. Scope

| In (MVP) | Out (explicitly not) | Later |
|---|---|---|
| **Scene:** board on a real wood table in an implied warm room; starfield and neon rim deleted; felt only inside a proper inlay; warm key light + soft shadows; PBR material pass on board/dice cup/jail | New mechanics or rule changes | Mechanics tuning pass (blocked on defining "wonky" — see Open Questions) |
| **HUD redesign from scratch:** 3 zones at rest (player rail / your rail / table plaque), one token system, event log → ticker, timer hidden until 15s | New 3D models (vehicle tokens stay) | Audio re-timed to the Director's choreography |
| **The Director:** one module owning the camera; turn grammar `focus → roll → follow → resolve → release`; full choreography on your turn, calm mode for bot turns | Mobile layout | Room-screen structural redesign |
| **Deed-card system:** one physical card component = buy prompt (rises from tile), inspector, trade offer, card fan | Alternate visual themes | Per-board visual flavor |
| **Money legibility:** chips fly payer→payee, signed deltas float off player cards, rent shows its arithmetic incl. economy-phase modifiers | Lobby structural redesign (inherits tokens only) | |
| **Bug kills:** mixed-language token names ("Car 1"/"Zylinder"), stray floating bot card, on-board money label boxes | | |

**Success criteria for v1:**
1. Watch 10 rounds of a bot game: zero money changes without a visible cause on the table.
2. A screenshot at rest shows ≤3 HUD zones and exactly one accent color system.
3. Roll→move→land→buy plays as one continuous sequence — no popup before the token lands; the buy decision happens on the tile.
4. Before/after screenshots of the same moment pass the flinch test.

## 5. Risks & Assumptions

- **Riskiest assumption:** "wonky mechanics" is a *legibility* problem, not a rules problem (93% sim finish rate suggests balance is fine). — **Test:** ship money legibility + economy-phase arithmetic display first; if the game still feels wonky with visible cause-and-effect, escalate the Later mechanics audit.
- **Accepted risks:**
  - Camera motion in bot-heavy games may fatigue despite calm mode (unproven until felt).
  - Babylon scene/lighting work may eat more time than CSS work — the "GUI fix" is ~40% 3D by our own diagnosis.
  - Standalone "HUD diet" step was rejected; clutter must not survive the from-scratch HUD redesign.
- **Known alternatives / competitors:** n/a — private project; the reference bar is Balatro's felt confidence and Ubisoft-Monopoly production feel, not a market wedge.
- **Distribution plan:** n/a — share link to friends; unchanged.

## 6. Tech Stack

No new languages, frameworks, or services. Everything lands in `packages/client`.

| Layer | Choice | Notes |
|---|---|---|
| Diegetic UI (cards, prompts, HUD) | **Projected DOM**: HTML/CSS components positioned by projecting Babylon world coords → screen each frame | Full CSS typography + DE/EN reflow for free; physicality faked with CSS 3D transforms/shadows |
| Chips & money flight | 3D instanced meshes in Babylon | They're props, not text |
| Camera | `client/src/director.ts` (new) — owns the `ArcRotateCamera`, exposes the turn grammar; `StateQueue` calls it | Two intensity levels: full (your turn) / calm (bots) |
| Scene | `board3d.ts`: HDR environment + one warm key light with shadows, PBR wood/felt materials; delete starfield, neon rim, and dead `update`/`applyStateDiffs` code | HANDOFF already flags the dead code |
| Tokens | `client/src/tokens.css` (new) — Section 7 block verbatim; components consume only tokens, no raw hex | |
| Code layout | `ui.ts` splits into `ui/` modules as the HUD is rebuilt | Rebuild moment = natural split moment, not a separate refactor |
| Assets (the only liability) | Wood/felt PBR textures, one HDRI, Fraunces + Inter woff2 — all CC0/OFL, vendored into `client/public` | No CDN: deploy is a single offline-capable container |

**Rejected alternative:** In-scene UI (Babylon `AdvancedDynamicTexture` / textured card meshes) — real lighting on cards, but canvas-rasterized text loses to CSS on typography and i18n, and the deed card is 80% typography.
**Escape hatch:** if one moment demands true occlusion (e.g. trade cards sliding under tokens), that single moment gets a textured mesh later; the component API shouldn't preclude it.

## 7. Design Direction — "The Back Room"

**Brand adjectives:** crafted · warm · confident · **Reference feel:** Balatro's felt confidence; a private poker room off the Strip. Vegas without neon kitsch.
**Feel translation:** very airy density / 3 radii only (4 · 12 · pill) / extreme warm contrast (paper on near-black) / slow certain motion, no bounce / warm brass-tinted neutrals, one brass accent, paper reserved for cards. **Nothing glows unless it's lit.** No light theme by design — the game is a dark room.

**Rendered preview (approved 2026-07-03):** https://claude.ai/code/artifact/81f30ba0-d20b-46a3-9223-9348b4d73afb

### Design tokens

```css
:root {
  /* color — neutrals (warm, brass-tinted) */
  --color-bg-0: #14100c;   --color-bg-1: #1c1610;
  --color-surface-1: #221b13; --color-surface-2: #2b2218;
  --color-line: #3a2f21;
  --color-text-hi: #ede3d1;  --color-text-mid: #b8a98f;  --color-text-low: #85765f;
  /* color — materials */
  --color-felt: #1b3a2c;     --color-felt-deep: #122a1f;
  --color-brass: #c9a35c;    --color-brass-bright: #e2c079;
  --color-paper: #f1e8d4;    --color-paper-shade: #e0d2b7;  --color-card-ink: #292115;
  /* color — semantic (desaturated to brass level) */
  --color-ok: #5f9a6e; --color-danger: #b3564a; --color-warn: #c77f3f; --color-info: #6f8ba3;
  /* color — player chips (replaces RGB FIGURE_COLORS in the HUD) */
  --chip-red: #c05b4d; --chip-blue: #5b7fa6; --chip-green: #5f9a6e; --chip-gold: #d4b45a;
  --chip-purple: #8d6fa8; --chip-orange: #c9803f; --chip-teal: #58a099; --chip-black: #262421;
  /* type */
  --font-display: "Fraunces", Georgia, serif;      /* headings, deed names, money */
  --font-ui: "Inter", -apple-system, system-ui, sans-serif; /* tabular-nums for money columns */
  --text-12: 12px; --text-14: 14px; --text-16: 16px; --text-18: 18px;
  --text-22: 22px; --text-28: 28px; --text-36: 36px;
  /* space (4px grid; components default 16/24, panels 24/32) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;
  /* radius — controls · cards (physical corner) · chips/badges */
  --radius-control: 4px; --radius-card: 12px; --radius-pill: 999px;
  /* elevation — candlelight, not neon */
  --shadow-raised: 0 2px 8px rgba(0,0,0,.35);
  --shadow-overlay: 0 8px 28px rgba(0,0,0,.45);
  --shadow-modal: 0 18px 60px rgba(0,0,0,.6);
  /* motion — decisive start, soft landing, no bounce */
  --duration-fast: 140ms; --duration-base: 240ms; --duration-cinematic: 600ms;
  --ease-out: cubic-bezier(.22, 1, .36, 1);
}
/* no [data-theme] blocks: single dark theme is a deliberate choice */
```

Contrast validated: text-mid on bg-0 ≈ 7:1 · brass on bg-0 ≈ 8:1 · card-ink on paper ≈ 13:1.

### UX skeleton

- **Navigation model:** single canvas + staged overlays — lobby and room are dressed states of the same table (camera pulled back, board dimmed), not separate pages. The table is always the subject.
- **Key screens:**
  - *Lobby* — join/create over the dimmed table; primary action: Raum erstellen.
  - *Room* — restyle via tokens only (structure unchanged, per scope); primary action: Bereit.
  - *Table* — the game. 3 HUD zones at rest: **player rail** (top-left, chip-colored cards: name, LPD, rank; active player lifts), **table plaque** (top-right: round + economy phase; timer appears at 15s), **your rail** (bottom-right: chip stack + card fan + one contextual action). One-line event ticker bottom-center, expands on hover.
  - *Game over* — standings dealt onto the felt as cards; primary action: Revanche.
- **First-run / empty states:** the ticker never shows an empty box (game start: "Runde 1 — Sven beginnt"); empty property panel shows a face-down card slot, teaching that deeds become a hand.
- **Signature interactions:** ① deed card rises from its tile and presents to camera with Kaufen/Ablehnen printed on it; ② chips arc payer→payee with the rent arithmetic shown ("Grundmiete 80 × Rezession 1.5"); ③ dice tumble from the cup near-camera with a slow settle while the camera leans in.
- **Accessibility floor:** brass focus rings everywhere; Space/Enter = roll/end-turn; `prefers-reduced-motion` collapses camera choreography to cuts; contrast as validated above.

## 8. Open Questions

- **What exactly is "wonky" mechanically?** Owner's played-experience specifics never captured (asked twice). Leading hypothesis: illegibility, not rules — being tested by the money-legibility work (Section 5). If wrong → mechanics audit graduates from Later.
- **Do economy phases (Rezession/Boom/Ruhiger Tag) modify enough to justify their prominence?** Decide after their effects become visible via rent arithmetic; if players still can't feel them, simplify or amplify the mechanic (Later bucket).

## 9. Next Steps

1. Source and vendor assets (wood/felt PBR, HDRI, Fraunces + Inter woff2 — licenses checked) — everything else depends on them.
2. Implement in this order: scene rework → `tokens.css` + HUD rebuild → Director → deed-card system → money legibility → bug kills. Verify each against Section 4's success criteria **with screenshots that get read** (see HANDOFF §5).
3. Play a full game with a guest; capture the flinch-test before/after pair; revisit Open Question 1 with real specifics.
