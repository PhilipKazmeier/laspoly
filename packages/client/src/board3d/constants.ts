// ---------------------------------------------------------------------------
// board3d/constants.ts — pure data & geometry helpers for the 3D board.
// No Babylon scene access here: everything is either a constant, a palette,
// or a pure coordinate/color function. Shared by all board3d modules.
// ---------------------------------------------------------------------------
import { Color3, Color4 } from "@babylonjs/core";
import { JAIL_POS } from "@laspoly/shared";

// ---------------------------------------------------------------------------
// Per-theme 3D palette. "neon" = Neon-Vegas glass; "classic" = the original
// warm wood + green board. Read once at construction; switching reloads.
// ---------------------------------------------------------------------------
export interface ThemePalette {
  clear: Color4;
  ambientDiffuse: Color3 | null; // null → leave the light's default white
  keyIntensity: number;          // point-light strength (classic warms up the "room lamp")
  keyDiffuse: Color3 | null;     // null → default white key light
  tableWood: boolean;            // true → procedural wood texture; false → flat colour
  tableDiffuse: Color3;          // used when tableWood is false
  tableSpecular: Color3;
  boardBase: Color3;
  boardEmissive: Color3;
  feltTint: Color3 | null;       // null → no diffuseColor (full-brightness texture)
  tile: Color3;
  /** Canvas stroke colour for the rounded border drawn on each tile face. */
  tileBorder: string;
  cupDiffuse: Color3;
  cupEmissive: Color3;
  cupSpecular: Color3;
}

export const THEMES: Record<"neon" | "classic", ThemePalette> = {
  neon: {
    clear: new Color4(0.039, 0.035, 0.075, 1),
    ambientDiffuse: new Color3(0.85, 0.83, 0.95),
    keyIntensity: 0.3,
    keyDiffuse: null,
    tableWood: false,
    tableDiffuse: new Color3(0.1, 0.085, 0.15),
    tableSpecular: new Color3(0.05, 0.04, 0.09),
    boardBase: new Color3(0.09, 0.07, 0.14),
    boardEmissive: new Color3(0.12, 0.09, 0.02),
    feltTint: new Color3(0.42, 0.4, 0.55),
    tile: new Color3(0.95, 0.95, 0.97),
    tileBorder: "#5b5680",
    cupDiffuse: new Color3(0.14, 0.11, 0.2),
    cupEmissive: new Color3(0.22, 0.16, 0.03),
    cupSpecular: new Color3(0.3, 0.24, 0.1),
  },
  classic: {
    // Warm dark room instead of the old blue-grey void — the table now reads
    // as sitting in a lamp-lit den.
    clear: new Color4(0.16, 0.12, 0.09, 1),
    ambientDiffuse: null,
    keyIntensity: 0.4,
    keyDiffuse: new Color3(1, 0.9, 0.75),
    tableWood: true,
    tableDiffuse: new Color3(0.42, 0.24, 0.07),
    tableSpecular: new Color3(0.18, 0.12, 0.06),
    boardBase: new Color3(0.32, 0.54, 0.28),
    boardEmissive: new Color3(0, 0, 0),
    feltTint: null,
    tile: new Color3(0.97, 0.95, 0.88),
    tileBorder: "#c9c2a8",
    cupDiffuse: new Color3(0.22, 0.13, 0.05),
    cupEmissive: new Color3(0.08, 0.04, 0.01),
    cupSpecular: new Color3(0.35, 0.22, 0.12),
  },
};

// ---------------------------------------------------------------------------
// Colour palette (matches FieldConfiguration.loadGroupColors from Java)
// ---------------------------------------------------------------------------
export const GROUP_COLORS: Record<string, string> = {
  brown: "#8B4513",
  deeppink: "#FF1493",
  turquoise: "#40E0D0",
  violet: "#EE82EE",
  mistyrose: "#FFE4E1",
  orange: "#FFA500",
  lightgreen: "#90EE90",
  red: "#FF0000",
  yellow: "#FFFF00",
  darkviolet: "#9400D3",
  darkgreen: "#006400",
  royalblue: "#4169E1",
  station: "#888888",
  attraction: "#FFD700",
};

export function hexToColor3(hex: string): Color3 {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return new Color3(r, g, b);
}

// Player colours arrive as CSS colour NAMES (e.g. "red", "blue") from the
// server (room.ts COLORS), not hex. Map the known names to vivid hex so the
// 3D tokens/rings render in the right colour instead of black.
export const PLAYER_COLOR_HEX: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  purple: "#a855f7",
  orange: "#f97316",
};

/** Resolve a player colour (CSS name or hex) to a Color3. */
export function playerColor3(c: string): Color3 {
  if (c.startsWith("#")) return hexToColor3(c);
  const hex = PLAYER_COLOR_HEX[c.toLowerCase()];
  if (hex) return hexToColor3(hex);
  return new Color3(0.6, 0.6, 0.6);
}

/**
 * Brighten a colour so dark player colours (e.g. darkgreen #006400) still read
 * clearly as tokens. Scales the colour up so its brightest channel reaches
 * `target`, preserving hue.
 */
export function brighten(c: Color3, target = 0.95): Color3 {
  const max = Math.max(c.r, c.g, c.b);
  if (max <= 0) return new Color3(0.6, 0.6, 0.6);
  const f = target / max;
  return new Color3(Math.min(1, c.r * f), Math.min(1, c.g * f), Math.min(1, c.b * f));
}

// ---------------------------------------------------------------------------
// Coordinate helpers (mirrored from Board.java, scaled 20/1200 ≈ 0.01667)
// ---------------------------------------------------------------------------
export const SCALE = 20 / 1200; // 1 Java unit → 0.01667 Babylon units

// Station tile positions (mirror of engine.ts STATION_POSITIONS) used to detect
// station→station TRAVEL and play the subway dive/emerge animation.
export const STATION_POSITIONS = new Set([5, 15, 25, 35]);

// Regular tile: 100 J wide × 150 J deep
export const TILE_W = 100 * SCALE; // ≈ 1.667
export const TILE_D = 150 * SCALE; // ≈ 2.5
// Corner tile: 150 × 150
export const CORNER = 150 * SCALE; // ≈ 2.5

// ---------------------------------------------------------------------------
// Animation timing / sizing constants (formerly magic numbers inline)
// ---------------------------------------------------------------------------
export const TOKEN_Y = 0.35;          // token resting height on a tile
export const LABEL_Y = 1.1;           // billboard name-label height above a tile
export const RING_Y = 0.12;           // player halo ring height
export const HOP_DURATION_MS = 120;   // token walk: ms per tile hop
export const HOP_HEIGHT = 0.5;        // token walk: hop arc peak
export const CUP_LIFT = 2.0;          // dice cup rise distance (Y only)
export const SHAKE_CYCLES = 5;        // dice cup shake oscillations
export const SHAKE_AMP = 0.28;        // dice cup shake amplitude
export const DIE_SIZE = 0.48;         // pip die edge length
export const DICE_SAFETY_MS = 4000;   // playDiceAnimationAsync safety cap

/** Cosmetic dice skins (index = RoomPlayer.diceSkin). Canvas colours + material params. */
export interface DiceSkin {
  name: string;
  face: string;    // canvas face fill
  pip: string;     // pip colour
  border: string;  // face border stroke
  emissive: [number, number, number];
  specular: [number, number, number];
}

export const DICE_SKINS: DiceSkin[] = [
  { name: "classic",  face: "#f4f4ee", pip: "#161616", border: "#ccccc4", emissive: [0.15, 0.15, 0.15], specular: [0.12, 0.12, 0.12] },
  { name: "neon",     face: "#1a1030", pip: "#22d3ee", border: "#3b2a63", emissive: [0.3, 0.28, 0.42],  specular: [0.2, 0.2, 0.3] },
  { name: "gold",     face: "#d4af37", pip: "#2a1f04", border: "#a3842a", emissive: [0.28, 0.22, 0.06], specular: [0.6, 0.5, 0.2] },
  { name: "obsidian", face: "#17171c", pip: "#f2f2f2", border: "#33333c", emissive: [0.08, 0.08, 0.1],  specular: [0.45, 0.45, 0.5] },
  { name: "ruby",     face: "#7f1d1d", pip: "#ffe4e6", border: "#5c1414", emissive: [0.2, 0.06, 0.06],  specular: [0.4, 0.2, 0.2] },
];

/** World XZ for the centre of tile at board position [0..40]. */
export function tileXZ(pos: number): [number, number] {
  if (pos === JAIL_POS) return [0, 0]; // jailed tokens → cage in felt centre

  // Z is negated vs. the original Java layout so that increasing position
  // (0→1→…→39) progresses CLOCKWISE as seen from the default camera (which
  // sits at z≈-30, looking toward the origin).
  //
  // Corners:  GO=bottom-left, FreePark=bottom-right, Casino=top-right, GoJail=top-left
  // "Bottom" of screen = near camera = large +z; "Top" = far = large -z.
  if (pos === 0) return [-525 * SCALE,  525 * SCALE]; // GO        bottom-left
  if (pos === 10) return [ 525 * SCALE,  525 * SCALE]; // FreePark  bottom-right
  if (pos === 20) return [ 525 * SCALE, -525 * SCALE]; // Casino    top-right
  if (pos === 30) return [-525 * SCALE, -525 * SCALE]; // GoJail    top-left

  // Bottom edge (pos 1–9):  z=+525, x varies left→right (clockwise)
  if (pos < 10) {
    const x = (-600 + pos * 100 - 50 + 150) * SCALE;
    return [x, 525 * SCALE];
  }
  // Right edge  (pos 11–19): x=+525, z varies near→far (z decreasing, clockwise)
  if (pos < 20) {
    const z = (600 - (pos - 10) * 100 + 50 - 150) * SCALE;
    return [525 * SCALE, z];
  }
  // Top edge    (pos 21–29): z=−525, x varies right→left (clockwise)
  if (pos < 30) {
    const x = (600 - (pos - 20) * 100 + 50 - 150) * SCALE;
    return [x, -525 * SCALE];
  }
  // Left edge   (pos 31–39): x=−525, z varies far→near (z increasing, clockwise)
  const z = (-600 + (pos - 30) * 100 - 50 + 150) * SCALE;
  return [-525 * SCALE, z];
}

/**
 * Rotation angle (degrees around Y) for a tile at this position.
 * Each tile is oriented so that the text label reads from OUTSIDE the board edge,
 * and the colour bar sits on the INNER edge (toward centre).
 * After the z-flip (clockwise movement), bottom/top edges swap their angles.
 */
export function getFieldAngle(pos: number): number {
  if (pos <= 10) return 180; // bottom edge → text "up" faces +z (outward, toward camera)
  if (pos <= 20) return 270; // right edge  → unchanged
  if (pos <= 30) return 0;   // top edge    → text "up" faces -z (outward, away from camera)
  return 90;                  // left edge   → unchanged
}

/**
 * For a tile at `pos`, returns the XZ unit vector pointing FROM tile centre
 * toward the OUTER edge of the board.  Used for colour-bar placement and
 * building/ownership-marker offsets.
 * After the z-flip (clockwise movement), bottom and top edges swap signs.
 */
export function outerDirection(pos: number): [number, number] {
  if (pos <= 10) return [0, 1];  // bottom edge → outer is +z (toward camera/near)
  if (pos <= 20) return [1, 0];  // right edge  → outer is +x (unchanged)
  if (pos <= 30) return [0, -1]; // top edge    → outer is -z (away from camera/far)
  return [-1, 0];                 // left edge   → outer is -x (unchanged)
}

/** Short label for the four corner tiles. */
export function cornerLabel(pos: number, type: string): string {
  if (type === "go") return "GO";
  if (type === "freeparking") return "P";
  if (type === "casino") return "★";
  if (type === "gotojail") return "🚔";
  if (pos === 0) return "GO";
  if (pos === 10) return "P";
  if (pos === 20) return "★";
  if (pos === 30) return "→JAIL";
  return "?";
}
