# Phase 2c — Management UI & Trade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface all property-management and trade actions (BUILD, SELL_BUILDING, MORTGAGE, UNMORTGAGE, SELL_PROPERTY, TRAVEL, PROPOSE_SWAP, RESPOND_SWAP) in the Babylon client using non-modal overlay panels, extend the 3D board to show buildings, and add a Playwright e2e test for management actions.

**Architecture:** Add pure predicate exports to `engine.ts` (wrapping existing private helpers). Add three non-modal panels to `ui.ts` — My-Properties panel, Travel chooser, Trade panel — all appended inside `#gameHud` with scoped `pointer-events`. Extend `board3d.ts` to render small building markers per tile. Add a Playwright spec that exercises Mortgage/Sell on owned property. Add vitest unit tests for the new predicates.

**Tech Stack:** TypeScript/ESM, Babylon.js (board3d), plain DOM (ui), Vitest (unit), Playwright (e2e). Node 22, npm workspaces.

## Global Constraints

- NON-MODAL is mandatory: panels must never block the rest of the UI (chat input, camera, roll button, event log must stay interactive while any panel is open).
- `#gameHud > *` already has `pointer-events: auto`; new panels go inside `#gameHud`.
- Do NOT change game rules, balance numbers, or internal engine logic — only add pure exported wrappers.
- ESM strict TS — no `require()`, no `default` re-exports that break the existing barrel.
- Match existing plain-TS style (no framework). Keep additions minimal/lazy.
- German primary labels. Use existing i18n keys where possible; new labels are inline German strings.
- `npm run build -w @laspoly/client` must succeed.
- `npm test` (vitest, currently 131) must stay fully green after adding new unit tests.
- All existing Playwright specs must still pass.
- Stations are at fixed positions `[5, 15, 25, 35]` (constant in engine).

---

## File map

| File | Action | Purpose |
|------|--------|---------|
| `packages/shared/src/engine.ts` | Modify | Add 7 exported predicate functions |
| `packages/shared/src/engine.test.ts` | Modify | Add unit tests for the 7 predicates |
| `packages/client/src/ui.ts` | Modify | Add My-Properties panel, Travel chooser, Trade panels |
| `packages/client/src/board3d.ts` | Modify | Render building markers per tile on update |
| `packages/client/tests/management.spec.ts` | Create | Playwright e2e for management actions |

---

## Task 1: Add pure predicate exports to engine.ts + unit tests

**Files:**
- Modify: `packages/shared/src/engine.ts`
- Modify: `packages/shared/src/engine.test.ts`

**Interfaces:**
- Produces:
  - `canBuild(state: GameState, pos: number, kind: "house" | "hotel" | "factory"): boolean`
  - `canSellBuilding(state: GameState, pos: number): boolean`
  - `canMortgage(state: GameState, pos: number): boolean`
  - `canUnmortgage(state: GameState, pos: number): boolean`
  - `canSellProperty(state: GameState, pos: number): boolean`
  - `canTravelFrom(state: GameState, playerId: string): number[]` — returns destination station positions
  - `ownedPropsOf(state: GameState, playerId: string): number[]`

- [ ] **Step 1: Add the 7 exported functions to engine.ts**

  Open `packages/shared/src/engine.ts`. At the very bottom, just before the final `export { mortgageValue, tilePrice };` line (line 1116), insert:

  ```typescript
  // ---- exported UI predicates -----------------------------------------------

  const STATION_POSITIONS_SET = new Set(STATION_POSITIONS);

  export function ownedPropsOf(state: GameState, playerId: string): number[] {
    return Object.entries(state.ownership)
      .filter(([, id]) => id === playerId)
      .map(([pos]) => Number(pos));
  }

  export function canBuild(state: GameState, pos: number, kind: "house" | "hotel" | "factory"): boolean {
    const board = getBoard(state.boardId);
    const tile = board.tiles[pos];
    if (!tile || tile.type !== "street") return false;
    if (state.ownership[pos] !== currentPlayer(state).id) return false;
    if (!ownsWholeGroup(state, board, currentPlayer(state).id, (tile as StreetTile).group)) return false;
    if (state.mortgaged[pos]) return false;
    if (kind === "house") return canConstructHouse(state, board, pos);
    if (kind === "hotel") return canConstructHotel(state, board, pos);
    if (kind === "factory") return canConstructFactory(state, board, pos);
    return false;
  }

  export function canSellBuilding(state: GameState, pos: number): boolean {
    const board = getBoard(state.boardId);
    const tile = board.tiles[pos];
    if (!tile || tile.type !== "street") return false;
    const b = getBuildingsAt(state, pos);
    if (b.hotel) return true;
    if (b.factory) return true;
    if (b.houses > 0) return canSellHouse(state, board, pos);
    return false;
  }

  export function canMortgage(state: GameState, pos: number): boolean {
    const board = getBoard(state.boardId);
    const tile = board.tiles[pos];
    if (!tile) return false;
    if (state.mortgaged[pos]) return false;
    const b = getBuildingsAt(state, pos);
    return !(b.houses > 0 || b.hotel || b.factory);
  }

  export function canUnmortgage(state: GameState, pos: number): boolean {
    const board = getBoard(state.boardId);
    const tile = board.tiles[pos];
    if (!tile) return false;
    if (!state.mortgaged[pos]) return false;
    const player = currentPlayer(state);
    const mv = mortgageValue(board, tile);
    const cost = Math.floor(mv * board.rules.mortgageUnmortgageMultiplier);
    return player.money >= cost;
  }

  export function canSellProperty(state: GameState, pos: number): boolean {
    const board = getBoard(state.boardId);
    const tile = board.tiles[pos];
    if (!tile) return false;
    if (state.mortgaged[pos]) return false;
    const b = getBuildingsAt(state, pos);
    return !(b.houses > 0 || b.hotel || b.factory);
  }

  export function canTravelFrom(state: GameState, playerId: string): number[] {
    const player = state.players.find((p) => p.id === playerId);
    if (!player || !STATION_POSITIONS_SET.has(player.position)) return [];
    return STATION_POSITIONS.filter((s) => s !== player.position);
  }
  ```

  These functions call the existing private `canConstructHouse`, `canConstructHotel`, `canConstructFactory`, `canSellHouse`, `getBuildingsAt`, `ownsWholeGroup`, `mortgageValue` functions that are already defined in scope.

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  npm run build -w @laspoly/shared 2>&1 | tail -5
  ```
  Expected: no errors, exits 0.
  
  (If there is no build script in shared, just ensure the client build below passes.)

- [ ] **Step 3: Write unit tests for the 7 predicates**

  Append to the END of `packages/shared/src/engine.test.ts`:

  ```typescript
  // ---------------------------------------------------------------------------
  // Predicate exports (Phase 2c)
  // ---------------------------------------------------------------------------

  import {
    canBuild,
    canSellBuilding,
    canMortgage,
    canUnmortgage,
    canSellProperty,
    canTravelFrom,
    ownedPropsOf,
  } from "./engine.js";

  describe("ownedPropsOf", () => {
    it("returns positions owned by the given player", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[1] = "A";
      s.ownership[3] = "B";
      s.ownership[4] = "A";
      expect(ownedPropsOf(s, "A").sort((a, b) => a - b)).toEqual([1, 4]);
      expect(ownedPropsOf(s, "B")).toEqual([3]);
    });

    it("returns empty array when player owns nothing", () => {
      expect(ownedPropsOf(twoPlayers(), "A")).toEqual([]);
    });
  });

  describe("canBuild", () => {
    it("returns true for house when player owns full group", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      s.ownership[14] = "A";
      s.players[0]!.money = 5000;
      expect(canBuild(s, 13, "house")).toBe(true);
    });

    it("returns false when player does not own full group", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A"; // missing 14
      expect(canBuild(s, 13, "house")).toBe(false);
    });

    it("returns false for hotel when not enough houses", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      s.ownership[14] = "A";
      s.players[0]!.money = 5000;
      expect(canBuild(s, 13, "hotel")).toBe(false);
    });

    it("returns false on non-street tile", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[5] = "A"; // station
      expect(canBuild(s, 5, "house")).toBe(false);
    });
  });

  describe("canSellBuilding", () => {
    it("returns true when there is a house", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      s.ownership[14] = "A";
      s.buildings[13] = { houses: 1, hotel: false, factory: false };
      s.buildings[14] = { houses: 1, hotel: false, factory: false };
      expect(canSellBuilding(s, 13)).toBe(true);
    });

    it("returns false when no buildings", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      expect(canSellBuilding(s, 13)).toBe(false);
    });

    it("returns true when hotel", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      s.buildings[13] = { houses: 0, hotel: true, factory: false };
      expect(canSellBuilding(s, 13)).toBe(true);
    });
  });

  describe("canMortgage", () => {
    it("returns true for an unbuilt, unmortgaged property", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      expect(canMortgage(s, 13)).toBe(true);
    });

    it("returns false when already mortgaged", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      s.mortgaged[13] = true;
      expect(canMortgage(s, 13)).toBe(false);
    });

    it("returns false when property has buildings", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      s.buildings[13] = { houses: 2, hotel: false, factory: false };
      expect(canMortgage(s, 13)).toBe(false);
    });
  });

  describe("canUnmortgage", () => {
    it("returns true when mortgaged and player can afford it", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      s.mortgaged[13] = true;
      s.players[0]!.money = 5000;
      expect(canUnmortgage(s, 13)).toBe(true);
    });

    it("returns false when player cannot afford unmortgage cost", () => {
      const board = getBoard("vegas");
      const tile = board.tiles[13]!;
      if (tile.type !== "street") throw new Error("not a street");
      const cost = Math.floor(tile.mortgage * board.rules.mortgageUnmortgageMultiplier);
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      s.mortgaged[13] = true;
      s.players[0]!.money = cost - 1;
      expect(canUnmortgage(s, 13)).toBe(false);
    });

    it("returns false when not mortgaged", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      expect(canUnmortgage(s, 13)).toBe(false);
    });
  });

  describe("canSellProperty", () => {
    it("returns true for unbuilt, unmortgaged property", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      expect(canSellProperty(s, 13)).toBe(true);
    });

    it("returns false when mortgaged", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      s.mortgaged[13] = true;
      expect(canSellProperty(s, 13)).toBe(false);
    });

    it("returns false when has buildings", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.ownership[13] = "A";
      s.buildings[13] = { houses: 1, hotel: false, factory: false };
      expect(canSellProperty(s, 13)).toBe(false);
    });
  });

  describe("canTravelFrom", () => {
    it("returns the other 3 stations when player is at a station", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.players[0]!.position = 5; // Caesar Station
      const dests = canTravelFrom(s, "A");
      expect(dests.sort((a, b) => a - b)).toEqual([15, 25, 35]);
    });

    it("returns empty when player is not at a station", () => {
      const s: GameState = structuredClone(twoPlayers());
      s.players[0]!.position = 1; // street
      expect(canTravelFrom(s, "A")).toEqual([]);
    });

    it("returns empty for unknown playerId", () => {
      const s: GameState = structuredClone(twoPlayers());
      expect(canTravelFrom(s, "UNKNOWN")).toEqual([]);
    });
  });
  ```

- [ ] **Step 4: Run vitest to verify all tests pass (existing 131 + new ~20)**

  ```bash
  npm test 2>&1 | tail -15
  ```
  Expected output includes: `Tests  NNN passed` with no failures.

- [ ] **Step 5: Commit**

  ```bash
  git add packages/shared/src/engine.ts packages/shared/src/engine.test.ts
  git commit -m "feat(engine): export UI predicate helpers for Phase 2c management panel"
  ```

---

## Task 2: My-Properties panel in ui.ts

**Files:**
- Modify: `packages/client/src/ui.ts`

**Interfaces:**
- Consumes from Task 1:
  - `canBuild(state, pos, kind)`, `canSellBuilding(state, pos)`, `canMortgage(state, pos)`, `canUnmortgage(state, pos)`, `canSellProperty(state, pos)`, `ownedPropsOf(state, playerId)` — all from `@laspoly/shared`
- Consumes: `getBoard`, `mortgageValue`, `tilePrice` from `@laspoly/shared`
- Produces: `#myPropsPanel` DOM element inside `#gameHud`. Panel appears during `awaiting-roll` when it's the human's turn and they own at least one property.

- [ ] **Step 1: Update the import line at the top of ui.ts**

  Find the existing import:
  ```typescript
  import { VERSION, listBoards } from "@laspoly/shared";
  import type { RoomSummary, RoomView, GameState, FormattedEvent } from "@laspoly/shared";
  ```
  
  Replace with:
  ```typescript
  import {
    VERSION,
    listBoards,
    getBoard,
    mortgageValue,
    tilePrice,
    canBuild,
    canSellBuilding,
    canMortgage,
    canUnmortgage,
    canSellProperty,
    ownedPropsOf,
    canTravelFrom,
  } from "@laspoly/shared";
  import type { RoomSummary, RoomView, GameState, FormattedEvent, StreetTile } from "@laspoly/shared";
  ```

- [ ] **Step 2: Add CSS for the new panels inside the `css` string**

  In `ui.ts`, find the line:
  ```typescript
  const css = `
  ```

  After the existing `#versionBadge` CSS block (before the closing backtick of the `css` template literal), add:

  ```css
  #myPropsPanel {
    position: absolute; top: 16px; right: 16px;
    width: 280px;
    max-height: 70vh;
    overflow-y: auto;
  }
  .prop-row { padding: 8px; border: 1px solid #333; border-radius: 4px; margin: 4px 0; font-size: 12px; }
  .prop-row .prop-name { font-weight: bold; color: #eee; }
  .prop-row .prop-detail { color: #aaa; font-size: 11px; margin: 2px 0; }
  .prop-btn { font-size: 11px; padding: 3px 8px; margin: 2px 1px; }
  .prop-btn.danger { background: #991b1b; }
  .prop-btn.danger:hover { background: #7f1d1d; }
  #travelPanel {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 260px;
  }
  #tradePanel {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 340px;
    max-height: 80vh;
    overflow-y: auto;
  }
  #incomingSwapPanel {
    position: absolute; bottom: 80px; right: 16px;
    width: 300px;
  }
  .swap-section { margin: 8px 0; padding: 6px; background: rgba(255,255,255,0.05); border-radius: 4px; }
  .swap-label { font-size: 12px; color: #aaa; margin-bottom: 4px; }
  .swap-check-row { display: flex; align-items: center; gap: 6px; margin: 3px 0; font-size: 12px; }
  ```

- [ ] **Step 3: Add private fields for the new panels**

  In the `UI` class, after the existing private field declaration:
  ```typescript
  private wasMyTurn = false;
  private myName: string | null = null;
  ```
  
  Add:
  ```typescript
  private myPropsPanel!: HTMLDivElement;
  private travelPanel!: HTMLDivElement;
  private tradePanel!: HTMLDivElement;
  private incomingSwapPanel!: HTMLDivElement;
  ```

- [ ] **Step 4: Call new build methods from the constructor**

  In the `constructor`, after `this.buildGameOverBanner();`:
  ```typescript
  this.buildMyPropsPanel();
  this.buildTravelPanel();
  this.buildTradePanel();
  this.buildIncomingSwapPanel();
  ```

- [ ] **Step 5: Implement buildMyPropsPanel()**

  Add this method to the `UI` class (before `buildGameOverBanner`):

  ```typescript
  private buildMyPropsPanel() {
    const panel = document.createElement("div");
    panel.id = "myPropsPanel";
    panel.className = "panel";
    hide(panel);
    this.gameHud.appendChild(panel);
    this.myPropsPanel = panel;
  }
  ```

- [ ] **Step 6: Implement buildTravelPanel()**

  ```typescript
  private buildTravelPanel() {
    const panel = document.createElement("div");
    panel.id = "travelPanel";
    panel.className = "panel";
    hide(panel);
    this.gameHud.appendChild(panel);
    this.travelPanel = panel;
  }
  ```

- [ ] **Step 7: Implement buildTradePanel()**

  ```typescript
  private buildTradePanel() {
    const panel = document.createElement("div");
    panel.id = "tradePanel";
    panel.className = "panel";
    hide(panel);
    this.gameHud.appendChild(panel);
    this.tradePanel = panel;
  }
  ```

- [ ] **Step 8: Implement buildIncomingSwapPanel()**

  ```typescript
  private buildIncomingSwapPanel() {
    const panel = document.createElement("div");
    panel.id = "incomingSwapPanel";
    panel.className = "panel";
    hide(panel);
    this.gameHud.appendChild(panel);
    this.incomingSwapPanel = panel;
  }
  ```

  Note: `this.gameHud` must already exist before these are called. The constructor calls `buildGameHud()` first, so it's fine.

- [ ] **Step 9: Add refreshMyPropsPanel() method**

  This is the main rendering function. Add it to the UI class:

  ```typescript
  private refreshMyPropsPanel(state: GameState, myId: string) {
    const panel = this.myPropsPanel;
    panel.innerHTML = "";

    const board = getBoard(state.boardId);
    const props = ownedPropsOf(state, myId).sort((a, b) => a - b);

    if (props.length === 0) {
      hide(panel);
      return;
    }

    // Header with trade button
    const header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;";
    header.innerHTML = `<span style="font-size:13px;color:#facc15;font-weight:bold;">Meine Grundstücke</span>`;
    const tradeBtn = document.createElement("button");
    tradeBtn.className = "prop-btn";
    tradeBtn.textContent = "Tauschen";
    tradeBtn.addEventListener("click", () => {
      const panelVisible = this.tradePanel.style.display !== "none";
      if (panelVisible) {
        hide(this.tradePanel);
      } else {
        this.refreshTradePanel(state, myId);
        show(this.tradePanel, "block");
      }
    });
    header.appendChild(tradeBtn);
    panel.appendChild(header);

    for (const pos of props) {
      const tile = board.tiles[pos];
      if (!tile) continue;
      const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
      const isMortgaged = !!state.mortgaged[pos];

      const row = document.createElement("div");
      row.className = "prop-row";

      const groupColor = (tile as { group?: string }).group
        ? `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${this.groupCssColor((tile as { group?: string }).group ?? "")};margin-right:4px;"></span>`
        : "";

      let buildingStr = "";
      if (b.hotel) buildingStr = "🏨 Hotel";
      else if (b.factory) buildingStr = "🏭 Fabrik";
      else if (b.houses > 0) buildingStr = `🏠×${b.houses}`;
      else buildingStr = "—";

      const mortgageStr = isMortgaged ? " <span style='color:#f87171;'>[Hypothek]</span>" : "";

      row.innerHTML = `
        <div class="prop-name">${groupColor}${tile.name}${mortgageStr}</div>
        <div class="prop-detail">Gebäude: ${buildingStr}</div>
      `;

      // Buttons
      const btnRow = document.createElement("div");
      btnRow.style.marginTop = "4px";

      // BUILD buttons (only for streets with whole-group ownership)
      if (tile.type === "street") {
        const st = tile as StreetTile;
        if (canBuild(state, pos, "house")) {
          const btn = document.createElement("button");
          btn.className = "prop-btn";
          btn.textContent = `Haus (${st.houseCost} LPD)`;
          btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "house" } }));
          btnRow.appendChild(btn);
        }
        if (canBuild(state, pos, "hotel")) {
          const btn = document.createElement("button");
          btn.className = "prop-btn";
          btn.textContent = `Hotel (${st.hotelCost} LPD)`;
          btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "hotel" } }));
          btnRow.appendChild(btn);
        }
        if (canBuild(state, pos, "factory")) {
          const btn = document.createElement("button");
          btn.className = "prop-btn";
          btn.textContent = `Fabrik (${st.factoryCost} LPD)`;
          btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "factory" } }));
          btnRow.appendChild(btn);
        }
        if (canSellBuilding(state, pos)) {
          const btn = document.createElement("button");
          btn.className = "prop-btn danger";
          btn.textContent = "Gebäude verk.";
          btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "SELL_BUILDING", pos } }));
          btnRow.appendChild(btn);
        }
      }

      if (canMortgage(state, pos)) {
        const mv = mortgageValue(board, tile);
        const btn = document.createElement("button");
        btn.className = "prop-btn";
        btn.textContent = `Hypothek (+${mv})`;
        btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "MORTGAGE", pos } }));
        btnRow.appendChild(btn);
      }
      if (canUnmortgage(state, pos)) {
        const mv = mortgageValue(board, tile);
        const cost = Math.floor(mv * board.rules.mortgageUnmortgageMultiplier);
        const btn = document.createElement("button");
        btn.className = "prop-btn";
        btn.textContent = `Ablösen (-${cost})`;
        btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "UNMORTGAGE", pos } }));
        btnRow.appendChild(btn);
      }
      if (canSellProperty(state, pos)) {
        const refund = Math.floor(tilePrice(board, tile) / 2);
        const btn = document.createElement("button");
        btn.className = "prop-btn danger";
        btn.textContent = `Verkaufen (+${refund})`;
        btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "SELL_PROPERTY", pos } }));
        btnRow.appendChild(btn);
      }

      if (btnRow.children.length > 0) row.appendChild(btnRow);
      panel.appendChild(row);
    }

    show(panel, "block");
  }

  private groupCssColor(group: string): string {
    const map: Record<string, string> = {
      brown: "#8B4513", deeppink: "#FF1493", turquoise: "#40E0D0",
      violet: "#EE82EE", mistyrose: "#FFE4E1", orange: "#FFA500",
      lightgreen: "#90EE90", red: "#FF0000", yellow: "#FFFF00",
      darkviolet: "#9400D3", darkgreen: "#006400", royalblue: "#4169E1",
      station: "#888888", attraction: "#FFD700",
    };
    return map[group] ?? "#666";
  }
  ```

- [ ] **Step 10: Add refreshTravelPanel() method**

  ```typescript
  private refreshTravelPanel(state: GameState, myId: string) {
    const panel = this.travelPanel;
    panel.innerHTML = "";

    const dests = canTravelFrom(state, myId);
    if (dests.length === 0) {
      hide(panel);
      return;
    }

    const board = getBoard(state.boardId);
    const me = state.players.find((p) => p.id === myId)!;

    const title = document.createElement("div");
    title.style.cssText = "font-size:13px;color:#facc15;font-weight:bold;margin-bottom:8px;";
    title.textContent = "Reisen nach…";
    panel.appendChild(title);

    for (const dest of dests) {
      const tile = board.tiles[dest];
      if (!tile) continue;
      const destOwner = state.ownership[dest];
      let ticketCost = 0;
      if (destOwner && destOwner !== myId) {
        const stationsOwned = Object.entries(state.ownership).filter(([, id]) => id === destOwner && [5, 15, 25, 35].includes(Number(Object.keys(board.tiles).find(k => board.tiles[Number(k)]?.type === "station" && Number(k) === Number(Object.keys(state.ownership).find(ok => state.ownership[Number(ok)] === destOwner && [5,15,25,35].includes(Number(ok)) && Number(ok) !== me.position))))))))).length;
        // simplified: count stations owned by destOwner
        const count = Object.entries(state.ownership).filter(([pos, id]) => id === destOwner && [5,15,25,35].includes(Number(pos))).length;
        const idx = Math.min(count - 1, 2);
        ticketCost = board.rules.station.travel[idx] ?? 0;
      }

      const btn = document.createElement("button");
      btn.style.cssText = "display:block;width:100%;margin:4px 0;text-align:left;";
      btn.textContent = ticketCost > 0
        ? `${tile.name} (${ticketCost} LPD Ticket)`
        : `${tile.name} (kostenlos)`;
      btn.addEventListener("click", () => {
        this.net.send({ t: "command", command: { type: "TRAVEL", toPos: dest } });
        hide(panel);
      });
      panel.appendChild(btn);
    }

    const closeBtn = document.createElement("button");
    closeBtn.style.cssText = "display:block;width:100%;margin-top:8px;background:#555;";
    closeBtn.textContent = "Schließen";
    closeBtn.addEventListener("click", () => hide(panel));
    panel.appendChild(closeBtn);
  }
  ```

  Note: The ticket cost calculation above has a nested mess — simplify to a clean helper. Replace the entire `refreshTravelPanel` method body with:

  ```typescript
  private refreshTravelPanel(state: GameState, myId: string) {
    const panel = this.travelPanel;
    panel.innerHTML = "";

    const dests = canTravelFrom(state, myId);
    if (dests.length === 0) { hide(panel); return; }

    const board = getBoard(state.boardId);
    const stationPositions = [5, 15, 25, 35];

    const title = document.createElement("div");
    title.style.cssText = "font-size:13px;color:#facc15;font-weight:bold;margin-bottom:8px;";
    title.textContent = "Reisen nach…";
    panel.appendChild(title);

    for (const dest of dests) {
      const tile = board.tiles[dest];
      if (!tile) continue;
      const destOwner = state.ownership[dest];
      let ticketCost = 0;
      if (destOwner && destOwner !== myId) {
        const count = stationPositions.filter((p) => state.ownership[p] === destOwner).length;
        ticketCost = board.rules.station.travel[Math.min(count - 1, 2)] ?? 0;
      }

      const btn = document.createElement("button");
      btn.style.cssText = "display:block;width:100%;margin:4px 0;text-align:left;";
      btn.textContent = ticketCost > 0
        ? `${tile.name} (${ticketCost} LPD Ticket)`
        : `${tile.name} (kostenlos)`;
      btn.addEventListener("click", () => {
        this.net.send({ t: "command", command: { type: "TRAVEL", toPos: dest } });
        hide(panel);
      });
      panel.appendChild(btn);
    }

    const closeBtn = document.createElement("button");
    closeBtn.style.cssText = "display:block;width:100%;margin-top:8px;background:#555;";
    closeBtn.textContent = "Schließen";
    closeBtn.addEventListener("click", () => hide(panel));
    panel.appendChild(closeBtn);
  }
  ```

- [ ] **Step 11: Add refreshTradePanel() method**

  ```typescript
  private refreshTradePanel(state: GameState, myId: string) {
    const panel = this.tradePanel;
    panel.innerHTML = "";

    const board = getBoard(state.boardId);
    const alivePlayers = state.players.filter((p) => p.alive && p.id !== myId);

    const title = document.createElement("div");
    title.style.cssText = "font-size:13px;color:#facc15;font-weight:bold;margin-bottom:10px;";
    title.textContent = "Tauschangebot erstellen";
    panel.appendChild(title);

    // Target player selector
    const targetLabel = document.createElement("label");
    targetLabel.textContent = "Anbieten an:";
    panel.appendChild(targetLabel);

    const targetSelect = document.createElement("select");
    for (const p of alivePlayers) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      targetSelect.appendChild(opt);
    }
    panel.appendChild(targetSelect);

    // My props to give
    const myProps = ownedPropsOf(state, myId).filter((pos) => {
      const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
      return !(b.houses > 0 || b.hotel || b.factory) && !state.mortgaged[pos];
    });

    const giveSection = document.createElement("div");
    giveSection.className = "swap-section";
    giveSection.innerHTML = `<div class="swap-label">Ich gebe (Grundstücke):</div>`;

    const giveChecks = new Map<number, HTMLInputElement>();
    for (const pos of myProps) {
      const tile = board.tiles[pos];
      if (!tile) continue;
      const row = document.createElement("div");
      row.className = "swap-check-row";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = `give_${pos}`;
      const lbl = document.createElement("label");
      lbl.htmlFor = `give_${pos}`;
      lbl.textContent = tile.name;
      row.appendChild(cb);
      row.appendChild(lbl);
      giveSection.appendChild(row);
      giveChecks.set(pos, cb);
    }

    const giveMoney = document.createElement("div");
    giveMoney.className = "swap-check-row";
    giveMoney.innerHTML = `<label>Geld geben: <input id="giveMoneyInput" type="number" min="0" value="0" style="width:80px;display:inline;margin-left:4px;" /> LPD</label>`;
    giveSection.appendChild(giveMoney);
    panel.appendChild(giveSection);

    // Target props to receive — updates when target changes
    const receiveSection = document.createElement("div");
    receiveSection.className = "swap-section";
    panel.appendChild(receiveSection);

    const receiveMoney = document.createElement("div");
    receiveMoney.className = "swap-section";
    receiveMoney.innerHTML = `<div class="swap-label">Ich erhalte (Geld):</div><div class="swap-check-row"><label>Geld erhalten: <input id="receiveMoneyInput" type="number" min="0" value="0" style="width:80px;display:inline;margin-left:4px;" /> LPD</label></div>`;
    panel.appendChild(receiveMoney);

    const receiveChecks = new Map<number, HTMLInputElement>();

    const rebuildReceiveSection = () => {
      receiveSection.innerHTML = `<div class="swap-label">Ich erhalte (Grundstücke von ${targetSelect.options[targetSelect.selectedIndex]?.text ?? "?"}):</div>`;
      receiveChecks.clear();
      const tId = targetSelect.value;
      const theirProps = ownedPropsOf(state, tId).filter((pos) => {
        const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
        return !(b.houses > 0 || b.hotel || b.factory) && !state.mortgaged[pos];
      });
      for (const pos of theirProps) {
        const tile = board.tiles[pos];
        if (!tile) continue;
        const row = document.createElement("div");
        row.className = "swap-check-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = `recv_${pos}`;
        const lbl = document.createElement("label");
        lbl.htmlFor = `recv_${pos}`;
        lbl.textContent = tile.name;
        row.appendChild(cb);
        row.appendChild(lbl);
        receiveSection.appendChild(row);
        receiveChecks.set(pos, cb);
      }
    };

    rebuildReceiveSection();
    targetSelect.addEventListener("change", rebuildReceiveSection);

    // Buttons
    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:8px;margin-top:12px;";

    const offerBtn = document.createElement("button");
    offerBtn.textContent = "Anbieten";
    offerBtn.addEventListener("click", () => {
      const toId = targetSelect.value;
      const giveProps = [...giveChecks.entries()].filter(([, cb]) => cb.checked).map(([pos]) => pos);
      const recvProps = [...receiveChecks.entries()].filter(([, cb]) => cb.checked).map(([pos]) => pos);
      const giveMoneyVal = parseInt((document.getElementById("giveMoneyInput") as HTMLInputElement).value, 10) || 0;
      const recvMoneyVal = parseInt((document.getElementById("receiveMoneyInput") as HTMLInputElement).value, 10) || 0;
      this.net.send({
        t: "command",
        command: {
          type: "PROPOSE_SWAP",
          toId,
          give: { props: giveProps, money: giveMoneyVal },
          receive: { props: recvProps, money: recvMoneyVal },
        },
      });
      hide(panel);
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.style.cssText = "background:#555;";
    cancelBtn.textContent = "Abbrechen";
    cancelBtn.addEventListener("click", () => hide(panel));

    btnRow.appendChild(offerBtn);
    btnRow.appendChild(cancelBtn);
    panel.appendChild(btnRow);
  }
  ```

- [ ] **Step 12: Add refreshIncomingSwapPanel() method**

  ```typescript
  private refreshIncomingSwapPanel(state: GameState, myId: string) {
    const panel = this.incomingSwapPanel;
    const swap = state.pendingSwap;

    if (!swap || swap.toId !== myId) {
      hide(panel);
      return;
    }

    panel.innerHTML = "";
    const board = getBoard(state.boardId);
    const from = state.players.find((p) => p.id === swap.fromId);

    const title = document.createElement("div");
    title.style.cssText = "font-size:13px;color:#facc15;font-weight:bold;margin-bottom:8px;";
    title.textContent = `Tauschangebot von ${from?.name ?? "?"}`;
    panel.appendChild(title);

    const giveNames = swap.give.props.map((pos) => board.tiles[pos]?.name ?? `Pos ${pos}`).join(", ") || "—";
    const recvNames = swap.receive.props.map((pos) => board.tiles[pos]?.name ?? `Pos ${pos}`).join(", ") || "—";

    const info = document.createElement("div");
    info.style.cssText = "font-size:12px;color:#ccc;margin-bottom:10px;";
    info.innerHTML = `
      <div><strong>Du gibst:</strong> ${recvNames} + ${swap.receive.money} LPD</div>
      <div><strong>Du erhältst:</strong> ${giveNames} + ${swap.give.money} LPD</div>
    `;
    panel.appendChild(info);

    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.gap = "8px";

    const acceptBtn = document.createElement("button");
    acceptBtn.textContent = "Annehmen";
    acceptBtn.addEventListener("click", () => {
      this.net.send({ t: "command", command: { type: "RESPOND_SWAP", accept: true } });
      hide(panel);
    });

    const declineBtn = document.createElement("button");
    declineBtn.style.background = "#991b1b";
    declineBtn.textContent = "Ablehnen";
    declineBtn.addEventListener("click", () => {
      this.net.send({ t: "command", command: { type: "RESPOND_SWAP", accept: false } });
      hide(panel);
    });

    btnRow.appendChild(acceptBtn);
    btnRow.appendChild(declineBtn);
    panel.appendChild(btnRow);

    show(panel, "block");
  }
  ```

- [ ] **Step 13: Wire panels into updateGame()**

  In `updateGame()`, at the END of the method, just before the closing `}`, add:

  ```typescript
  // Incoming swap panel (visible regardless of whose turn it is)
  if (myId) {
    this.refreshIncomingSwapPanel(state, myId);
  } else {
    hide(this.incomingSwapPanel);
  }

  // My-properties panel + travel (only during my awaiting-roll turn)
  const showMgmt = isMyTurn && amAlive && state.phase === "awaiting-roll" && !me?.inJail;
  if (showMgmt && myId) {
    this.refreshMyPropsPanel(state, myId);

    // Travel panel: show travel button if player is at a station
    const travelDests = canTravelFrom(state, myId);
    if (travelDests.length > 0) {
      this.refreshTravelPanel(state, myId);
      show(this.travelPanel, "block");
    } else {
      hide(this.travelPanel);
    }
  } else {
    hide(this.myPropsPanel);
    hide(this.travelPanel);
    // Hide trade panel too (but only if it belongs to my turn)
    if (!isMyTurn) hide(this.tradePanel);
  }
  ```

  Also add at the start of `updateGame` (after `const me = ...`) to close the trade panel when swap pending clears:
  ```typescript
  // If a swap was pending and is now gone, refresh incoming panel
  // (handled below)
  ```
  (No extra code needed — `refreshIncomingSwapPanel` already handles hiding when no pending swap.)

- [ ] **Step 14: Build and check TypeScript**

  ```bash
  npm run build -w @laspoly/client 2>&1 | tail -20
  ```
  Expected: exits 0 with no TypeScript errors.

- [ ] **Step 15: Commit**

  ```bash
  git add packages/client/src/ui.ts
  git commit -m "feat(ui): add non-modal My-Properties, Travel, Trade panels (Phase 2c)"
  ```

---

## Task 3: Board3D building markers

**Files:**
- Modify: `packages/client/src/board3d.ts`

**Interfaces:**
- Consumes: `state.buildings`, `state.mortgaged` from `GameState`
- Produces: Per-tile building marker meshes that appear/disappear to reflect `state.buildings`. Meshes are named `bldg_${pos}`.

- [ ] **Step 1: Add building marker tracking field**

  In the `Board3D` class, after `private tokenMeshes`:
  ```typescript
  private buildingMeshes: Map<number, ReturnType<typeof MeshBuilder.CreateBox>> = new Map();
  ```

- [ ] **Step 2: Add updateBuildings() method**

  Add this method to the `Board3D` class (before `update()`):

  ```typescript
  private updateBuildings(state: GameState) {
    // Remove markers for positions no longer in state.buildings
    for (const [pos, mesh] of this.buildingMeshes) {
      const b = state.buildings[pos];
      if (!b || (!b.houses && !b.hotel && !b.factory)) {
        mesh.dispose();
        this.buildingMeshes.delete(pos);
      }
    }

    for (const [posStr, b] of Object.entries(state.buildings)) {
      const pos = Number(posStr);
      if (!b || (!b.houses && !b.hotel && !b.factory)) continue;
      const [x, z] = tileXZ(pos);

      const existing = this.buildingMeshes.get(pos);
      if (existing) existing.dispose();

      let mesh: ReturnType<typeof MeshBuilder.CreateBox>;
      const mat = new StandardMaterial(`bldgMat_${pos}`, this.scene);

      if (b.hotel) {
        // Hotel: tall red box
        mesh = MeshBuilder.CreateBox(`bldg_${pos}`, { width: 0.4, height: 0.6, depth: 0.4 }, this.scene);
        mat.diffuseColor = new Color3(0.8, 0.1, 0.1);
      } else if (b.factory) {
        // Factory: wide grey box with yellow tint
        mesh = MeshBuilder.CreateBox(`bldg_${pos}`, { width: 0.6, height: 0.35, depth: 0.6 }, this.scene);
        mat.diffuseColor = new Color3(0.6, 0.6, 0.2);
      } else {
        // Houses: small green boxes stacked in a row
        mesh = MeshBuilder.CreateBox(`bldg_${pos}`, { width: 0.2 * b.houses, height: 0.25, depth: 0.2 }, this.scene);
        mat.diffuseColor = new Color3(0.1, 0.7, 0.1);
      }

      // Dim mortgaged tiles
      if (state.mortgaged[pos]) {
        mat.diffuseColor = mat.diffuseColor.scale(0.4);
      }

      mesh.material = mat;
      mesh.position.set(x, 0.35, z - 0.5); // offset toward the color bar side
      this.buildingMeshes.set(pos, mesh);
    }

    // Also dim/undim tile materials for mortgaged state (optional visual)
    // (not implemented to keep it lightweight)
  }
  ```

- [ ] **Step 3: Call updateBuildings from update()**

  In the `update()` method, at the end (after the player token loop), add:
  ```typescript
  this.updateBuildings(state);
  ```

- [ ] **Step 4: Build and verify no TS errors**

  ```bash
  npm run build -w @laspoly/client 2>&1 | tail -10
  ```
  Expected: exits 0.

- [ ] **Step 5: Commit**

  ```bash
  git add packages/client/src/board3d.ts
  git commit -m "feat(board3d): render building markers (house/hotel/factory) on tiles"
  ```

---

## Task 4: Playwright e2e test for management actions

**Files:**
- Create: `packages/client/tests/management.spec.ts`

**Interfaces:**
- Consumes: `#myPropsPanel`, `.prop-btn`, `#chatInput`, `#eventLog` DOM elements from the running app.
- The test drives a game until the human owns a property, then exercises MORTGAGE (confirmed by money increase + log line "Hypothek"), and verifies NON-MODALITY (chat input stays interactive).

- [ ] **Step 1: Create the test file**

  Create `packages/client/tests/management.spec.ts` with:

  ```typescript
  /**
   * Phase 2c Management UI e2e test.
   *
   * Drives a game (1 human + 3 bots) until the human owns at least one property,
   * then:
   *   1. Verifies #myPropsPanel appears during human's awaiting-roll turn.
   *   2. Verifies chat input stays interactive while panel is open (non-modal).
   *   3. Clicks "Hypothek" button on an owned property.
   *   4. Verifies the event log shows "Hypothek" (mortgage event) and player money increased.
   *   5. Verifies no console/page errors throughout.
   */
  import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

  // ---- helpers ----------------------------------------------------------------

  async function injectStateRelay(page: Page) {
    await page.addInitScript(() => {
      const OrigWS = window.WebSocket;
      class PatchedWS extends OrigWS {
        constructor(url: string | URL, protocols?: string | string[]) {
          super(url, protocols);
          this.addEventListener("message", (ev) => {
            try {
              const msg = JSON.parse(ev.data as string);
              if (msg.t === "state") {
                let el = document.getElementById("_lastState");
                if (!el) {
                  el = document.createElement("div");
                  el.id = "_lastState";
                  el.style.display = "none";
                  document.body.appendChild(el);
                }
                el.dataset["state"] = JSON.stringify(msg.state);
                (window as Record<string, unknown>)["_stateCount"] =
                  ((window as Record<string, unknown>)["_stateCount"] as number ?? 0) + 1;
              }
              if (msg.t === "error") {
                const errs = ((window as Record<string, unknown>)["_serverErrors"] as string[] | undefined) ?? [];
                errs.push(msg.message);
                (window as Record<string, unknown>)["_serverErrors"] = errs;
              }
            } catch { /* ignore */ }
          });
        }
      }
      window.WebSocket = PatchedWS as typeof WebSocket;
    });
  }

  async function waitForAction(page: Page, timeout = 60_000): Promise<
    "roll" | "buy" | "ransom" | "gameover" | "spectator" | "timeout"
  > {
    try {
      const result = await page.waitForFunction(
        () => {
          const visible = (id: string) => {
            const el = document.getElementById(id);
            return el ? el.style.display !== "none" && el.style.display !== "" : false;
          };
          const govEl = document.getElementById("gameOverBanner");
          if (govEl && govEl.style.display === "flex") return "gameover";
          if (visible("spectatorBanner")) return "spectator";
          if (visible("rollBtn")) return "roll";
          if (visible("buyBtn")) return "buy";
          if (visible("ransomBtn")) return "ransom";
          return null;
        },
        undefined,
        { timeout },
      );
      const val = await result.jsonValue() as string | null;
      return (val ?? "timeout") as "roll" | "buy" | "ransom" | "gameover" | "spectator" | "timeout";
    } catch {
      return "timeout";
    }
  }

  // ---- test -------------------------------------------------------------------

  test.describe("Phase 2c Management UI", () => {
    test(
      "my-properties panel appears, is non-modal, and mortgage action works",
      async ({ page }) => {
        test.setTimeout(240_000);

        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];

        page.on("console", (msg: ConsoleMessage) => {
          if (msg.type() === "error" && !msg.text().includes("favicon")) {
            consoleErrors.push(msg.text());
          }
        });
        page.on("pageerror", (err: Error) => {
          pageErrors.push(err.message);
        });

        await injectStateRelay(page);
        await page.goto("/");

        // Start a game with 3 bots, aggressive buying (human buys everything)
        await page.locator("#nickname").fill("MgmtTester");
        await page.locator("#botCount").selectOption("3");
        await page.locator("#createRoom").click();
        await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
        await page.locator("#startGame").click();
        await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

        let myPropsPanelSeen = false;
        let mortgageClicked = false;
        let mortgageLogSeen = false;
        let nonModalConfirmed = false;
        let moneyBeforeMortgage = -1;
        let moneyAfterMortgage = -1;

        const MAX_TURNS = 150;

        for (let i = 0; i < MAX_TURNS; i++) {
          const arrived = await waitForAction(page, 60_000);

          if (arrived === "timeout" || arrived === "gameover" || arrived === "spectator") break;

          if (arrived === "ransom") {
            await page.locator("#ransomBtn").click();
            await page.waitForTimeout(150);
            continue;
          }

          if (arrived === "buy") {
            // BUY aggressively to own properties quickly
            await page.locator("#buyBtn").click();
            await page.waitForTimeout(150);
            continue;
          }

          // arrived === "roll"
          // Check if #myPropsPanel is visible (human owns a property)
          const panelVisible = await page.locator("#myPropsPanel").isVisible().catch(() => false);

          if (panelVisible && !mortgageClicked) {
            myPropsPanelSeen = true;

            // Verify non-modality: chat input must be editable while panel is open
            const chatInput = page.locator("#chatInput");
            const isEnabled = await chatInput.isEnabled().catch(() => false);
            if (isEnabled) {
              await chatInput.fill("non-modal check");
              const val = await chatInput.inputValue();
              if (val === "non-modal check") nonModalConfirmed = true;
              await chatInput.fill("");
            }

            // Look for a "Hypothek" button inside #myPropsPanel
            const mortgageBtns = page.locator("#myPropsPanel button").filter({ hasText: /Hypothek/ });
            const mortgageBtnCount = await mortgageBtns.count();

            if (mortgageBtnCount > 0) {
              // Read player money before from the player list
              const playerListHtml = await page.locator("#playerList").innerHTML();
              const myMoneyMatch = playerListHtml.match(/LPD (\d+)/);
              moneyBeforeMortgage = myMoneyMatch ? parseInt(myMoneyMatch[1]!, 10) : -1;

              await mortgageBtns.first().click();
              mortgageClicked = true;

              // Wait for state update
              await page.waitForTimeout(500);

              // Check event log for "Hypothek"
              const logText = await page.locator("#eventLog").textContent();
              if (logText && logText.includes("Hypothek")) {
                mortgageLogSeen = true;
              }

              // Read money after
              const playerListHtmlAfter = await page.locator("#playerList").innerHTML();
              const myMoneyMatchAfter = playerListHtmlAfter.match(/LPD (\d+)/);
              moneyAfterMortgage = myMoneyMatchAfter ? parseInt(myMoneyMatchAfter[1]!, 10) : -1;

              // Now roll
              await page.locator("#rollBtn").click();
              await page.waitForTimeout(300);
              const buyNow = await page.locator("#buyBtn").isVisible().catch(() => false);
              if (buyNow) await page.locator("#buyBtn").click();
              await page.waitForTimeout(150);
              continue;
            }
          }

          // Default: roll
          await page.locator("#rollBtn").click();
          await page.waitForTimeout(300);

          // After roll: buy to acquire properties
          const buyNow = await page.locator("#buyBtn").isVisible().catch(() => false);
          if (buyNow) {
            await page.locator("#buyBtn").click();
          }
          await page.waitForTimeout(150);
        }

        // ---- Assertions ----

        // My-properties panel must have appeared at least once
        expect(myPropsPanelSeen, "#myPropsPanel never appeared — human may not have owned property in 150 turns").toBe(true);

        // Non-modal: chat was interactive while panel was open
        expect(nonModalConfirmed, "Chat input was not interactive while #myPropsPanel was open").toBe(true);

        // Mortgage was exercised
        expect(mortgageClicked, "No Hypothek button found in #myPropsPanel — may need more turns to own unbuilt/unmortgaged property").toBe(true);

        // Mortgage appeared in log
        expect(mortgageLogSeen, "Event log did not contain 'Hypothek' after mortgage action").toBe(true);

        // Money increased after mortgage (player received mortgage value)
        if (moneyBeforeMortgage > 0 && moneyAfterMortgage > 0) {
          expect(moneyAfterMortgage).toBeGreaterThan(moneyBeforeMortgage);
        }

        // No errors
        const serverErrors = await page.evaluate(
          () => ((window as Record<string, unknown>)["_serverErrors"] ?? []) as string[],
        );
        expect(consoleErrors, `Console errors: ${consoleErrors.join(", ")}`).toHaveLength(0);
        expect(pageErrors, `Page errors: ${pageErrors.join(", ")}`).toHaveLength(0);
        expect(serverErrors, `Server errors: ${serverErrors.join(", ")}`).toHaveLength(0);

        console.log(`myPropsPanel seen: ${myPropsPanelSeen}`);
        console.log(`non-modal confirmed: ${nonModalConfirmed}`);
        console.log(`mortgage clicked: ${mortgageClicked}`);
        console.log(`mortgage in log: ${mortgageLogSeen}`);
        console.log(`money before: ${moneyBeforeMortgage}, after: ${moneyAfterMortgage}`);
      },
    );
  });
  ```

- [ ] **Step 2: Verify the file is valid TypeScript (piggyback on client build)**

  ```bash
  npm run build -w @laspoly/client 2>&1 | tail -5
  ```
  Expected: exits 0.

- [ ] **Step 3: Commit**

  ```bash
  git add packages/client/tests/management.spec.ts
  git commit -m "test(e2e): add management panel Playwright spec (mortgage + non-modal)"
  ```

---

## Task 5: Run full test suite and Playwright

**Files:** (none changed — verification only)

- [ ] **Step 1: Run vitest**

  ```bash
  npm test 2>&1
  ```
  Expected: All tests pass. Count should be 131 + new predicate tests (≈ 20 new = ~151 total). No failures.

- [ ] **Step 2: Run Playwright**

  ```bash
  cd /Users/philip/Work/Other/laspoly && npx playwright test --project=chromium --reporter=line 2>&1
  ```
  Expected: All specs pass. Quote the actual output.

- [ ] **Step 3: Verify build is clean**

  ```bash
  npm run build -w @laspoly/client 2>&1 | tail -10
  ```
  Expected: exits 0.

- [ ] **Step 4: Final commit if any fixes were needed**

  ```bash
  git add -p
  git commit -m "fix: address review findings from Phase 2c"
  ```

---

## Self-Review Against Spec

**Coverage check:**

| Spec requirement | Task |
|---|---|
| Export `canBuild`, `canSellBuilding`, `canMortgage`, `canUnmortgage`, `canSellProperty`, `canTravelFrom`, `ownedPropsOf` | Task 1 |
| Unit tests for predicates | Task 1 |
| My-Properties panel (non-modal, during awaiting-roll) | Task 2 |
| BUILD house/hotel/factory buttons with cost shown | Task 2 step 9 |
| SELL_BUILDING button | Task 2 step 9 |
| MORTGAGE / UNMORTGAGE buttons | Task 2 step 9 |
| SELL_PROPERTY button | Task 2 step 9 |
| Travel chooser (if at station) | Task 2 steps 10, 13 |
| Trade propose panel (non-modal compose) | Task 2 step 11 |
| Incoming swap respond panel (non-modal, any turn) | Task 2 steps 12, 13 |
| Board3D building markers (house/hotel/factory visuals) | Task 3 |
| Playwright e2e: mortgage + log check + non-modal | Task 4 |
| `npm run build -w @laspoly/client` succeeds | Task 5 |
| `npm test` (131+) green | Task 5 |
| Playwright all pass | Task 5 |

**Placeholder scan:** No TBDs or TODOs found.

**Type consistency:** `StreetTile` is imported in Task 2 step 1. `canTravelFrom` used in Task 2 step 13 matches signature from Task 1. All `net.send` calls use `{ t: "command", command: {...} }` matching existing pattern in ui.ts.

**Potential issue — `board.rules` access in `refreshMyPropsPanel`:** The method calls `board.rules.mortgageUnmortgageMultiplier` which is on the board object returned by `getBoard()` — this is valid.

**Potential issue — `StreetTile` export:** Check that `StreetTile` is exported from `@laspoly/shared`. It is exported in `board.ts` and `index.ts` re-exports `* from "./board.js"` — confirmed OK.

**Potential issue — `canUnmortgage` uses `currentPlayer(state)` for the `playerId`:** Since the my-props panel only shows during the current player's turn, this matches. If a non-current player tried to unmortgage, the engine would throw anyway.
