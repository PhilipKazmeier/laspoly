import { getBoard, groupMembers } from "./board.js";
import { applyCommand, currentPlayer, legalCommands } from "./engine.js";
import type { Command, GameState } from "./types.js";

/**
 * Simple deterministic bot policy. Always returns a command from legalCommands(state).
 */
export function botDecide(state: GameState): Command {
  const legal = legalCommands(state);
  const board = getBoard(state.boardId);
  const p = currentPlayer(state);

  if (state.phase === "awaiting-buy") {
    const pos = state.pendingPurchase!;
    const tile = board.tiles[pos]!;
    let price = 0;
    if (tile.type === "street") price = tile.price;
    else if (tile.type === "station") price = board.rules.station.price;
    else if (tile.type === "attraction") price = board.rules.attraction.price;

    // Buy if we can afford it (keep at least 0 cash after purchase)
    if (legal.includes("BUY_PROPERTY") && p.money >= price) {
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

  // Try building: find first legal BUILD opportunity
  if (legal.includes("BUILD")) {
    for (const [posStr, ownerId] of Object.entries(state.ownership)) {
      if (ownerId !== p.id) continue;
      const pos = Number(posStr);
      const tile = board.tiles[pos];
      if (!tile || tile.type !== "street") continue;
      if (state.mortgaged[pos]) continue;
      // Must own entire group to build
      if (!groupMembers(board, tile.group).every((m) => state.ownership[m] === p.id)) continue;
      const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
      if (b.hotel || b.factory) continue;

      // Try hotel first if all in group have 4 houses
      if (b.houses === 4) {
        const members = groupMembers(board, tile.group);
        const allHave4 = members.every((m) => {
          const bm = state.buildings[m] ?? { houses: 0, hotel: false, factory: false };
          return m === pos || bm.hotel || bm.houses === 4;
        });
        if (allHave4 && p.money >= tile.hotelCost * 2) {
          return { type: "BUILD", pos, building: "hotel" };
        }
      }

      // Try house: only if we have enough money and even-build allows
      if (b.houses < 4) {
        const members = groupMembers(board, tile.group);
        const minHouses = Math.min(
          ...members.map((m) => {
            const bm = state.buildings[m] ?? { houses: 0, hotel: false, factory: false };
            if (bm.factory) return -1;
            if (bm.hotel) return 5;
            return bm.houses;
          }),
        );
        if (b.houses <= minHouses && p.money >= tile.houseCost * 2) {
          return { type: "BUILD", pos, building: "house" };
        }
      }
    }
  }

  return { type: "ROLL_DICE" };
}
