import vegas from "../boards/vegas.json" with { type: "json" };
import oehringen from "../boards/oehringen.json" with { type: "json" };
import heilbronn from "../boards/heilbronn.json" with { type: "json" };

export type TileType =
  | "go"
  | "street"
  | "station"
  | "attraction"
  | "tax"
  | "action"
  | "freeparking"
  | "casino"
  | "gotojail";

export interface StreetTile {
  pos: number;
  type: "street";
  name: string;
  group: string;
  price: number;
  mortgage: number;
  houseCost: number;
  hotelCost: number;
  factoryCost: number;
  factoryRevenue: number;
  /** [baseRent, 1house, 2houses, 3houses, 4houses, hotel] */
  rent: [number, number, number, number, number, number];
}

export interface SimpleTile {
  pos: number;
  type: Exclude<TileType, "street">;
  name: string;
  group?: string;
  amount?: number;
}

export type Tile = StreetTile | SimpleTile;

export interface BoardRules {
  initialCapital: number;
  goLandMoney: number;
  goPassMoney: number;
  payToCasino: number;
  ransomCost: number;
  mortgageUnmortgageMultiplier: number;
  casinoInitialPool: number;
  jailTurns: number;
  station: { price: number; mortgage: number; rent: number[]; travel: number[] };
  attraction: { price: number; mortgage: number; factorOne: number; factorBoth: number };
}

export interface BoardDefinition {
  id: string;
  name: string;
  currency: string;
  rules: BoardRules;
  tiles: Tile[];
}

export const TRACK_SIZE = 40;
export const JAIL_POS = 40;

const REGISTRY: Record<string, BoardDefinition> = {
  vegas: vegas as unknown as BoardDefinition,
  oehringen: oehringen as unknown as BoardDefinition,
  heilbronn: heilbronn as unknown as BoardDefinition,
};

export function registerBoard(board: BoardDefinition): void {
  REGISTRY[board.id] = board;
}

export function getBoard(id: string): BoardDefinition {
  const board = REGISTRY[id];
  if (!board) throw new Error(`Unknown board: ${id}`);
  return board;
}

export function listBoards(): { id: string; name: string }[] {
  return Object.values(REGISTRY).map((b) => ({ id: b.id, name: b.name }));
}

export function isProperty(tile: Tile): boolean {
  return tile.type === "street" || tile.type === "station" || tile.type === "attraction";
}

/** Price to buy a property tile, regardless of property kind. */
export function tilePrice(board: BoardDefinition, tile: Tile): number {
  if (tile.type === "street") return tile.price;
  if (tile.type === "station") return board.rules.station.price;
  if (tile.type === "attraction") return board.rules.attraction.price;
  return 0;
}

export function mortgageValue(board: BoardDefinition, tile: Tile): number {
  if (tile.type === "street") return tile.mortgage;
  if (tile.type === "station") return board.rules.station.mortgage;
  if (tile.type === "attraction") return board.rules.attraction.mortgage;
  return 0;
}

/** Board positions belonging to a colour/station/attraction group. */
export function groupMembers(board: BoardDefinition, group: string): number[] {
  return board.tiles.filter((t) => t.group === group).map((t) => t.pos);
}

export function wrapPosition(current: number, steps: number): number {
  return ((current + steps) % TRACK_SIZE + TRACK_SIZE) % TRACK_SIZE;
}
