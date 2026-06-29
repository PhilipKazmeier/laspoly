# Board3D Visual Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 12 visual/interaction issues in the Babylon.js 3D board (board3d.ts): inward colour bars, horizontal labels, smaller non-overlapping tokens, clockwise movement, cup-click-to-roll, cup-hide-then-dice-show-result, dice-first-then-move, ownership markers, backward-jump detection, per-player deed/money display, top-down anti-glare, and tile-click hook.

**Architecture:** All changes live in `packages/client/src/board3d.ts` with two minimal wiring lines in `packages/client/src/main.ts`. The Board3D class gains two new public methods (`setRollHandler`, `setTileClickHandler`) and internal state for cup visibility, animation sequencing, and per-edge deed displays. The coordinate system's `tileXZ` layout is flipped so pos 0→39 proceeds clockwise as seen from the default camera.

**Tech Stack:** Babylon.js 7, TypeScript strict ESM, Vite, Playwright (visual verification).

## Global Constraints

- Only `packages/client/src/board3d.ts` and (minimally) `packages/client/src/main.ts` may be edited.
- Do NOT touch `ui.ts`, `net.ts`, or any shared package files.
- Keep the public API backward-compatible: constructor(canvas), update(state, myId), handleEvents(events), setView(v), dispose() — may ADD methods, never remove/rename.
- ESM strict TypeScript — no `any`, no implicit `any`.
- Build must pass: `npm run build -w @laspoly/client`.
- Playwright specs `board-pass1`, `board-pass2`, `board-pass3`, `smoke`, `reconnect` must still pass (no API breakage).
- No servers left running after tests.
- JAIL_POS = 40 (sentinel, not a real board tile).

---

## File Map

| File | Changes |
|---|---|
| `packages/client/src/board3d.ts` | All 12 fixes; new fields: `rollHandler`, `tileClickHandler`, `cupVisible`, `moveBlocked`; new methods: `setRollHandler`, `setTileClickHandler`, ownership marker rebuild, deed/money display, anti-glare lighting fix |
| `packages/client/src/main.ts` | 2 lines: wire `board.setRollHandler` and `board.setTileClickHandler` |
| `packages/client/tests/rework.spec.ts` | New Playwright spec; captures 5 screenshots per requirement |

---

## Task 1: Fix clockwise tile layout (tileXZ)

**Files:**
- Modify: `packages/client/src/board3d.ts` — `tileXZ()` and `outerDirection()`

**Context:**  
Current layout: GO at bottom-left, pos increases counter-clockwise (bottom→right→top→left).  
Target: pos 0→1→…→39 goes CLOCKWISE as seen from the default camera (alpha=-π/2, beta≈π/3.2, looking from above-and-front). With Babylon's default axes (X=right, Z=into screen from top-down), clockwise from above means: GO bottom-right → bottom edge going left (pos 1–9 left→right FROM viewer's perspective, i.e. increasing X is right but player moves left on bottom edge) — this needs analysis.

**Analysis of default camera:**  
alpha = -π/2 means camera sits on the +X side, looking toward –X (i.e., the camera is to the right looking left). beta = π/3.2 ≈ 56° (slightly from above-right). From this camera, the positive X axis goes to the right, positive Z goes into the screen (away from viewer). Clockwise from above means: start at GO (corner), go right on bottom edge, then up on right edge, then left on top edge, then down on left edge. That matches: pos 0 = bottom-left, pos 1–9 on bottom (going right = increasing X), pos 10 = bottom-right, pos 11–19 on right edge (going up = decreasing Z from bottom to top), pos 20 = top-right, pos 21–29 on top (going left = decreasing X), pos 30 = top-left, pos 31–39 on left edge (going down = increasing Z from top to bottom). So the CURRENT code with GO at (-525,-525) and bottom edge increasing X IS actually clockwise from the top, but from the camera's vantage (camera is at +X, looking back), the bottom edge appears to go LEFT (away from camera). Let's verify by checking what "clockwise" means from camera alpha=-π/2:

With camera at alpha=-π/2 (so positioned on +Z side looking toward -Z? No — alpha is the azimuth angle around Y. alpha=0 means camera at +X, alpha=-π/2 means camera at -Z side). With camera at -Z, looking toward +Z: X=right, Z=depth (into screen). Board from below: pos 0 (bottom) is closest to camera. Bottom edge pos 1–9 increasing X → goes right on screen → clockwise from this view means: bottom goes right, right edge goes up (increasing Z, going away), top goes left, left edge comes down. That IS clockwise. So the current layout may already be clockwise from the camera's view. But the complaint says it isn't. The issue might be in the `enqueueMove` which always adds 1 (pos+1 step) — verify this walks clockwise.

**Key fix:** The `enqueueMove` already does `cur = (cur + 1) % RING` which is clockwise if tileXZ layout is correct. The camera at alpha=-π/2, beta=π/3.2 is positioned looking from -Z toward +Z. Test: pos 0 = (-525*SCALE, -525*SCALE) = bottom-left in XZ, but from camera at -Z looking +Z, the bottom of the screen is at Z near 0 (close to camera), so the bottom-left of screen is at negative X (left from camera) and low Z. Actually the camera being at -Z and looking +Z means left is -X, right is +X, and bottom-left of screen is (-X, low-Z). So pos 0 at (-525*SCALE, -525*SCALE) is bottom-left from camera's view, which is the GO corner. Pos 1 increases X slightly, moving right — clockwise from there. This appears correct. The real issue is likely just animation speed or rendering of the move that looks weird. But do verify by capturing screenshots during movement.

**What we will do:** Keep the existing tileXZ layout (it's already clockwise from the camera view). Ensure `enqueueMove` only walks forward (+1), which it already does. If counter-clockwise is observed in screenshots, flip the camera alpha to +π/2. The plan step will verify and correct if needed.

**Interfaces:**
- No interface change — `tileXZ(pos)` remains same signature

- [ ] **Step 1: Verify current direction with a minimal debug log**

Add a temporary `console.log` in `enqueueMove` to print from/to positions. In the rework Playwright test, capture a screenshot before and after a roll, compare token x positions to confirm direction. (This is done as part of Task 8's test; no code change needed here.)

- [ ] **Step 2: Ensure camera alpha is correct for clockwise view**

In `board3d.ts` constructor, confirm the camera alpha defaults:
```typescript
this.camera = new ArcRotateCamera(
  "camera",
  -Math.PI / 2,   // alpha: camera at -Z, looking toward +Z
  Math.PI / 3.2,  // beta: 56° from vertical
  32,
  Vector3.Zero(),
  this.scene
);
```
This places the camera so +X is to the right. Bottom edge pos 1–9 increases X → visually moves right → clockwise. No change needed. ✓

- [ ] **Step 3: Fix outer-direction so bars are correct after layout confirmed**

`outerDirection` already returns correct vectors. No change if layout is confirmed clockwise. ✓

---

## Task 2: Move colour bars to INNER edge (toward board centre)

**Files:**
- Modify: `packages/client/src/board3d.ts` — `addColorBar()`

**Context:**  
Currently bar sits at `localOffsetZ = -(tileD/2 - BAR_DEPTH/2)` which is the tile's local –Z edge. For angle=0 (bottom edge), –Z in tile space = –Z in world = outer edge (away from centre). We need the INNER edge: +Z in tile local space = toward the centre.

The centre of the board is at (0,0) in XZ. The "inner" direction for each edge is the direction pointing toward (0,0):
- Bottom edge (pos 1–9, angle=0): inner = +Z direction in world space → local +Z
- Right edge (pos 11–19, angle=270): inner = –X world → after 270° rotation, local +Z maps to –X world? Need to compute carefully.

For a tile rotated by `angleDeg`, the tile's local +Z axis maps to world direction:
- `worldX = sin(rad)`, `worldZ = cos(rad)` per column of rotation matrix

So local offset `+Z_offset` maps to world `(+Z_offset * sin(rad), +Z_offset * cos(rad))`.

For angle=0 (bottom edge, rad=0): world = (0, +Z_offset) → towards +Z = towards board centre ✓ (board centre is at Z=0, bottom edge is at Z=-525*SCALE, so +Z is inward) ✓  
For angle=270 (right edge, rad=3π/2): sin=-1, cos≈0 → world = (-Z_offset, 0). Right edge is at X=+525*SCALE, board centre is at X=0, so inward is –X direction. local +Z_offset → world –Z_offset in X direction ✓  
For angle=180 (top edge, rad=π): sin≈0, cos=-1 → world = (0, –Z_offset). Top edge at Z=+525*SCALE, inward = –Z direction ✓  
For angle=90 (left edge, rad=π/2): sin=1, cos≈0 → world = (+Z_offset, 0). Left edge at X=–525*SCALE, inward = +X ✓  

So changing `localOffsetZ` from `-(tileD/2 - BAR_DEPTH/2)` to `+(tileD/2 - BAR_DEPTH/2)` moves the bar to the inner edge for all edges.

**Interfaces:**
- `addColorBar()` — same signature, internal position change only

- [ ] **Step 1: Change the localOffsetZ sign in addColorBar**

In `packages/client/src/board3d.ts`, `addColorBar()`, change:
```typescript
// BEFORE:
const localOffsetZ = -(tileD / 2 - BAR_DEPTH / 2); // in tile-local space

// AFTER:
const localOffsetZ = (tileD / 2 - BAR_DEPTH / 2); // inner edge (toward board centre)
```

Keep the comment updated. Remove the `void odx; void odz;` suppressor if no longer needed (but keep if outer direction is still referenced elsewhere — check first).

- [ ] **Step 2: Build and verify it compiles**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -20
```
Expected: No TypeScript errors.

---

## Task 3: Horizontal wrapping labels, positioned below colour bar

**Files:**
- Modify: `packages/client/src/board3d.ts` — `addTileLabel()`

**Context:**  
Current approach draws text rotated –90° in texture space so it reads "along the tile". This makes text sideways from above. Instead we want:
- Text rendered straight (no canvas rotation)
- Label plane positioned in the INNER portion of the tile (below the inner colour bar)
- Text wraps to 2 lines if needed
- Orientation upright when read from the board's nearest edge (each edge's tiles need the text to read toward the board centre)

**Implementation:**  
- Remove the `ctx.rotate(-Math.PI / 2)` block
- Keep text horizontal (just wrapping)
- Position the label plane shifted inward (toward centre) from tile centre so it occupies the space between the colour bar and the tile's inner edge
- For corner tiles: keep existing centred label
- The label plane itself is rotated to lie flat (rotation.x = π/2) AND rotated around Y by the tile's field angle so text orientation matches the tile edge

But we also need text to be "readable from outside the board" — for bottom-edge tiles, we want text to read upright from someone sitting at the bottom. For top-edge tiles, text must be rotated 180° in the plane to read from the top. Specifically, we want the text's "up" direction to point toward the board centre (inner), and "down" away from centre (outer). This is achieved by rotating the label plane by the tile's fieldAngle (which already encodes edge) but inverting 180° for top/left edges so text isn't upside-down.

**Simplified approach:** Use a full-width/height texture (TEX_W×TEX_H), draw text horizontally centred. Then position the label plane in the INNER half of the tile, and rotate it so the text face points toward the viewer from any camera position. Since the plane rotates around Y by fieldAngle, text will be flipped for top/left tiles. Fix: add 180° to fieldAngle for pos > 20 so text is right-way up from the outer edge. Specifically:
- pos 1–10 (bottom, angle 0): no extra rotation → reads correctly from front (camera side)
- pos 11–20 (right, angle 270): ok from right
- pos 21–30 (top, angle 180): add 180 → 360 = 0 → text reads correctly from top player
- pos 31–39 (left, angle 90): add 180 → 270 → reads from left

Actually, to keep it simple and avoid confusion: render the label plane with `billboardMode = 0` (no billboard, lies flat), and rotate it so text reads in a player-friendly orientation. For top-down view it doesn't matter. For angled view, we want text readable. The best approach: **use the current angleDeg but add 180° for top+left edges** so text isn't upside-down from the "outside in" perspective:

```typescript
const textAngleDeg = pos >= 21 && pos <= 39 ? angleDeg + 180 : angleDeg;
```

- [ ] **Step 1: Rewrite addTileLabel for non-corner tiles**

Replace the rotated-text block in `addTileLabel` with straight horizontal text:

```typescript
/** Adds a DynamicTexture label plane on top of a tile. */
private addTileLabel(
  cx: number, cz: number, pos: number, name: string, type: string,
  isCorner: boolean, tileW: number, tileD: number, angleDeg: number
) {
  const TEX_W = 256;
  const TEX_H = isCorner ? 256 : 128;

  const tex = new DynamicTexture(
    `labelTex_${pos}`, { width: TEX_W, height: TEX_H }, this.scene, false
  );
  const ctx = tex.getContext() as CanvasRenderingContext2D;

  ctx.fillStyle = "#f7f2df";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  if (isCorner) {
    const label = cornerLabel(pos, type);
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 40px Arial";
    ctx.fillText(label, TEX_W / 2, TEX_H / 2);
  } else {
    // Horizontal text with word-wrap, positioned in upper portion of label
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const FONT_SIZE = 16;
    const LINE_H = 20;
    ctx.font = `bold ${FONT_SIZE}px Arial`;
    const MAX_W = TEX_W - 16;
    const words = name.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (ctx.measureText(test).width > MAX_W && current) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    // Cap at 3 lines; shrink font if too many
    const font = lines.length > 2 ? `bold 13px Arial` : `bold ${FONT_SIZE}px Arial`;
    ctx.font = font;
    const startY = 8;
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      ctx.fillText(lines[i]!, TEX_W / 2, startY + i * LINE_H);
    }
  }

  tex.update();

  // Label plane occupies the INNER 60% of the tile (below colour bar)
  const BAR_DEPTH = 0.4;
  const labelDepth = tileD - BAR_DEPTH; // available depth after the bar
  const planeW = isCorner ? CORNER * 0.88 : TILE_W * 0.88;
  const planeH = isCorner ? CORNER * 0.88 : labelDepth * 0.85;

  const label = MeshBuilder.CreatePlane(
    `label_${pos}`, { width: planeW, height: planeH }, this.scene
  );
  label.rotation.x = Math.PI / 2; // lie flat

  // Rotate so text faces the outer edge (readable from outside the board).
  // For top-edge (pos 21–29) and left-edge (pos 31–39) add 180° so text isn't inverted.
  const textAngleDeg = (pos >= 21 && pos <= 39 && !isCorner) ? angleDeg + 180 : angleDeg;
  label.rotation.y = (textAngleDeg * Math.PI) / 180;

  // Place label in the inner portion of the tile (shifted toward board centre from tile centre)
  // Inner direction is opposite of outerDirection.
  const [odx, odz] = outerDirection(pos);
  const innerShift = isCorner ? 0 : BAR_DEPTH / 2;
  // Shift away from outer edge toward inner (centre) so the label sits below the bar
  label.position.set(cx - odx * innerShift, 0.096, cz - odz * innerShift);

  const labelMat = new StandardMaterial(`labelMat_${pos}`, this.scene);
  labelMat.diffuseTexture = tex;
  labelMat.backFaceCulling = false;
  labelMat.emissiveColor = new Color3(0.05, 0.05, 0.05);
  label.material = labelMat;
  label.isPickable = false; // tile mesh itself is pickable (Task 11)
}
```

- [ ] **Step 2: Build and confirm no TypeScript errors**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -20
```

---

## Task 4: Smaller, non-overlapping tokens

**Files:**
- Modify: `packages/client/src/board3d.ts` — `rebuildTokens()`, `makeFallbackToken()`, `cloneCarToken()`

**Context:**  
Current car model normalised to `target = 1.3` units, fallback cylinder diameter=0.55. Tile width is TILE_W ≈ 1.667 units. With 4 players potentially sharing a tile, 1.3-unit tokens will fully overlap. Fix:
- Shrink car target to 0.7 units (fits within tile)
- Shrink fallback cylinder to diameter=0.35, height=0.45
- Offset cluster: use a 2×2 grid with spacing 0.45 units centred at tile centre
- Torus ring diameter reduced from 1.05 to 0.55

- [ ] **Step 1: Reduce car model target size**

In `cloneCarToken()`:
```typescript
// BEFORE:
const target = 1.3;
// AFTER:
const target = 0.7;
```

- [ ] **Step 2: Reduce fallback cylinder**

In `makeFallbackToken()`:
```typescript
// BEFORE:
{ diameter: 0.55, height: 0.65, tessellation: 8 }
// AFTER:
{ diameter: 0.35, height: 0.45, tessellation: 8 }
```

- [ ] **Step 3: Tighten offset grid and reduce ring size**

In `rebuildTokens()`, replace the offset calculation:
```typescript
// BEFORE:
const offsetX = (i % 2) * 0.5 - 0.25;
const offsetZ = Math.floor(i / 2) * 0.5 - 0.25;

// AFTER:
const GRID_STEP = 0.45;
const offsetX = (i % 2) * GRID_STEP - GRID_STEP / 2;
const offsetZ = Math.floor(i / 2) * GRID_STEP - GRID_STEP / 2;
```

Replace ring creation:
```typescript
// BEFORE:
ring = MeshBuilder.CreateTorus(
  `ring_${player.id}`,
  { diameter: 1.05, thickness: 0.22, tessellation: 20 },
  this.scene
);
// AFTER:
ring = MeshBuilder.CreateTorus(
  `ring_${player.id}`,
  { diameter: 0.55, thickness: 0.12, tessellation: 16 },
  this.scene
);
```

- [ ] **Step 4: Build and confirm**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -5
```

---

## Task 5: Tile-click hook (`setTileClickHandler`)

**Files:**
- Modify: `packages/client/src/board3d.ts` — `drawBoard()`, new field, new public method

**Context:**  
Need to make tile meshes pickable and call a callback with tile position when clicked. Add `private tileClickHandler: ((pos: number) => void) | null = null;` and `setTileClickHandler(cb)`.

In `drawBoard()`, enable scene.onPointerObservable or use ActionManager. Simplest: register a single pointer-down observer on the scene once (in constructor), check `scene.pick(x, y).pickedMesh` name for `tile_N` pattern.

- [ ] **Step 1: Add field and method**

Add to class fields:
```typescript
private tileClickHandler: ((pos: number) => void) | null = null;
```

Add public method (before `dispose()`):
```typescript
/** Register a callback to be called when a board tile is clicked. pos is 0-39. */
setTileClickHandler(cb: (pos: number) => void): void {
  this.tileClickHandler = cb;
}
```

- [ ] **Step 2: Make tile meshes pickable and wire observer**

In `drawBoard()`, add `tileMesh.isPickable = true;` right after creating `tileMesh`. Since we don't want an observer per tile, add one scene-level pointer observer in the constructor (after the engine is created):

```typescript
// In constructor, after scene is created:
this.scene.onPointerObservable.add((pointerInfo) => {
  if (pointerInfo.type !== 1) return; // POINTERDOWN = 1
  const picked = pointerInfo.pickInfo;
  if (!picked?.hit || !picked.pickedMesh) return;
  const meshName = picked.pickedMesh.name;
  if (meshName.startsWith("tile_")) {
    const pos = parseInt(meshName.slice(5), 10);
    if (!isNaN(pos) && this.tileClickHandler) {
      this.tileClickHandler(pos);
    }
  }
});
```

Import `PointerEventTypes` or use the numeric constant 1 (POINTERDOWN). Since we already import from @babylonjs/core, add `PointerEventTypes` to imports, or just use `=== 1`.

Actually PointerEventTypes.POINTERDOWN = 1 always. Use literal 1 to avoid import churn.

- [ ] **Step 3: Wire in main.ts**

In `packages/client/src/main.ts`, after `const board3d = new Board3D(...)`, add:
```typescript
board3d.setTileClickHandler((pos) => {
  // Property popup is owned by the HTML UI agent; just log for now.
  console.log("[board3d] tile clicked:", pos);
});
```

- [ ] **Step 4: Build**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -5
```

---

## Task 6: Cup-click → roll handler (`setRollHandler`)

**Files:**
- Modify: `packages/client/src/board3d.ts` — `initDice()`, new field, new public method
- Modify: `packages/client/src/main.ts` — wire roll handler

**Context:**  
Need the dice cup mesh to be pickable and trigger a callback when clicked. The cup mesh is created async in `initDice()`. We need to set `cup.isPickable = true` and add it to the pointer observer. Add `rollHandler` field and `setRollHandler(cb)`.

- [ ] **Step 1: Add field and method**

Add to class fields:
```typescript
private rollHandler: (() => void) | null = null;
```

Add public method:
```typescript
/** Register a callback invoked when the player clicks the dice cup to roll. */
setRollHandler(cb: () => void): void {
  this.rollHandler = cb;
}
```

- [ ] **Step 2: Make cup pickable in initDice()**

In `initDice()`, when assigning `this.diceCupMesh = cup`, change:
```typescript
// BEFORE:
cup.isPickable = false;
// AFTER:
cup.isPickable = true;
cup.name = "diceCup";
```

For the fallback cylinder:
```typescript
// BEFORE (fallback):
this.diceCupMesh = fallbackCup;
// AFTER (fallback):
fallbackCup.name = "diceCup";
fallbackCup.isPickable = true;
this.diceCupMesh = fallbackCup;
```

- [ ] **Step 3: Handle cup click in scene pointer observer**

Extend the observer added in Task 5 to also check for the cup:
```typescript
this.scene.onPointerObservable.add((pointerInfo) => {
  if (pointerInfo.type !== 1) return; // POINTERDOWN
  const picked = pointerInfo.pickInfo;
  if (!picked?.hit || !picked.pickedMesh) return;
  const meshName = picked.pickedMesh.name;
  if (meshName.startsWith("tile_")) {
    const pos = parseInt(meshName.slice(5), 10);
    if (!isNaN(pos) && this.tileClickHandler) this.tileClickHandler(pos);
  } else if (meshName === "diceCup" || meshName === "cupFallback") {
    if (this.rollHandler) this.rollHandler();
  }
});
```

(Note: combine Tasks 5 and 6 if implementing in sequence — add this single merged observer in the constructor; both tile and cup checks in one callback.)

- [ ] **Step 4: Wire in main.ts**

In `packages/client/src/main.ts`, after `const board3d = new Board3D(...)`:
```typescript
board3d.setRollHandler(() => {
  net.send({ t: "command", command: { type: "ROLL_DICE" } });
});
```

This mirrors exactly what the Roll button does in `ui.ts:489`. The server rejects it if not the player's turn, so no client-side guard needed.

- [ ] **Step 5: Build**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -5
```

---

## Task 7: Cup vanish / dice show result after roll

**Files:**
- Modify: `packages/client/src/board3d.ts` — `playDiceAnimation()`, new field `cupVisible`

**Context:**  
After rolling: the cup shakes, then disappears, and the two dice lie on the felt showing the rolled values. The cup reappears when it's time to roll again (next turn or when the current player's turn starts). We need to track when the cup should be visible.

The dice mesh currently uses `orientDie()` which rotates the mesh. Since the rounded-dice.obj's face layout is unknown, we'll replace dice with DynamicTexture cube faces so the correct pip count is guaranteed visible.

**For the dice model:** Because the OBJ face layout is uncertain, create fallback cubes with DynamicTexture pips per face. We'll do this by creating 6-sided box meshes with pip textures on a DynamicTexture (one texture with 6 faces laid out in a strip, then use UV mapping — actually simpler: just create 6 plane meshes as die faces or use a single texture atlas). Simplest: create a box, create a `DynamicTexture` per die that shows `d1` (number of dots) and apply as emissive+diffuse. This guarantees the shown number is correct even if OBJ orientation is wrong.

**Even simpler:** Replace the die with a `MeshBuilder.CreateBox` and apply a single-face texture that shows the pip count as a number, billboard-oriented, floating above the die face. This is a tiny compromise but guaranteed readable.

**Cleanest approach that keeps the model:** Draw pips on a DynamicTexture and use it as the diffuse texture override (not care about orientation). Instead, show the dice result label (already implemented via `showDiceResultLabel`) prominently, and just hide/show the cup. This satisfies the visual requirement of "cup gone, dice visible, result shown".

**Full sequence:**
1. On roll detected (lastRoll changes): hide cup, show dice animation (existing shake), at settle: orient dice + show result label; dice remain visible
2. On next state where it's a new player's turn OR phase changes back to awaiting-roll: show cup again, hide dice

- [ ] **Step 1: Add cupVisible state and cup show/hide helpers**

Add field:
```typescript
private cupVisible = true;
```

Add private helpers:
```typescript
private showCup() {
  if (this.diceCupMesh) this.diceCupMesh.setEnabled(true);
  this.cupVisible = true;
}

private hideCup() {
  if (this.diceCupMesh) this.diceCupMesh.setEnabled(false);
  this.cupVisible = false;
}
```

- [ ] **Step 2: Override dice with guaranteed-correct pip display**

Replace the `orientDie` method and instead use DynamicTexture to show the value. Replace dice mesh creation in `initDice()` fallback path (and keep as overlay even for OBJ model). After the die is created (OBJ or fallback box), attach a billboard plane above it showing the value:

Actually, keep `orientDie` for the OBJ (it might work correctly). Add a DynamicTexture plane as a "pip overlay" only if using fallback box. The key guarantee: after animation, call `showDiceValue(die1, d1)` and `showDiceValue(die2, d2)`.

Add method:
```typescript
private diePipLabel1: AbstractMesh | null = null;
private diePipLabel2: AbstractMesh | null = null;

private showDiceValue(labelRef: 'die1' | 'die2', value: number, x: number, z: number) {
  const existing = labelRef === 'die1' ? this.diePipLabel1 : this.diePipLabel2;
  if (existing) { existing.dispose(); }

  const tex = new DynamicTexture(`pipTex_${labelRef}`, { width: 64, height: 64 }, this.scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#111111";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value), 32, 32);
  tex.update();

  const plane = MeshBuilder.CreatePlane(`pipLabel_${labelRef}`, { width: 0.45, height: 0.45 }, this.scene);
  plane.position.set(x, 0.55, z);
  plane.billboardMode = 7;
  const mat = new StandardMaterial(`pipMat_${labelRef}`, this.scene);
  mat.diffuseTexture = tex;
  mat.backFaceCulling = false;
  mat.emissiveColor = new Color3(1, 1, 1);
  plane.material = mat;
  plane.isPickable = false;

  if (labelRef === 'die1') this.diePipLabel1 = plane;
  else this.diePipLabel2 = plane;
}
```

- [ ] **Step 3: Modify playDiceAnimation to hide cup and show dice result**

In the `settle` phase of `playDiceAnimation`, after placing the dice:
```typescript
} else { // settle phase
  const cx = cup.position.x;
  const cz = cup.position.z;
  if (die1) { die1.position.set(cx - 0.3, 0.25, cz - 0.12); this.orientDie(die1, d1); }
  if (die2) { die2.position.set(cx + 0.3, 0.25, cz + 0.12); this.orientDie(die2, d2); }
  // NEW: hide cup, show pip labels
  this.hideCup();
  this.showDiceValue('die1', d1, cx - 0.3, cz - 0.12);
  this.showDiceValue('die2', d2, cx + 0.3, cz + 0.12);
  // ... rest of existing bounce code
```

- [ ] **Step 4: Show cup again on next roll opportunity**

In `applyStateDiffs()`, detect when the phase returns to `awaiting-roll` for a new player (i.e., currentPlayerIndex changed from the previous state) OR when the game advances. Show the cup and hide pip labels:

```typescript
// In applyStateDiffs, at the top:
if (this.lastState) {
  const prevPhase = this.lastState.phase;
  const prevCurrentIdx = this.lastState.currentPlayerIndex;
  // Show cup again when turn advances (new current player) or game starts
  if (state.phase === 'awaiting-roll' &&
      (prevPhase !== 'awaiting-roll' || prevCurrentIdx !== state.currentPlayerIndex)) {
    this.showCup();
    // Hide pip labels
    if (this.diePipLabel1) { this.diePipLabel1.dispose(); this.diePipLabel1 = null; }
    if (this.diePipLabel2) { this.diePipLabel2.dispose(); this.diePipLabel2 = null; }
  }
}
```

- [ ] **Step 5: Build**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -5
```

---

## Task 8: Figure moves AFTER dice animation completes

**Files:**
- Modify: `packages/client/src/board3d.ts` — `applyStateDiffs()`, `enqueueMove()`, new field `moveBlocked`

**Context:**  
Currently `applyStateDiffs()` calls `enqueueMove()` immediately when a position diff is detected. We need to detect the roll event at the same time as position change and delay the token movement until `diceAnimating` becomes false.

**Approach:** Track a per-player "pending move" that waits for `diceAnimating === false`. Use a `movePending: Map<string, {from: number, to: number}>` to store deferred moves. Poll in the dice animation's settle phase (or use a simple observable check).

- [ ] **Step 1: Add movePending field**

```typescript
private movePending: Map<string, { from: number; to: number }> = new Map();
```

- [ ] **Step 2: In applyStateDiffs, defer move if dice are animating**

Replace move enqueueing:
```typescript
// BEFORE:
} else {
  this.enqueueMove(p.id, prevPos, newPos);
}

// AFTER:
} else {
  if (this.diceAnimating) {
    // Defer until dice settle
    this.movePending.set(p.id, { from: prevPos, to: newPos });
  } else {
    this.enqueueMove(p.id, prevPos, newPos);
  }
}
```

- [ ] **Step 3: Flush pending moves when dice animation ends**

In `playDiceAnimation()`, in the `settle` phase, after setting `this.diceAnimating = false`:
```typescript
this.diceAnimating = false;
// Flush deferred token moves
for (const [pid, move] of this.movePending) {
  this.enqueueMove(pid, move.from, move.to);
}
this.movePending.clear();
```

- [ ] **Step 4: Build and verify**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -5
```

---

## Task 9: Backward jump detection (short-circuit teleport)

**Files:**
- Modify: `packages/client/src/board3d.ts` — `enqueueMove()`

**Context:**  
When an action card sends a player backward (e.g., pos 30→pos 5), `enqueueMove` currently walks forward (30→31→…→39→0→1→2→3→4→5 = 15 hops), which is wrong. We need to detect backward moves and teleport directly (or animate a short slide) instead of walking the long way around.

**Detection:** A move is "backward" if the shorter path is going backward. Forward distance = `(to - from + 40) % 40`. Backward distance = `(from - to + 40) % 40`. If `forward > 6` AND `backward < forward`, it's a backward jump → teleport directly.

(Using 6 as threshold: normal dice rolls are max 12, so forward-move of > 6 that's shorter backward is always a card teleport. This handles pos 30→pos 0 which is 30 forward or 10 backward — 10 < 30 → backward teleport. Also pos 30→pos 5 is 15 forward / 25 backward → no, 15 < 25, so it's forward. Actually let me recalculate: 30→5: forward = (5-30+40)%40 = 15. backward = (30-5+40)%40 = 25. So forward=15 < backward=25 → walk forward 15 hops. That's fine for a dice roll of 15 (doubles). But action cards that move backward need a different signal. Actually with TRACK_SIZE=40, action cards can jump a player from pos 30 to pos 5 — but WHICH direction? The server sends just a new position. We infer: if new pos is LESS than old pos AND difference > expected dice range (max 12), it's likely a backward card. Use threshold: if forward distance > 12, it was a card jump — teleport. Forward distance > 12 means the card moved them forward more than dice allow, or it's a backward move. Actually: if forward distance ≤ 12, animate clockwise; if forward distance > 12, teleport (backward card or large forward jump).)

Actually the cleanest: if `forwardDist > 12`, teleport (no tile-by-tile animation). If `forwardDist ≤ 12`, walk tile-by-tile clockwise. This handles both "go back 3 spaces" (backward moves will have large forwardDist like 37) and large forward card jumps.

- [ ] **Step 1: Update enqueueMove with teleport threshold**

```typescript
private enqueueMove(playerId: string, from: number, to: number) {
  const RING = 40;
  const forwardDist = ((to - from) % RING + RING) % RING;

  // If distance > 12 tiles forward, this is a card jump: teleport directly (or short slide)
  if (forwardDist > 12) {
    const dest = tileXZ(to);
    const existing = this.moveQueues.get(playerId) ?? [];
    this.moveQueues.set(playerId, [...existing, dest]);
    if (!this.moveAnimating.has(playerId)) this.driveAnimation(playerId);
    return;
  }

  // Normal clockwise walk
  const path: Array<[number, number]> = [];
  let cur = from;
  let guard = 0;
  while (cur !== to && guard++ < RING) {
    cur = (cur + 1) % RING;
    path.push(tileXZ(cur));
  }
  if (path.length === 0) return;
  const existing = this.moveQueues.get(playerId) ?? [];
  this.moveQueues.set(playerId, [...existing, ...path]);
  if (!this.moveAnimating.has(playerId)) this.driveAnimation(playerId);
}
```

- [ ] **Step 2: Build**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -5
```

---

## Task 10: Ownership markers on tiles

**Files:**
- Modify: `packages/client/src/board3d.ts` — new method `updateOwnershipMarkers()`, new field `ownershipMarkers`

**Context:**  
Show a small coloured stripe/flag on each owned property tile showing the owner's colour. For mortgaged tiles, show a dark/greyed marker. Update on every `update()` call. Use thin box meshes (0.1 height, 0.25 depth, full tile-width wide) positioned at the inner edge of the tile, slightly above the tile surface.

- [ ] **Step 1: Add ownership marker field and method**

Add field:
```typescript
private ownershipMarkers: Map<number, AbstractMesh> = new Map();
```

Add method:
```typescript
private updateOwnershipMarkers(state: GameState) {
  // Dispose markers for tiles no longer owned
  for (const [pos, mesh] of this.ownershipMarkers) {
    if (!state.ownership[pos]) {
      mesh.dispose();
      this.ownershipMarkers.delete(pos);
    }
  }

  for (const [posStr, playerId] of Object.entries(state.ownership)) {
    const pos = Number(posStr);
    const player = state.players.find((p) => p.id === playerId);
    if (!player) continue;

    // Dispose and recreate if owner changed (check material colour)
    const existing = this.ownershipMarkers.get(pos);
    if (existing) {
      // Check if ownership or mortgage changed by inspecting material
      const mat = existing.material as StandardMaterial | null;
      const isMortgaged = !!state.mortgaged[pos];
      const expectedColor = isMortgaged
        ? new Color3(0.3, 0.3, 0.3)
        : playerColor3(player.color);
      // Cheap check: if diffuseColor matches, skip
      if (mat?.diffuseColor?.r === expectedColor.r) continue;
      existing.dispose();
      this.ownershipMarkers.delete(pos);
    }

    const [cx, cz] = tileXZ(pos);
    const [odx, odz] = outerDirection(pos);
    const isMortgaged = !!state.mortgaged[pos];

    // Small stripe on inner edge of tile
    const marker = MeshBuilder.CreateBox(
      `own_${pos}`,
      { width: TILE_W * 0.8, height: 0.06, depth: 0.2 },
      this.scene
    );
    // Position at inner edge
    const innerEdgeX = cx - odx * (TILE_D / 2 - 0.15);
    const innerEdgeZ = cz - odz * (TILE_D / 2 - 0.15);
    marker.position.set(innerEdgeX, 0.12, innerEdgeZ);
    marker.rotation.y = (getFieldAngle(pos) * Math.PI) / 180;

    const mat = new StandardMaterial(`ownMat_${pos}`, this.scene);
    const baseColor = playerColor3(player.color);
    mat.diffuseColor = isMortgaged ? new Color3(0.3, 0.3, 0.3) : baseColor;
    mat.emissiveColor = isMortgaged ? new Color3(0.1, 0.1, 0.1) : baseColor.scale(0.5);
    marker.material = mat;
    marker.isPickable = false;
    this.ownershipMarkers.set(pos, marker);
  }
}
```

- [ ] **Step 2: Call from update()**

In the `update()` method, add:
```typescript
update(state: GameState, _myId: string | null) {
  this.applyStateDiffs(state);
  this.lastState = state;
  this.lastMyId = _myId;
  this.drawBoard(state.boardId);
  this.rebuildTokens(state, _myId);
  this.updateBuildings(state);
  this.updateOwnershipMarkers(state); // NEW
  this.updatePlayerDisplays(state);  // NEW (Task 11)
}
```

- [ ] **Step 3: Build**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -5
```

---

## Task 11: Per-player deed/money display on board edges

**Files:**
- Modify: `packages/client/src/board3d.ts` — new method `updatePlayerDisplays()`, new field `playerDisplayMeshes`

**Context:**  
Show each player's owned deed count + money near their "seat" at the board edges. Up to 4 players, each gets a billboard near one corner of the board:
- Player 0: near GO corner (pos 0) — placed outside board at bottom-left
- Player 1: near pos 10 corner — bottom-right  
- Player 2: near pos 20 corner — top-right
- Player 3: near pos 30 corner — top-left

Each display: a DynamicTexture billboard plane showing player name, money (€), and owned properties (grouped by colour as coloured dots). Keep it lightweight — one billboard plane per player, updated on state change.

- [ ] **Step 1: Add field and method**

Add field:
```typescript
private playerDisplayMeshes: Map<string, AbstractMesh> = new Map();
```

Add method:
```typescript
private readonly SEAT_POSITIONS: Array<[number, number, number]> = [
  // [x, y, z] world positions for up to 4 player displays
  [-12, 0.5, -12], // Player 0 seat (near GO, bottom-left)
  [12, 0.5, -12],  // Player 1 seat (near pos 10, bottom-right)
  [12, 0.5, 12],   // Player 2 seat (near pos 20, top-right)
  [-12, 0.5, 12],  // Player 3 seat (near pos 30, top-left)
];

private updatePlayerDisplays(state: GameState) {
  const board = getBoard(state.boardId);
  const alivePlayers = state.players.filter((p) => p.alive);

  // Remove displays for players who left
  for (const [id, mesh] of this.playerDisplayMeshes) {
    if (!state.players.find((p) => p.id === id)) {
      mesh.dispose();
      this.playerDisplayMeshes.delete(id);
    }
  }

  alivePlayers.slice(0, 4).forEach((player, seatIdx) => {
    // Dispose & recreate each update (cheap enough for 4 players)
    const existing = this.playerDisplayMeshes.get(player.id);
    if (existing) { existing.dispose(); }

    const ownedPositions = Object.entries(state.ownership)
      .filter(([, pid]) => pid === player.id)
      .map(([pos]) => Number(pos));

    // Build compact deed line: group colours as emoji/dots
    const groupSet: Set<string> = new Set();
    for (const pos of ownedPositions) {
      const tile = board.tiles.find((t) => t.pos === pos);
      if (tile && 'group' in tile && tile.group) groupSet.add(tile.group);
    }

    const TEX_W = 192, TEX_H = 80;
    const tex = new DynamicTexture(
      `pdTex_${player.id}`, { width: TEX_W, height: TEX_H }, this.scene, false
    );
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle = "rgba(20,20,30,0.85)";
    ctx.fillRect(0, 0, TEX_W, TEX_H);

    // Player name + colour indicator
    const pColor = PLAYER_COLOR_HEX[player.color.toLowerCase()] ?? player.color;
    ctx.fillStyle = pColor;
    ctx.fillRect(4, 4, 10, 10);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(player.name.slice(0, 14), 18, 4);

    // Money
    ctx.fillStyle = "#facc15";
    ctx.font = "12px Arial";
    ctx.fillText(`€${player.money.toLocaleString()}`, 18, 20);

    // Coloured property group dots
    let dotX = 4;
    for (const grp of Array.from(groupSet).slice(0, 12)) {
      const hex = GROUP_COLORS[grp] ?? "#888";
      ctx.fillStyle = hex;
      ctx.fillRect(dotX, 40, 12, 12);
      dotX += 14;
    }

    // Deed count
    ctx.fillStyle = "#ddd";
    ctx.font = "11px Arial";
    ctx.fillText(`${ownedPositions.length} props`, 4, 56);

    tex.update();

    const plane = MeshBuilder.CreatePlane(
      `playerDisplay_${player.id}`, { width: 2.4, height: 1.0 }, this.scene
    );
    const [sx, sy, sz] = this.SEAT_POSITIONS[seatIdx] ?? [-12, 0.5, -12];
    plane.position.set(sx, sy, sz);
    plane.billboardMode = 7; // always face camera
    const mat = new StandardMaterial(`pdMat_${player.id}`, this.scene);
    mat.diffuseTexture = tex;
    mat.backFaceCulling = false;
    mat.emissiveColor = new Color3(0.8, 0.8, 0.8);
    plane.material = mat;
    plane.isPickable = false;
    this.playerDisplayMeshes.set(player.id, plane);
  });
}
```

Note: `PLAYER_COLOR_HEX` is already a class-level const defined at module level — reference it directly.

- [ ] **Step 2: Add getBoard import usage — already imported at top**

Verify `getBoard` is already imported: `import { getBoard, listBoards, JAIL_POS } from "@laspoly/shared";` — yes. ✓

- [ ] **Step 3: Build**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -5
```

---

## Task 12: Top-down view anti-glare / readable lighting

**Files:**
- Modify: `packages/client/src/board3d.ts` — constructor lighting, `setView()`, material adjustments

**Context:**  
In top-down view, the board washes out to white due to high specular on the PointLight combined with near-vertical camera. Fix:
1. Reduce point-light intensity, add direction-agnostic ambient
2. Remove/reduce specular on board and felt materials
3. Cap camera beta so top-down doesn't hit the zero-degree "mirror" position
4. Add a diffuse-only directional light for top-down that's soft

- [ ] **Step 1: Reduce point light and specular in constructor**

```typescript
// BEFORE:
const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), this.scene);
ambient.intensity = 0.65;
const key = new PointLight("key", new Vector3(0, 20, -5), this.scene);
key.intensity = 0.55;

// AFTER:
const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), this.scene);
ambient.intensity = 0.80;
ambient.specular = new Color3(0, 0, 0); // no specular from ambient
const key = new PointLight("key", new Vector3(0, 20, -5), this.scene);
key.intensity = 0.30; // reduced to avoid white blowout
key.specular = new Color3(0.1, 0.1, 0.1); // near-zero specular
```

Add `Color3` to imports if not already there (it is). Add `DirectionalLight` import:
```typescript
import { ..., DirectionalLight } from "@babylonjs/core";
```

- [ ] **Step 2: Set specularColor = black on board and felt materials**

In `drawBoard()`:
```typescript
// After boardMat.diffuseColor = ...:
boardMat.specularColor = new Color3(0, 0, 0);

// After feltMat.diffuseTexture = ...:
feltMat.specularColor = new Color3(0, 0, 0);
```

- [ ] **Step 3: Fix setView top-down beta to avoid mirror glare**

```typescript
setView(v: 'standard' | 'top'): void {
  if (v === 'top') {
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = 0.25; // ~14° from vertical — readable top-down without mirror artifact
    this.camera.radius = 38;
  } else {
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = Math.PI / 3.2;
    this.camera.radius = 32;
  }
}
```

And in constructor, update `lowerBetaLimit`:
```typescript
// BEFORE:
this.camera.lowerBetaLimit = 0.1;
// AFTER:
this.camera.lowerBetaLimit = 0.15; // prevent going fully vertical (mirror artifact)
```

- [ ] **Step 4: Build**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1 | tail -5
```

---

## Task 13: Write Playwright rework verification spec

**Files:**
- Create: `packages/client/tests/rework.spec.ts`

**Context:**  
Screenshots are captured at key moments. The spec starts a 1-human+3-bot game, performs rolls, and captures:
1. `rework-standard.png` — standard view, full board visible
2. `rework-mid-roll.png` — cup visible (before roll animation completes)
3. `rework-post-roll.png` — cup gone, dice on felt with result
4. `rework-clockwise.png` — token position after first roll (to verify direction)
5. `rework-topdown.png` — top-down view (readable, no glare)

- [ ] **Step 1: Create the spec**

```typescript
// packages/client/tests/rework.spec.ts
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

test("rework – standard view: colour bars inward, labels, tokens, ownership", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("ReworkTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();
  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#rollBtn")).toBeEnabled();

  // Take standard-view screenshot before any roll (cup visible, no tokens moved yet)
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-standard.png"),
  });

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal, "no console errors").toHaveLength(0);
});

test("rework – cup disappears and dice show result after roll", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("DiceTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();
  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });

  // Click roll and capture mid-animation (cup lifting)
  await page.locator("#rollBtn").click();
  await page.waitForTimeout(200); // mid-animation
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-mid-roll.png"),
  });

  // Wait for animation to complete
  await page.waitForTimeout(2_500);
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-post-roll.png"),
  });

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal, "no console errors").toHaveLength(0);
});

test("rework – clockwise token movement", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("ClockwiseTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();
  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });

  // Screenshot before roll (token at GO)
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-before-roll.png"),
  });

  await page.locator("#rollBtn").click();
  await page.waitForTimeout(5_000); // let animation fully complete

  // Screenshot after roll (token moved clockwise from GO)
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-clockwise.png"),
  });

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal, "no console errors").toHaveLength(0);
});

test("rework – top-down view is readable without glare", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("TopDownTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();
  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });

  // Roll a couple times so board shows ownership
  await page.locator("#rollBtn").click();
  await page.waitForTimeout(5_000);
  if (await page.locator("#buyOfferBuyBtn").isVisible().catch(() => false)) {
    await page.locator("#buyOfferBuyBtn").click();
    await page.waitForTimeout(500);
  }

  // Switch to top-down view
  const viewBtn = page.locator("#headerViewBtn");
  await expect(viewBtn).toBeVisible();
  await viewBtn.click();
  await page.waitForTimeout(800);

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-topdown.png"),
  });

  // Switch back
  await viewBtn.click();
  await page.waitForTimeout(500);

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal, "no console errors").toHaveLength(0);
});

test("rework – ownership markers and player displays visible", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("OwnerTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();
  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });

  // Play several rounds to accumulate ownership
  for (let i = 0; i < 6; i++) {
    if (await page.locator("#rollBtn").isVisible().catch(() => false)) {
      await page.locator("#rollBtn").click();
      await page.waitForTimeout(4_000);
    }
    if (await page.locator("#buyOfferBuyBtn").isVisible().catch(() => false)) {
      await page.locator("#buyOfferBuyBtn").click();
      await page.waitForTimeout(1_000);
    }
    if (await page.locator("#actionCardConfirmBtn").isVisible().catch(() => false)) {
      await page.locator("#actionCardConfirmBtn").click().catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-ownership.png"),
  });

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal, "no console errors").toHaveLength(0);
});
```

- [ ] **Step 2: Run the new spec and verify it executes**

```bash
cd /Users/philip/Work/Other/laspoly && npx playwright test packages/client/tests/rework.spec.ts --project=chromium 2>&1 | tail -40
```

Expected: All 5 tests pass, screenshots created in `packages/client/tests/__screenshots__/`.

- [ ] **Step 3: Read each screenshot and assess visually**

Read each screenshot using the Read tool and verify:
- `rework-standard.png`: colour bars on INNER edge (between tile labels and board centre); labels horizontal; tokens small, non-overlapping; player display billboards in corners; no build errors
- `rework-mid-roll.png`: cup visible (still lifted)
- `rework-post-roll.png`: cup invisible, dice lying on felt, pip labels showing numbers
- `rework-clockwise.png`: token has moved to a tile to the right or up from GO (clockwise direction)
- `rework-topdown.png`: board clearly readable, green felt visible, no white blowout

If any screenshot fails visual inspection, iterate on the relevant task's code and re-run.

---

## Task 14: Final build + full test suite

**Files:** No new changes — verification only.

- [ ] **Step 1: Full build**

```bash
cd /Users/philip/Work/Other/laspoly && npm run build -w @laspoly/client 2>&1
```
Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 2: Run shared package tests (must stay green)**

```bash
cd /Users/philip/Work/Other/laspoly && npm test 2>&1 | tail -20
```
Expected: All 478 tests pass. (board3d.ts changes don't affect shared logic.)

- [ ] **Step 3: Run all Playwright specs**

```bash
cd /Users/philip/Work/Other/laspoly && npx playwright test packages/client/tests/ --project=chromium 2>&1 | tail -40
```
Expected: All existing specs pass (board-pass1, board-pass2, board-pass3, smoke, reconnect, rework).

- [ ] **Step 4: Confirm no servers are running**

```bash
lsof -i :8080 -i :4173 2>/dev/null | head -10
```
Expected: No output (all servers stopped by playwright after tests).

---

## Self-Review Checklist

### Spec Coverage
1. ✅ Colour bars face centre (Task 2)
2. ✅ Labels horizontal + wrapping, below bar (Task 3)
3. ✅ Tokens smaller, no overlap, grid offset (Task 4)
4. ✅ Clockwise movement analysis + verification (Task 1 + Task 13)
5. ✅ Cup click → roll handler (Task 6) + main.ts wiring (Task 6 Step 4)
6. ✅ Cup vanish + dice show result (Task 7)
7. ✅ Movement after dice animation (Task 8)
8. ✅ Ownership markers (Task 10)
9. ✅ Backward jump teleport (Task 9)
10. ✅ Per-player deed/money display (Task 11)
11. ✅ Top-down anti-glare (Task 12)
12. ✅ Tile-click hook (Task 5) + main.ts wiring (Task 5 Step 3)
13. ✅ Screenshots spec (Task 13)
14. ✅ Build + full test suite (Task 14)

### Checks
- No placeholder text
- All method signatures defined before use
- `getBoard` already imported — used in Task 11 ✓
- `outerDirection`, `getFieldAngle`, `tileXZ`, `TILE_W`, `TILE_D`, `CORNER` — all defined at module level ✓
- `GROUP_COLORS`, `PLAYER_COLOR_HEX` — module-level consts ✓
- `DirectionalLight` import needed in Task 12 — added to import list ✓
- `JAIL_POS` = 40 (imported from shared) ✓
- New public methods: `setRollHandler(cb: () => void)`, `setTileClickHandler(cb: (pos: number) => void)` — backward compatible ✓
- `dispose()` method not in the current file — not required by spec ✓
- Main.ts changes: 2 lines only after `board3d` is created ✓
