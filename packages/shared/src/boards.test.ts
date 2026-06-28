import { describe, it, expect } from "vitest";
import { listBoards, getBoard } from "./board.js";

// Reference positions from vegas.json
const FIXED_POSITIONS: { pos: number; type: string }[] = [
  { pos: 0, type: "go" },
  { pos: 2, type: "tax" },
  { pos: 5, type: "station" },
  { pos: 7, type: "action" },
  { pos: 10, type: "freeparking" },
  { pos: 12, type: "attraction" },
  { pos: 15, type: "station" },
  { pos: 17, type: "action" },
  { pos: 20, type: "casino" },
  { pos: 22, type: "action" },
  { pos: 25, type: "station" },
  { pos: 27, type: "attraction" },
  { pos: 30, type: "gotojail" },
  { pos: 32, type: "action" },
  { pos: 35, type: "station" },
  { pos: 36, type: "tax" },
];

const VEGAS_STREETS = (() => {
  const { tiles } = getBoard("vegas");
  return tiles.filter((t) => t.type === "street") as import("./board.js").StreetTile[];
})();

describe("board registry", () => {
  it("lists at least three boards including vegas, oehringen, heilbronn", () => {
    const ids = listBoards().map((b) => b.id);
    expect(ids).toContain("vegas");
    expect(ids).toContain("oehringen");
    expect(ids).toContain("heilbronn");
  });
});

describe.each(listBoards().map((b) => [b.id, b.name]))("board %s (%s)", (id) => {
  const board = getBoard(id);

  it("has exactly 40 tiles with positions 0..39 in order", () => {
    expect(board.tiles).toHaveLength(40);
    board.tiles.forEach((tile, idx) => {
      expect(tile.pos).toBe(idx);
    });
  });

  it("has correct special tile types at fixed positions", () => {
    for (const { pos, type } of FIXED_POSITIONS) {
      expect(board.tiles[pos]?.type, `pos ${pos}`).toBe(type);
    }
  });

  it("has identical numeric values to vegas tile-for-tile on street tiles", () => {
    for (const vegasTile of VEGAS_STREETS) {
      const tile = board.tiles[vegasTile.pos];
      expect(tile?.type, `pos ${vegasTile.pos} type`).toBe("street");
      if (tile?.type !== "street") continue;
      expect(tile.price, `pos ${vegasTile.pos} price`).toBe(vegasTile.price);
      expect(tile.mortgage, `pos ${vegasTile.pos} mortgage`).toBe(vegasTile.mortgage);
      expect(tile.houseCost, `pos ${vegasTile.pos} houseCost`).toBe(vegasTile.houseCost);
      expect(tile.hotelCost, `pos ${vegasTile.pos} hotelCost`).toBe(vegasTile.hotelCost);
      expect(tile.factoryCost, `pos ${vegasTile.pos} factoryCost`).toBe(vegasTile.factoryCost);
      expect(tile.factoryRevenue, `pos ${vegasTile.pos} factoryRevenue`).toBe(vegasTile.factoryRevenue);
      expect(tile.rent, `pos ${vegasTile.pos} rent`).toEqual(vegasTile.rent);
      expect(tile.group, `pos ${vegasTile.pos} group`).toBe(vegasTile.group);
    }
  });

  it("has the same street groups as vegas", () => {
    const vegasGroups = new Map<number, string>();
    for (const t of getBoard("vegas").tiles) {
      if (t.type === "street") vegasGroups.set(t.pos, (t as import("./board.js").StreetTile).group);
    }
    for (const t of board.tiles) {
      if (t.type === "street") {
        expect((t as import("./board.js").StreetTile).group, `pos ${t.pos}`).toBe(vegasGroups.get(t.pos));
      }
    }
  });

  it("has a non-empty name for every tile", () => {
    for (const tile of board.tiles) {
      expect(tile.name?.trim().length, `pos ${tile.pos}`).toBeGreaterThan(0);
    }
  });
});
