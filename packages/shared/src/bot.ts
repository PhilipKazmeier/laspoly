import { getBoard, groupMembers, mortgageValue } from "./board.js";
import { buildingChargeCost, currentPlayer, legalCommands } from "./engine.js";
import type { Command, GameState } from "./types.js";

/**
 * Simple deterministic bot policy. Always returns a command from legalCommands(state).
 *
 * 2026-06: Added survive-bankruptcy logic. When cash is critically low the bot
 * pre-emptively mortgages (cheapest asset first) or sells a building before
 * rolling, so it is less likely to be wiped out by a large rent hit.
 * BUILD guard was tightened to require DANGER_THRESHOLD extra cash after
 * spending, preventing a build/sell oscillation. BUILD now also checks that
 * no group member is mortgaged (which blocks construction in the engine).
 */

/** Minimum cash the bot tries to keep on hand before rolling (normal difficulty). */
const DANGER_THRESHOLD = 200;

/** Per-difficulty thresholds and buy buffers. */
const DIFFICULTY_CONFIG = {
  easy:   { dangerThreshold: 400, buyBuffer: 400 }, // passive, keeps more cash
  normal: { dangerThreshold: 200, buyBuffer: 200 },
  hard:   { dangerThreshold: 100, buyBuffer: 50  }, // aggressive, low cash reserve
} as const;

/**
 * Returns whether a house on `pos` can be sold (even-sell rule):
 * no other group member may have >= this count of houses.
 */
function canSellHouseAt(state: GameState, board: ReturnType<typeof getBoard>, pos: number): boolean {
  const tile = board.tiles[pos];
  if (!tile || tile.type !== "street") return false;
  const b = state.buildings[pos];
  if (!b || b.houses <= 0) return false;
  const members = groupMembers(board, tile.group);
  for (const m of members) {
    if (m === pos) continue;
    const bm = state.buildings[m] ?? { houses: 0, hotel: false, factory: false };
    const otherCount = bm.hotel ? 5 : bm.houses;
    if (otherCount > b.houses) return false; // mirror engine canSellHouse (`>`, not `>=`)
  }
  return true;
}

/**
 * Returns whether a house can be built at `pos` (mirrors engine canConstructHouse logic).
 * Used to pre-validate before issuing BUILD so we never throw.
 */
function canBuildHouseAt(state: GameState, board: ReturnType<typeof getBoard>, pos: number): boolean {
  const tile = board.tiles[pos];
  if (!tile || tile.type !== "street") return false;
  if (state.mortgaged[pos]) return false;
  const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
  if (b.hotel || b.factory || b.houses >= 4) return false;
  const members = groupMembers(board, tile.group);
  for (const m of members) {
    if (state.mortgaged[m]) return false; // any mortgaged member blocks
    const bm = state.buildings[m] ?? { houses: 0, hotel: false, factory: false };
    if (bm.factory) return false;
    if (m !== pos) {
      const otherCount = bm.hotel ? 5 : bm.houses;
      if (otherCount < b.houses) return false; // even-build: another member has fewer
    }
  }
  return true;
}

/**
 * Returns whether a hotel can be built at `pos` (mirrors engine canConstructHotel logic).
 */
function canBuildHotelAt(state: GameState, board: ReturnType<typeof getBoard>, pos: number): boolean {
  const tile = board.tiles[pos];
  if (!tile || tile.type !== "street") return false;
  const b = state.buildings[pos];
  if (!b || b.hotel || b.factory || b.houses !== 4) return false;
  if (groupMembers(board, tile.group).length < 2) return false; // mirror engine: no hotel on single-street groups
  const members = groupMembers(board, tile.group);
  for (const m of members) {
    if (m === pos) continue;
    const bm = state.buildings[m] ?? { houses: 0, hotel: false, factory: false };
    if (!bm.hotel && bm.houses !== 4) return false;
  }
  return true;
}

export function botDecide(state: GameState): Command {
  const legal = legalCommands(state);
  const board = getBoard(state.boardId);
  const p = currentPlayer(state);
  const diff = state.botDifficulty ?? "normal";
  const cfg = DIFFICULTY_CONFIG[diff];
  const threshold = cfg.dangerThreshold;
  const buyBuffer = cfg.buyBuffer;

  // In turn-end, try to build if possible, then confirm END_TURN.
  if (state.phase === "turn-end") {
    // Optionally build (reuse the BUILD logic below by falling through? No — just check here)
    if (legal.includes("BUILD") && !state.builtThisTurn) {
      for (const [posStr, ownerId] of Object.entries(state.ownership)) {
        if (ownerId !== p.id) continue;
        const pos = Number(posStr);
        const tile = board.tiles[pos];
        if (!tile || tile.type !== "street") continue;
        if (!groupMembers(board, tile.group).every((m) => state.ownership[m] === p.id)) continue;
        const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
        if (b.hotel || b.factory) continue;
        if (b.houses === 4 && canBuildHotelAt(state, board, pos)) {
          const cost = buildingChargeCost(tile, "hotel", state);
          if (p.money - cost >= threshold) {
            return { type: "BUILD", pos, building: "hotel" };
          }
        }
        if (b.houses < 4 && canBuildHouseAt(state, board, pos)) {
          const cost = buildingChargeCost(tile, "house", state);
          if (p.money - cost >= threshold) {
            return { type: "BUILD", pos, building: "house" };
          }
        }
      }
    }
    return { type: "END_TURN" };
  }

  // At the casino, just roll (there's no decision to make).
  if (state.phase === "awaiting-casino") {
    return { type: "ROLL_CASINO" };
  }

  if (state.phase === "awaiting-buy") {
    const pos = state.pendingPurchase!;
    const tile = board.tiles[pos]!;
    let price = 0;
    if (tile.type === "street") price = tile.price;
    else if (tile.type === "station") price = board.rules.station.price;
    else if (tile.type === "attraction") price = board.rules.attraction.price;

    // Buy only if we can afford it while keeping a safety buffer
    if (legal.includes("BUY_PROPERTY") && p.money >= price + buyBuffer) {
      return { type: "BUY_PROPERTY" };
    }
    return { type: "DECLINE_PROPERTY" };
  }

  // awaiting-roll
  if (p.inJail) {
    if (legal.includes("PAY_RANSOM") && p.money > 300) {
      return { type: "PAY_RANSOM" };
    }
    return { type: "ROLL_DICE" };
  }

  // --- Survive-bankruptcy: raise cash before rolling if critically low ---
  if (p.money < threshold) {
    // 1. Sell a building (hotel or factory first, then house if even-sell allows)
    if (legal.includes("SELL_BUILDING")) {
      for (const [posStr, ownerId] of Object.entries(state.ownership)) {
        if (ownerId !== p.id) continue;
        const pos = Number(posStr);
        const tile = board.tiles[pos];
        if (!tile || tile.type !== "street") continue;
        const b = state.buildings[pos];
        if (!b) continue;
        if (b.hotel || b.factory) return { type: "SELL_BUILDING", pos };
        if (b.houses > 0 && canSellHouseAt(state, board, pos)) {
          return { type: "SELL_BUILDING", pos };
        }
      }
    }

    // 2. Mortgage cheapest unencumbered property
    if (legal.includes("MORTGAGE")) {
      const mortgageable: { pos: number; mv: number }[] = [];
      for (const [posStr, ownerId] of Object.entries(state.ownership)) {
        if (ownerId !== p.id) continue;
        const pos = Number(posStr);
        if (state.mortgaged[pos]) continue;
        const tile = board.tiles[pos];
        if (!tile) continue;
        const b = state.buildings[pos];
        if (b && (b.houses > 0 || b.hotel || b.factory)) continue;
        mortgageable.push({ pos, mv: mortgageValue(board, tile) });
      }
      mortgageable.sort((a, b) => a.mv - b.mv);
      if (mortgageable.length > 0) {
        return { type: "MORTGAGE", pos: mortgageable[0]!.pos };
      }
    }
  }

  // --- BUILD: only build when we'll still have >= threshold after spending ---
  if (legal.includes("BUILD")) {
    for (const [posStr, ownerId] of Object.entries(state.ownership)) {
      if (ownerId !== p.id) continue;
      const pos = Number(posStr);
      const tile = board.tiles[pos];
      if (!tile || tile.type !== "street") continue;
      if (!groupMembers(board, tile.group).every((m) => state.ownership[m] === p.id)) continue;
      const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
      if (b.hotel || b.factory) continue;

      // Hotel upgrade: validate with engine-mirrored check
      if (b.houses === 4 && canBuildHotelAt(state, board, pos)) {
        const cost = buildingChargeCost(tile, "hotel", state);
        if (p.money - cost >= threshold) {
          return { type: "BUILD", pos, building: "hotel" };
        }
      }

      // House: validate with engine-mirrored check
      if (b.houses < 4 && canBuildHouseAt(state, board, pos)) {
        const cost = buildingChargeCost(tile, "house", state);
        if (p.money - cost >= threshold) {
          return { type: "BUILD", pos, building: "house" };
        }
      }
    }
  }

  return { type: "ROLL_DICE" };
}
