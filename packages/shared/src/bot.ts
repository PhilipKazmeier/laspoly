import { getBoard } from "./board.js";
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

  return { type: "ROLL_DICE" };
}
