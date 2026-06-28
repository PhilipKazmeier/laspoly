# Pass 3 UI Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add top header bar, turn toast, buy prompt polish, improved token tinting, and a camera view toggle to the LasPoly web client, matching the original game's chrome aesthetic.

**Architecture:** All changes are isolated to `packages/client/src/ui.ts`, `packages/client/src/board3d.ts`, and a new Playwright spec. The header bar is a non-modal HTML overlay injected into the game HUD, driven by existing `updateGame()`/`showRoom()` data. The view toggle exposes a new `setView()` method on `Board3D`. Token colour is improved by raising emissive intensity and adding a coloured ring disc under each vehicle. No protocol, engine, or server files are touched.

**Tech Stack:** TypeScript (strict ESM), Babylon.js 7, Vite, Playwright

## Global Constraints

- NON-MODAL everywhere — no overlays that block the board
- Do not change engine/server/balance/protocol files
- Preserve all existing public APIs: `board3d.update()`, `board3d.handleEvents()`, `ui.updateGame()`, `ui.showRoom()`, `ui.showLobby()`, `ui.onJoined()`, `ui.addChat()`, `ui.showError()`, `ui.showGameOver()`, `ui.showActionCard()`
- ESM strict TypeScript; match existing code style exactly
- German UI copy throughout ("Du bist am Zug", "Vogel-Ansicht", etc.)
- Build: `npm run build -w @laspoly/client` must succeed with zero errors
- Unit tests: `npm test` (vitest, 181 tests) must stay green
- E2E: `cd packages/client && npx playwright test` — all existing specs must pass

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/client/src/board3d.ts` | Modify | Add `setView()` method + coloured ring under tokens |
| `packages/client/src/ui.ts` | Modify | Header bar, turn toast, buy prompt polish, special-event integration |
| `packages/client/tests/board-pass3.spec.ts` | Create | Playwright spec: header bar screenshot, top-down view screenshot |

---

## Task 1: Expose `setView()` on Board3D + improve token colour rings

**Files:**
- Modify: `packages/client/src/board3d.ts`

**Interfaces:**
- Produces: `board3d.setView(v: 'standard' | 'top'): void`
  - `'standard'`: `camera.alpha = -Math.PI/2, camera.beta = Math.PI/3.2, camera.radius = 32`
  - `'top'`: `camera.alpha = -Math.PI/2, camera.beta = 0.05, camera.radius = 40`
- Produces: each player token now has a coloured flat disc (radius 0.45, height 0.03) placed directly under the token mesh at `y = 0.03`, using the player's colour as the disc's diffuse/emissive colour

**Why:** The view toggle button in the header will call `board3d.setView()`. The coloured ring gives each token a strong visible colour halo even if the OBJ material absorbs tint.

- [ ] **Step 1: Store camera as instance field**

In `board3d.ts`, change the `Board3D` class to store the camera reference. Currently the camera is a `const` in the constructor. Add a private field and save it:

```typescript
// Add to class fields (after line with `private diceResultLabel: ...`):
private camera!: ArcRotateCamera;
```

Then in the constructor, replace:
```typescript
    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 3.2,
      32,
      Vector3.Zero(),
      this.scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 15;
    camera.upperRadiusLimit = 80;
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.lowerBetaLimit = 0.1;
```
with:
```typescript
    this.camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 3.2,
      32,
      Vector3.Zero(),
      this.scene
    );
    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 15;
    this.camera.upperRadiusLimit = 80;
    this.camera.upperBetaLimit = Math.PI / 2.2;
    this.camera.lowerBetaLimit = 0.1;
```

- [ ] **Step 2: Add `setView()` public method**

Add this method to the `Board3D` class, after the `handleEvents` method:

```typescript
  /** Switch camera between angled standard view and flat top-down view. */
  setView(v: 'standard' | 'top'): void {
    if (v === 'top') {
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = 0.05;
      this.camera.radius = 40;
    } else {
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = Math.PI / 3.2;
      this.camera.radius = 32;
    }
  }
```

- [ ] **Step 3: Add a coloured ring map field**

Add to class fields:
```typescript
  private tokenRings: Map<string, AbstractMesh> = new Map();
```

- [ ] **Step 4: Improve `cloneCarToken` — raise emissive**

In `cloneCarToken`, change:
```typescript
    mat.emissiveColor = color.scale(0.55);
```
to:
```typescript
    mat.emissiveColor = color.scale(0.85);
```

Also update `makeFallbackToken`:
```typescript
    mat.emissiveColor = color.scale(0.3); // glow a bit so tokens stand out
```
to:
```typescript
    mat.emissiveColor = color.scale(0.6);
```

- [ ] **Step 5: Add coloured ring under each token in `rebuildTokens`**

In `rebuildTokens`, in the block that positions a token (after `mesh.position.set(targetX, 0.35, targetZ);`), add ring creation. The full block to replace is inside the `if (!this.moveAnimating.has(player.id))` check:

Replace:
```typescript
      if (!this.moveAnimating.has(player.id)) {
        mesh.position.set(targetX, 0.35, targetZ);
        const lbl = this.tokenLabels.get(player.id);
        if (lbl) lbl.position.set(targetX, 1.1, targetZ);
      }
```
with:
```typescript
      if (!this.moveAnimating.has(player.id)) {
        mesh.position.set(targetX, 0.35, targetZ);
        const lbl = this.tokenLabels.get(player.id);
        if (lbl) lbl.position.set(targetX, 1.1, targetZ);
        // Coloured ring under token
        let ring = this.tokenRings.get(player.id);
        if (!ring) {
          const colorHex2 = player.color.startsWith('#') ? player.color : `#${player.color}`;
          const ringColor = hexToColor3(colorHex2);
          ring = MeshBuilder.CreateCylinder(
            `ring_${player.id}`,
            { diameter: 0.9, height: 0.03, tessellation: 16 },
            this.scene
          );
          const ringMat = new StandardMaterial(`ringMat_${player.id}`, this.scene);
          ringMat.diffuseColor = ringColor;
          ringMat.emissiveColor = ringColor.scale(0.9);
          ring.material = ringMat;
          ring.isPickable = false;
          this.tokenRings.set(player.id, ring);
        }
        ring.position.set(targetX, 0.03, targetZ);
      }
```

- [ ] **Step 6: Dispose rings for dead/leaving players**

In `rebuildTokens`, in the block that removes dead players (after `lbl.dispose(); this.tokenLabels.delete(id);`), add:
```typescript
        const ring = this.tokenRings.get(player.id);
        if (ring) { ring.dispose(); this.tokenRings.delete(player.id); }
```

And in the "Remove tokens for players who left" loop (iterating `this.tokenMeshes`), after:
```typescript
        const lbl = this.tokenLabels.get(id);
        if (lbl) { lbl.dispose(); this.tokenLabels.delete(id); }
```
add:
```typescript
        const ring = this.tokenRings.get(id);
        if (ring) { ring.dispose(); this.tokenRings.delete(id); }
```

- [ ] **Step 7: Update ring position during animation**

In `driveAnimation`, after `if (lbl) lbl.position.set(...)`:
```typescript
      if (lbl) lbl.position.set(mesh.position.x, mesh.position.y + 0.8, mesh.position.z);
```
add immediately after:
```typescript
      const ring = this.tokenRings.get(playerId);
      if (ring) ring.position.set(mesh.position.x, 0.03, mesh.position.z);
```

And in the `if (t >= 1)` block after `if (lbl) lbl.position.set(targetX, 1.1, targetZ);`:
```typescript
      if (lbl) lbl.position.set(targetX, 1.1, targetZ);
```
add:
```typescript
      const ring2 = this.tokenRings.get(playerId);
      if (ring2) ring2.position.set(targetX, 0.03, targetZ);
```

- [ ] **Step 8: Verify build succeeds**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client
```
Expected: output ending in `✓ built in ...ms` with no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
cd /Users/philip/Work/Other/laspoly && git add packages/client/src/board3d.ts && git commit -m "feat(board3d): add setView() camera toggle and coloured token rings"
```

---

## Task 2: Header bar, turn toast, buy prompt polish in ui.ts

**Files:**
- Modify: `packages/client/src/ui.ts`

**Interfaces:**
- Consumes: `board3d.setView('standard' | 'top')` — passed via constructor param `board3d: Board3D`
- The `UI` constructor signature changes to: `constructor(root: HTMLDivElement, net: Net, board3d: Board3D)`
- `main.ts` must pass `board3d` as the third argument: `new UI(document.getElementById("ui") as HTMLDivElement, net, board3d)`
- All existing public method signatures remain unchanged

**Why:** The header bar needs to call `board3d.setView()` when the view toggle button is clicked. Passing `board3d` into `UI` is the minimal coupling; avoids a global variable.

- [ ] **Step 1: Update UI constructor to accept Board3D**

At the top of `ui.ts`, add the import for `Board3D`:
```typescript
import type { Board3D } from "./board3d.js";
```

Change the class field declarations — add:
```typescript
  private board3d: Board3D;
  private currentView: 'standard' | 'top' = 'standard';
  private currentRoom: { name: string; boardId: string } | null = null;
```

Change the constructor signature:
```typescript
  constructor(root: HTMLDivElement, net: Net, board3d: Board3D) {
    this.root = root;
    this.net = net;
    this.board3d = board3d;
    // ... rest unchanged
```

- [ ] **Step 2: Update main.ts to pass board3d**

In `packages/client/src/main.ts`, change:
```typescript
const ui = new UI(document.getElementById("ui") as HTMLDivElement, net);
```
to:
```typescript
const ui = new UI(document.getElementById("ui") as HTMLDivElement, net, board3d);
```

- [ ] **Step 3: Add CSS for header bar and turn toast**

In the `css` template string in `ui.ts`, add these rules (insert them before the closing backtick of the css string, after the existing `.swap-check-row` rule):

```css
  #gameHeader {
    position: absolute; top: 0; left: 0; width: 100%; height: 48px;
    background: linear-gradient(to bottom, #c2410c, #ea580c);
    border-bottom: 2px solid #f97316;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 12px;
    box-sizing: border-box;
    z-index: 50;
    pointer-events: none;
    font-family: 'Segoe UI', Arial, sans-serif;
  }
  #gameHeader > * { pointer-events: auto; }
  #headerLeft { display: flex; flex-direction: column; gap: 1px; min-width: 160px; }
  #headerLeft .room-label { font-size: 13px; font-weight: bold; color: #fff; line-height: 1.2; }
  #headerLeft .board-label { font-size: 11px; color: rgba(255,255,255,0.75); line-height: 1.2; }
  #headerCenter { flex: 1; text-align: center; padding: 0 8px; }
  #headerTurnStatus {
    font-size: 15px; font-weight: bold; color: #fff;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    line-height: 1.2;
  }
  #headerRound { font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 1px; }
  #headerEvent { font-size: 11px; color: #fde68a; margin-top: 1px; }
  #headerRight { display: flex; align-items: center; gap: 6px; min-width: 200px; justify-content: flex-end; }
  .hdr-btn {
    background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.3);
    color: #fff; border-radius: 5px; padding: 4px 8px;
    font-size: 12px; cursor: pointer; white-space: nowrap;
    font-family: 'Segoe UI', Arial, sans-serif;
  }
  .hdr-btn:hover { background: rgba(0,0,0,0.45); }
  #headerVersion { font-size: 10px; color: rgba(255,255,255,0.5); margin-left: 4px; }
  #turnToast {
    position: absolute; bottom: 90px; right: 16px;
    background: rgba(15, 15, 35, 0.92);
    border: 1px solid #f97316;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    color: #fff;
    max-width: 240px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 60;
  }
  #turnToast.visible { opacity: 1; }
  #helpOverlay {
    position: absolute; top: 56px; left: 50%; transform: translateX(-50%);
    width: 320px;
    background: rgba(10,10,30,0.95); border: 1px solid #f97316;
    border-radius: 8px; padding: 16px;
    color: #eee; font-size: 13px; line-height: 1.6;
    z-index: 80;
  }
  #helpOverlay h3 { color: #f97316; margin: 0 0 10px; font-size: 14px; }
  #helpOverlay ul { margin: 0; padding-left: 18px; }
  #helpOverlay li { margin: 4px 0; }
  #settingsOverlay {
    position: absolute; top: 56px; right: 12px;
    width: 200px;
    background: rgba(10,10,30,0.95); border: 1px solid #444;
    border-radius: 8px; padding: 12px;
    color: #eee; font-size: 13px;
    z-index: 80;
  }
  #settingsOverlay label { color: #aaa; font-size: 12px; margin-top: 6px; }
```

Also update `#spectatorBanner` CSS — change `top: 60px` to `top: 56px` so it sits just below the new header:
```css
  #spectatorBanner {
    position: absolute; top: 56px; left: 50%; transform: translateX(-50%);
    background: rgba(100,0,0,0.7); padding: 8px 20px; border-radius: 8px;
    font-size: 14px;
  }
```

And remove the `#versionBadge` CSS rule (or keep it — it won't be used since the badge moves to the header).

And adjust `#actionPanel` so it sits below the header — change its `bottom: 16px` to keep as-is (it's already bottom-pinned).

Adjust `#buyOfferPanel` CSS to look more polished:
```css
  #buyOfferPanel {
    position: absolute; bottom: 100px; right: 16px;
    width: 260px;
    background: rgba(10,10,30,0.95); border: 2px solid #facc15;
    border-radius: 10px; padding: 0;
    color: #eee; overflow: hidden;
  }
  #buyOfferPanel .buy-header {
    background: #facc15; color: #1a1a2e;
    font-weight: bold; font-size: 13px;
    padding: 8px 14px;
  }
  #buyOfferPanel .buy-body { padding: 10px 14px; }
  #buyOfferPanel h3 { color: #facc15; margin: 0 0 6px; font-size: 14px; display: none; }
  #buyOfferPanel .buy-detail { font-size: 12px; color: #ccc; margin: 3px 0; }
  #buyOfferPanel .buy-btns { display:flex; gap:8px; margin-top:10px; }
```

- [ ] **Step 4: Add class fields for new UI elements**

Add private fields to the `UI` class (after `private specialEventBanner!: HTMLDivElement;`):

```typescript
  private gameHeader!: HTMLDivElement;
  private headerLeft!: HTMLDivElement;
  private headerTurnStatus!: HTMLDivElement;
  private headerRound!: HTMLDivElement;
  private headerEvent!: HTMLDivElement;
  private headerViewBtn!: HTMLButtonElement;
  private turnToast!: HTMLDivElement;
  private turnToastTimer: ReturnType<typeof setTimeout> | null = null;
  private helpOverlay!: HTMLDivElement;
  private settingsOverlay!: HTMLDivElement;
```

- [ ] **Step 5: Add `buildGameHeader()` method**

Add this method to `UI` (place it before `buildMyPropsPanel`):

```typescript
  private buildGameHeader() {
    const hdr = document.createElement("div");
    hdr.id = "gameHeader";

    // Left: room name + board name
    const left = document.createElement("div");
    left.id = "headerLeft";
    left.innerHTML = `
      <div class="room-label" id="headerRoomLabel">LasPoly</div>
      <div class="board-label" id="headerBoardLabel">—</div>
    `;
    hdr.appendChild(left);
    this.headerLeft = left;

    // Center: turn status + round + event
    const center = document.createElement("div");
    center.id = "headerCenter";
    center.innerHTML = `
      <div id="headerTurnStatus"></div>
      <div id="headerRound"></div>
      <div id="headerEvent"></div>
    `;
    hdr.appendChild(center);
    this.headerTurnStatus = document.getElementById("headerTurnStatus") as HTMLDivElement;
    this.headerRound = document.getElementById("headerRound") as HTMLDivElement;
    this.headerEvent = document.getElementById("headerEvent") as HTMLDivElement;

    // Right: view toggle, settings, help, leave, version
    const right = document.createElement("div");
    right.id = "headerRight";

    const viewBtn = document.createElement("button");
    viewBtn.className = "hdr-btn";
    viewBtn.id = "headerViewBtn";
    viewBtn.textContent = "🗺 Standard-Ansicht";
    viewBtn.addEventListener("click", () => {
      if (this.currentView === 'standard') {
        this.currentView = 'top';
        viewBtn.textContent = "🗺 Vogel-Ansicht";
        this.board3d.setView('top');
      } else {
        this.currentView = 'standard';
        viewBtn.textContent = "🗺 Standard-Ansicht";
        this.board3d.setView('standard');
      }
    });
    this.headerViewBtn = viewBtn;
    right.appendChild(viewBtn);

    const settingsBtn = document.createElement("button");
    settingsBtn.className = "hdr-btn";
    settingsBtn.textContent = "⚙";
    settingsBtn.title = "Einstellungen";
    settingsBtn.addEventListener("click", () => {
      const visible = this.settingsOverlay.style.display !== "none";
      if (visible) hide(this.settingsOverlay);
      else show(this.settingsOverlay, "block");
      hide(this.helpOverlay);
    });
    right.appendChild(settingsBtn);

    const helpBtn = document.createElement("button");
    helpBtn.className = "hdr-btn";
    helpBtn.textContent = "?";
    helpBtn.title = "Hilfe";
    helpBtn.addEventListener("click", () => {
      const visible = this.helpOverlay.style.display !== "none";
      if (visible) hide(this.helpOverlay);
      else show(this.helpOverlay, "block");
      hide(this.settingsOverlay);
    });
    right.appendChild(helpBtn);

    const leaveBtn = document.createElement("button");
    leaveBtn.className = "hdr-btn";
    leaveBtn.textContent = "✕ Verlassen";
    leaveBtn.style.background = "rgba(153,27,27,0.6)";
    leaveBtn.addEventListener("click", () => {
      clearSession();
      this.net.send({ t: "leaveRoom" });
      hide(this.gameHud);
      hide(this.helpOverlay);
      hide(this.settingsOverlay);
      this.net.send({ t: "listRooms" });
    });
    right.appendChild(leaveBtn);

    const ver = document.createElement("span");
    ver.id = "headerVersion";
    ver.textContent = `v${VERSION}`;
    right.appendChild(ver);

    hdr.appendChild(right);
    this.gameHud.appendChild(hdr);
    this.gameHeader = hdr;

    // Help overlay (non-modal, toggled)
    const help = document.createElement("div");
    help.id = "helpOverlay";
    help.innerHTML = `
      <h3>Spielregeln &amp; Steuerung</h3>
      <ul>
        <li><strong>Würfeln:</strong> Klick auf „Würfeln"</li>
        <li><strong>Kaufen:</strong> Kaufangebot erscheint rechts – „Kaufen" oder „Ablehnen"</li>
        <li><strong>Bauen:</strong> Dein Grundstück → Haus/Hotel/Fabrik-Taste</li>
        <li><strong>Tauschen:</strong> „Tauschen" in der Grundstücksliste</li>
        <li><strong>Reisen:</strong> Von einem Bahnhof aus „Reisen nach…"</li>
        <li><strong>Ansicht:</strong> Schaltfläche oben rechts wechselt zwischen Schräg- und Vogelperspektive</li>
        <li><strong>Chat:</strong> Eingabefeld unten links</li>
      </ul>
    `;
    hide(help);
    this.gameHud.appendChild(help);
    this.helpOverlay = help;

    // Settings overlay (non-modal, toggled)
    const settings = document.createElement("div");
    settings.id = "settingsOverlay";
    settings.innerHTML = `
      <div style="font-size:13px;color:#facc15;font-weight:bold;margin-bottom:8px;">Einstellungen</div>
      <label>Sprache / Locale</label>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <button id="localeDEBtn" class="hdr-btn" style="font-size:12px;">🇩🇪 DE</button>
        <button id="localeENBtn" class="hdr-btn" style="font-size:12px;">🇬🇧 EN</button>
      </div>
      <div style="margin-top:8px;font-size:11px;color:#888;">Hinweis: Lokale Anzeigesprache – Spielereignisse kommen vom Server.</div>
    `;
    hide(settings);
    this.gameHud.appendChild(settings);
    this.settingsOverlay = settings;
  }
```

Note: The locale buttons in the settings overlay are cosmetic — the game events come pre-formatted from the server. The buttons can be wired up if a client-side locale is added later; for now they toggle a visual indicator without breaking anything. Wire them like this in the method body (after creating the settings element):

```typescript
    // Wire locale buttons as visual-only toggle (server formats events)
    settings.querySelector('#localeDEBtn')!.addEventListener('click', () => {
      (settings.querySelector('#localeDEBtn') as HTMLElement).style.background = 'rgba(255,255,255,0.25)';
      (settings.querySelector('#localeENBtn') as HTMLElement).style.background = '';
    });
    settings.querySelector('#localeENBtn')!.addEventListener('click', () => {
      (settings.querySelector('#localeENBtn') as HTMLElement).style.background = 'rgba(255,255,255,0.25)';
      (settings.querySelector('#localeDEBtn') as HTMLElement).style.background = '';
    });
```

- [ ] **Step 6: Add `buildTurnToast()` method and `showToast()` helper**

Add this method to `UI`:

```typescript
  private buildTurnToast() {
    const toast = document.createElement("div");
    toast.id = "turnToast";
    this.gameHud.appendChild(toast);
    this.turnToast = toast;
  }

  private showToast(text: string) {
    this.turnToast.textContent = text;
    this.turnToast.classList.add("visible");
    if (this.turnToastTimer) clearTimeout(this.turnToastTimer);
    this.turnToastTimer = setTimeout(() => {
      this.turnToast.classList.remove("visible");
      this.turnToastTimer = null;
    }, 3000);
  }
```

- [ ] **Step 7: Update `buildGameHud()` to call new builders and update `#specialEventBanner` position**

In `buildGameHud()`, add calls to the new builders at the end (before the closing brace of the method), and remove the spectator banner appended to `this.root` (it should go into `hud` instead, or keep it at `root` — it already was appended to `this.root` in existing code, that's fine as-is):

```typescript
    this.buildGameHeader();
    this.buildTurnToast();
```

Note: these calls must be added at the END of `buildGameHud()`, after `this.specialEventBanner = eventBanner;`.

Also, `#specialEventBanner` is now redundant since the header center shows the event. To avoid duplication, keep the `specialEventBanner` div but set it to `display:none` permanently by never calling `show()` on it in `updateGame`. We'll handle the event label inside `updateGame` using `this.headerEvent` instead.

- [ ] **Step 8: Update `buildBuyOfferPanel()` to add `.buy-header` and `.buy-body` wrapper**

Replace the current `buildBuyOfferPanel()` method body with:

```typescript
  private buildBuyOfferPanel() {
    const panel = document.createElement("div");
    panel.id = "buyOfferPanel";
    panel.innerHTML = `
      <div class="buy-header">Kaufangebot</div>
      <div class="buy-body">
        <div class="buy-detail buy-tile-name" id="buyTileName" style="font-weight:bold;color:#facc15;margin-bottom:6px;font-size:13px;">—</div>
        <div class="buy-detail" id="buyPrice">Preis: —</div>
        <div class="buy-detail" id="buyBalance">Dein Kapital: —</div>
        <div class="buy-btns">
          <button id="buyOfferBuyBtn" style="background:#16a34a;flex:1;">Kaufen</button>
          <button id="buyOfferDeclineBtn" style="background:#991b1b;flex:1;">Ablehnen</button>
        </div>
      </div>
    `;
    hide(panel);
    this.gameHud.appendChild(panel);
    this.buyOfferPanel = panel;

    (document.getElementById("buyOfferBuyBtn") as HTMLButtonElement).addEventListener("click", () =>
      this.net.send({ t: "command", command: { type: "BUY_PROPERTY" } })
    );
    (document.getElementById("buyOfferDeclineBtn") as HTMLButtonElement).addEventListener("click", () =>
      this.net.send({ t: "command", command: { type: "DECLINE_PROPERTY" } })
    );
  }
```

- [ ] **Step 9: Remove the old `buildVersion()` call output (move to header)**

The `buildVersion()` method creates a `#versionBadge` element appended to `this.root`. Since the version now shows in the header, we can keep `buildVersion()` but make it a no-op or skip its CSS. The simplest fix: in the `css` constant, the `#versionBadge` rule keeps it at bottom-right as a fallback. Since the header also shows the version, both can coexist — the bottom badge can remain but is invisible (we can just not call `buildVersion()` anymore). Remove the call from the constructor:

Change in constructor:
```typescript
    this.buildVersion();
```
to not calling it at all — remove that line. The `buildVersion` method can stay in the file but won't be called.

(OR, simpler: keep the call and keep the badge — it will be invisible behind the game canvas. Either is fine. The important thing is the header shows the version.)

Actually — keep `buildVersion()` call in constructor for backwards compatibility. The badge is appended to `this.root` and sits at `position:absolute; bottom:4px; right:8px` which is fine as a tiny fallback.

- [ ] **Step 10: Update `showRoom()` to store current room**

In `showRoom(room: RoomView)`, at the start of the method, add:
```typescript
    this.currentRoom = { name: room.name, boardId: room.boardId };
```

- [ ] **Step 11: Update `updateGame()` to drive header bar + toast + event banner**

In `updateGame(state, events, myId)`, after computing `isMyTurn`, `me`, `amAlive`, add header update logic. Insert this block after the line `const amAlive = me?.alive ?? false;`:

```typescript
    // Update header bar
    if (this.gameHeader) {
      const roomLabel = document.getElementById("headerRoomLabel");
      const boardLabel = document.getElementById("headerBoardLabel");
      if (roomLabel && this.currentRoom) roomLabel.textContent = this.currentRoom.name;
      if (boardLabel) boardLabel.textContent = state.boardId;

      const turnText = isMyTurn && amAlive
        ? "Du bist am Zug"
        : `${currentPlayer?.name ?? "?"} ist am Zug`;
      this.headerTurnStatus.textContent = turnText;
      this.headerRound.textContent = `Runde ${state.round}`;

      // Special event label in header
      if (state.activeEvent) {
        const eventLabels: Record<string, string> = {
          circus: '🎪 Zirkus in der Stadt',
          boom: '📈 Wirtschaftsboom',
          recession: '📉 Rezession',
          jackpot: '🎰 Casino-Jackpot-Nacht',
          buildingSale: '🏗️ Bau-Rabatt',
          quietDay: '😴 Ruhiger Tag',
        };
        this.headerEvent.textContent = eventLabels[state.activeEvent.id] ?? state.activeEvent.id;
      } else {
        this.headerEvent.textContent = '';
      }
    }
```

Then, keep the `#specialEventBanner` hidden permanently in this method (comment out the show call):

Find this block in `updateGame`:
```typescript
    // Special event banner
    if (state.activeEvent) {
      const labels: Record<string, string> = {
        ...
      };
      const label = labels[state.activeEvent.id] ?? state.activeEvent.id;
      this.specialEventBanner.textContent = `Runde ${state.round}: ${label}`;
      show(this.specialEventBanner, 'block');
    } else {
      hide(this.specialEventBanner);
    }
```

Replace the `show(this.specialEventBanner, 'block');` line with just keeping it hidden:
```typescript
    // Special event banner (replaced by header center display)
    hide(this.specialEventBanner);
```
i.e. always hide it now — the event shows in the header.

- [ ] **Step 12: Fire toast on turn change**

In `updateGame`, find the existing turn-notification block:
```typescript
    // Emit a local "ist an der Reihe" notification when our turn begins
    if (isMyTurn && !this.wasMyTurn && amAlive) {
      const name = me?.name ?? this.myName ?? "Du";
      this.appendEventLine(`${name} ist an der Reihe.`);
    }
    this.wasMyTurn = isMyTurn && amAlive;
```

Replace with:
```typescript
    // Emit a local "ist an der Reihe" notification when our turn begins
    if (isMyTurn && !this.wasMyTurn && amAlive) {
      const name = me?.name ?? this.myName ?? "Du";
      this.appendEventLine(`${name} ist an der Reihe.`);
      this.showToast("Du bist am Zug");
    } else if (!isMyTurn && this.wasMyTurn) {
      // Our turn just ended — show whose turn it is now
      if (currentPlayer) {
        this.showToast(`${currentPlayer.name} ist am Zug`);
      }
    }
    this.wasMyTurn = isMyTurn && amAlive;
```

- [ ] **Step 13: Show gameHeader only during game (hide on lobby/room)**

In `showLobbyPanel()` and `showLobby()`, add `if (this.gameHeader) hide(this.gameHeader);` (wrapped in guard because header may not exist yet in lobby phase).

In `updateGame()`, at the point where `show(this.gameHud, "block")` is called, also show the header: add `if (this.gameHeader) show(this.gameHeader, 'flex');`.

Actually — `gameHeader` is a child of `gameHud`, so it shows/hides with `gameHud` automatically. No extra change needed. But we DO need to hide the help/settings overlays when leaving the game. In the leave button's click handler (inside `buildGameHeader`), the `hide(this.helpOverlay)` and `hide(this.settingsOverlay)` calls are already included (see Step 5). Good.

- [ ] **Step 14: Buy offer balance text**

In `updateGame`, in the buy offer block, update the balance label text to use "Dein Kapital":
```typescript
      if (balanceEl) balanceEl.textContent = `Dein Kapital: ${me?.money ?? 0} LPD`;
```
(This replaces `Guthaben: ...`.)

- [ ] **Step 15: Verify build**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -20
```
Expected: no TypeScript errors, build succeeds.

- [ ] **Step 16: Commit**

```bash
cd /Users/philip/Work/Other/laspoly && git add packages/client/src/ui.ts packages/client/src/main.ts && git commit -m "feat(ui): header bar, turn toast, buy prompt polish, view toggle wiring"
```

---

## Task 3: Playwright spec board-pass3

**Files:**
- Create: `packages/client/tests/board-pass3.spec.ts`

**Interfaces:**
- Consumes: DOM element `#gameHeader` (header bar), `#headerTurnStatus`, `#headerViewBtn`
- Consumes: `#turnToast` element
- Consumes: `#renderCanvas` for canvas screenshots
- Screenshots saved to: `packages/client/tests/__screenshots__/board-pass3.png` and `board-pass3-top.png`

- [ ] **Step 1: Create the spec file**

Create `/Users/philip/Work/Other/laspoly/packages/client/tests/board-pass3.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.join(__dirname, "__screenshots__");

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test("board pass3 – header bar visible with room name and turn status", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("Pass3Test");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();

  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#rollBtn")).toBeEnabled({ timeout: 30_000 });

  // Header bar must be present and visible
  await expect(page.locator("#gameHeader")).toBeVisible();

  // Turn status must have text
  const turnStatus = page.locator("#headerTurnStatus");
  await expect(turnStatus).toBeVisible();
  const turnText = await turnStatus.textContent();
  expect(turnText).toMatch(/am Zug/);

  // Roll and wait for bots to settle
  await page.locator("#rollBtn").click();
  await page.waitForTimeout(5_000);

  // Full-page screenshot showing header
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "board-pass3.png"),
    fullPage: true,
  });

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});

test("board pass3 – view toggle switches to top-down view", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("ViewTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();

  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });

  // Roll so there's something on the board
  await page.locator("#rollBtn").click();
  await page.waitForTimeout(3_000);

  // Click the view toggle button
  const viewBtn = page.locator("#headerViewBtn");
  await expect(viewBtn).toBeVisible();
  await viewBtn.click();

  // Wait a frame for camera to update
  await page.waitForTimeout(500);

  // Canvas screenshot in top-down view
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "board-pass3-top.png"),
  });

  // Toggle back to standard
  await viewBtn.click();
  await page.waitForTimeout(500);

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});

test("board pass3 – tokens have distinguishable colours on board", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("TokenColourTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();

  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });

  // Play several turns to spread tokens around the board
  for (let i = 0; i < 4; i++) {
    if (await page.locator("#rollBtn").isVisible()) {
      await page.locator("#rollBtn").click();
      await page.waitForTimeout(3_000);
    }
    if (await page.locator("#buyOfferBuyBtn").isVisible()) {
      await page.locator("#buyOfferBuyBtn").click();
    }
    await page.waitForTimeout(1_000);
  }

  // Canvas screenshot to visually assess token colours
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "board-pass3-tokens.png"),
  });

  // Player rows must show coloured dots (colour dots are inline style spans)
  const playerRows = await page.locator(".player-row").count();
  expect(playerRows).toBeGreaterThan(1);

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});
```

- [ ] **Step 2: Run unit tests to confirm no regressions**

```bash
cd /Users/philip/Work/Other/laspoly && npm test 2>&1 | tail -20
```
Expected: all 181 tests pass, no failures.

- [ ] **Step 3: Build client**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -20
```
Expected: build succeeds.

- [ ] **Step 4: Run all Playwright specs**

```bash
cd /Users/philip/Work/Other/laspoly/packages/client && npx playwright test 2>&1 | tail -40
```
Expected: all tests pass (board-pass1, board-pass2, board-pass3, management, playthrough, reconnect, smoke).

- [ ] **Step 5: Read the screenshots to assess visual quality**

Read and visually assess:
- `packages/client/tests/__screenshots__/board-pass3.png` — header bar must be visible at top, orange accent, room name and turn status readable
- `packages/client/tests/__screenshots__/board-pass3-top.png` — should show the board from directly above (flat view, no perspective angle)
- `packages/client/tests/__screenshots__/board-pass3-tokens.png` — tokens should show colour rings/halos; different players clearly distinguishable

If any screenshot fails the visual check, iterate on CSS or board3d.ts changes and re-run.

- [ ] **Step 6: Commit**

```bash
cd /Users/philip/Work/Other/laspoly && git add packages/client/tests/board-pass3.spec.ts packages/client/tests/__screenshots__/ && git commit -m "test(e2e): board-pass3 spec for header bar, view toggle, token colours"
```

---

## Self-Review Checklist

### Spec coverage
- [x] Header bar: room name left, turn status center, round + event center, view toggle/gear/?/X right → Tasks 2 + 3
- [x] View toggle `setView('standard'|'top')` exposed on Board3D → Task 1
- [x] Turn toast bottom-right, auto-fading → Task 2 Steps 6+12
- [x] Buy prompt polish (tile name header, Dein Kapital) → Task 2 Steps 8+14
- [x] Token tint: raised emissive + coloured ring disc → Task 1 Steps 4-7
- [x] VERSION badge in header → Task 2 Step 9
- [x] Special event folded into header center → Task 2 Steps 11
- [x] Help overlay (non-modal, rules text in German) → Task 2 Step 5
- [x] Settings overlay (DE/EN toggle cosmetic) → Task 2 Step 5
- [x] Leave button reuses clearSession + leaveRoom → Task 2 Step 5
- [x] Playwright spec board-pass3.png and board-pass3-top.png → Task 3
- [x] Build must succeed → Tasks 1+2+3 each verify
- [x] Vitest 181 tests green → Task 3 Step 2
- [x] No uncaught console errors → Task 3 Steps 4+5
- [x] NON-MODAL everywhere → help/settings are toggleable overlays, not modals

### Type consistency
- `setView(v: 'standard' | 'top'): void` — used in Task 1 and consumed in Task 2 (Step 5 view button handler)
- `board3d: Board3D` field in `UI` — added in Task 2 Step 1, consumed in Step 5
- `currentView: 'standard' | 'top'` — set in Step 1, used in Step 5
- `currentRoom: { name: string; boardId: string } | null` — set in Step 10, consumed in Step 11
- `showToast(text: string)` — defined in Step 6, called in Step 12
- `tokenRings: Map<string, AbstractMesh>` — added in Task 1 Step 3, used in Steps 5-7

### No placeholders found
All steps contain actual code. No TBDs.
