// ---------------------------------------------------------------------------
// board3d/tiles.ts — static board geometry: tiles, colour bars, labels, the
// jail cage and the procedural wood table texture. Free functions taking the
// scene + palette so they carry no state of their own (Board3D owns the
// "which board is drawn" guard).
// ---------------------------------------------------------------------------
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Texture,
  DynamicTexture,
  Scene,
} from "@babylonjs/core";
import { tilePrice } from "@laspoly/shared";
import type { BoardDefinition, Tile } from "@laspoly/shared";
import {
  ThemePalette,
  GROUP_COLORS,
  hexToColor3,
  SCALE,
  TILE_W,
  TILE_D,
  CORNER,
  tileXZ,
  getFieldAngle,
  outerDirection,
  cornerLabel,
} from "./constants.js";

// ---------------------------------------------------------------------------
// Wood texture (procedural planks/grain for the classic-theme table)
// ---------------------------------------------------------------------------
export function makeWoodTexture(scene: Scene): DynamicTexture {
  const W = 512, H = 512;
  const tex = new DynamicTexture("woodTex", { width: W, height: H }, scene, true);
  const ctx = tex.getContext() as CanvasRenderingContext2D;

  // Base warm brown
  ctx.fillStyle = "#6b3d12";
  ctx.fillRect(0, 0, W, H);

  // Draw horizontal wood planks (lighter grain lines)
  const PLANK_H = 64; // px per plank
  const NUM_PLANKS = Math.ceil(H / PLANK_H);
  for (let p = 0; p < NUM_PLANKS; p++) {
    const py = p * PLANK_H;
    // Slight shade variation per plank
    const shade = 0.85 + Math.sin(p * 1.7) * 0.1;
    const r = Math.round(107 * shade);
    const g = Math.round(61 * shade);
    const b = Math.round(18 * shade);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, py, W, PLANK_H - 2);

    // Grain lines within each plank
    for (let gl = 0; gl < 8; gl++) {
      const gy = py + (gl / 8) * (PLANK_H - 2);
      const brightness = 0.9 + Math.sin(gl * 2.1 + p * 0.9) * 0.08;
      const gr = Math.round(130 * brightness);
      const gg = Math.round(74 * brightness);
      const gb = Math.round(22 * brightness);
      ctx.strokeStyle = `rgb(${gr},${gg},${gb})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Slightly wavy grain line
      ctx.moveTo(0, gy);
      for (let x = 0; x <= W; x += 16) {
        const waver = Math.sin((x / W) * Math.PI * 6 + p * 1.3 + gl * 0.8) * 2;
        ctx.lineTo(x, gy + waver);
      }
      ctx.stroke();
    }

    // Plank gap (dark line between planks)
    ctx.fillStyle = "#3a1e07";
    ctx.fillRect(0, py + PLANK_H - 2, W, 2);
  }

  // Knot holes (circular dark spots)
  const knots = [[W * 0.2, H * 0.3], [W * 0.7, H * 0.15], [W * 0.45, H * 0.65], [W * 0.85, H * 0.55]];
  for (const [kx, ky] of knots) {
    const grad = ctx.createRadialGradient(kx!, ky!, 2, kx!, ky!, 14);
    grad.addColorStop(0, "rgba(30,12,3,0.85)");
    grad.addColorStop(0.6, "rgba(60,28,8,0.5)");
    grad.addColorStop(1, "rgba(107,61,18,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(kx!, ky!, 14, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.update();
  // Tile the texture across the large table surface (scale factor on UV)
  tex.uScale = 5;
  tex.vScale = 5;
  return tex;
}

// ---------------------------------------------------------------------------
// Board geometry: base, felt, deck, jail cage, 40 tiles with bars + labels
// ---------------------------------------------------------------------------
export function drawBoard(scene: Scene, palette: ThemePalette, board: BoardDefinition): void {
  // ---- Green board base ---------------------------------------------------
  // Total board: 1200 × 1200 Java units → 20 × 20 Babylon units
  const boardBase = MeshBuilder.CreateBox(
    "boardBase",
    { width: 20, height: 0.08, depth: 20 },
    scene
  );
  boardBase.position.y = -0.04;
  const boardMat = new StandardMaterial("boardMat", scene);
  // Neon: dark glass board frame with a faint gold self-lit edge; classic:
  // the original Monopoly green (palette carries both).
  boardMat.diffuseColor = palette.boardBase;
  boardMat.emissiveColor = palette.boardEmissive;
  boardMat.specularColor = new Color3(0, 0, 0); // flat, no glare from above
  boardBase.material = boardMat;

  // ---- Felt centre --------------------------------------------------------
  const FELT_SIZE = 11.5;
  const felt = MeshBuilder.CreateBox(
    "felt",
    { width: FELT_SIZE, height: 0.02, depth: FELT_SIZE },
    scene
  );
  felt.position.y = 0.01;
  const feltMat = new StandardMaterial("feltMat", scene);
  feltMat.diffuseTexture = new Texture("/assets/tex_felt.png", scene);
  // Neon tints the felt darker/cooler to match the dark world; classic leaves
  // the texture at full brightness (feltTint null).
  if (palette.feltTint) feltMat.diffuseColor = palette.feltTint;
  feltMat.specularColor = new Color3(0, 0, 0); // flat, no glare from above
  felt.material = feltMat;

  // ---- Card deck ----------------------------------------------------------
  const DECK_SCALE = 240 * SCALE; // 240 Java → 4.0 Babylon (from Board.java)
  const deck = MeshBuilder.CreateBox(
    "cardDeck",
    { width: 1.6, height: 0.25, depth: 2.1 },
    scene
  );
  deck.position.set(DECK_SCALE, 0.14, DECK_SCALE);
  deck.rotation.y = (45 * Math.PI) / 180;
  const deckMat = new StandardMaterial("deckMat", scene);
  deckMat.diffuseTexture = new Texture("/assets/cardpattern.png", scene);
  deck.material = deckMat;

  // ---- Jail cage ----------------------------------------------------------
  buildJailCage(scene);

  // ---- Tiles --------------------------------------------------------------
  for (const tile of board.tiles) {
    const [cx, cz] = tileXZ(tile.pos);
    const isCorner = tile.pos === 0 || tile.pos === 10 || tile.pos === 20 || tile.pos === 30;

    // For left/right-edge tiles the "depth" axis runs along X in world space
    // (because the tile is rotated 90°).  We use a consistently-oriented box
    // (W along X, D along Z) and then rotate it.
    const angle = getFieldAngle(tile.pos);
    const tileW = isCorner ? CORNER : TILE_W;
    const tileD = isCorner ? CORNER : TILE_D;

    // Tile base box (cream/white)
    const tileMesh = MeshBuilder.CreateBox(
      `tile_${tile.pos}`,
      { width: tileW, height: 0.09, depth: tileD },
      scene
    );
    tileMesh.position.set(cx, 0.045, cz);
    tileMesh.rotation.y = (angle * Math.PI) / 180;
    tileMesh.isPickable = true; // tile-click hook (setTileClickHandler)

    const tileMat = new StandardMaterial(`tileMat_${tile.pos}`, scene);
    tileMat.diffuseColor = palette.tile; // neon: cool white · classic: warm cream
    tileMesh.material = tileMat;

    // ---- Colour bar (inner-edge, facing board centre) --------------------
    const group = (tile as { group?: string }).group;
    if (group && GROUP_COLORS[group]) {
      const colorHex = GROUP_COLORS[group];
      if (colorHex) {
        addColorBar(scene, cx, cz, tile.pos, isCorner, tileD, angle, colorHex);
      }
    }

    // ---- Face (DynamicTexture on a flat plane: border, icon, name, price) --
    drawTileFace(scene, palette, board, tile, cx, cz, isCorner, tileD, angle);
  }
}

/** Emoji icon per non-street tile type (emoji-in-canvas is proven by the 🚔 corner). */
const TYPE_ICONS: Record<string, string> = {
  station: "🚉",
  attraction: "🎡",
  tax: "💰",
  action: "❓",
};

/** Adds the group-coloured bar on the INNER edge (toward board centre) of a property tile. */
function addColorBar(
  scene: Scene,
  cx: number,
  cz: number,
  pos: number,
  isCorner: boolean,
  tileD: number,
  angleDeg: number,
  colorHex: string
) {
  const BAR_DEPTH = 0.4; // thickness of the bar (toward centre)

  // Bar sits at the outer edge.  The tile is rotated `angleDeg` around Y, so
  // for left/right-edge tiles the local Z axis of the tile aligns with world X.
  // We compute everything in local space then rotate.
  // For bottom/top (angle=0,180): outer edge = tile's –z or +z, bar spans tileW.
  // For left/right (angle=90,270): outer edge = tile's –z (rotated), bar spans tileW.
  // Since we always rotate the tile, the bar geometry is always the same in local space.
  const BAR_W = isCorner ? CORNER : TILE_W;
  const bar = MeshBuilder.CreateBox(
    `bar_${pos}`,
    { width: BAR_W, height: 0.07, depth: BAR_DEPTH },
    scene
  );

  // The bar sits at the tile's local +z edge (toward the board centre).
  // The tile's local +z axis maps to world (sin(rad), cos(rad)); since every
  // edge's tile is rotated so its +z points inward, +localOffsetZ lands the
  // bar on the inner edge for all four sides.
  const localOffsetZ = (tileD / 2 - BAR_DEPTH / 2); // inner edge (toward centre)
  const rad = (angleDeg * Math.PI) / 180;
  const worldOffsetX = localOffsetZ * Math.sin(rad);
  const worldOffsetZ = localOffsetZ * Math.cos(rad);

  bar.position.set(cx + worldOffsetX, 0.11, cz + worldOffsetZ);
  bar.rotation.y = rad;

  const barMat = new StandardMaterial(`barMat_${pos}`, scene);
  barMat.diffuseColor = hexToColor3(colorHex);
  barMat.specularColor = new Color3(0, 0, 0);
  bar.material = barMat;
}

/** Word-wrap `text` into at most `maxLines` lines that fit `maxWidth`. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

/**
 * Draws the complete tile face (rounded border, type icon, name, price — or
 * the corner art) into a DynamicTexture on a flat plane covering the tile.
 */
function drawTileFace(
  scene: Scene,
  palette: ThemePalette,
  board: BoardDefinition,
  tile: Tile,
  cx: number,
  cz: number,
  isCorner: boolean,
  tileD: number,
  angleDeg: number
) {
  const pos = tile.pos;
  // For non-corner tiles: texture is wide (along the tile's long axis) and
  // short (across the label region). Bigger than this doesn't help since the
  // plane itself is only ~1.5 × 1.8 Babylon units wide.
  const TEX_W = 1024;
  const TEX_H = isCorner ? 1024 : 512;

  // generateMipMaps:true is essential — without mipmaps the minified label
  // aliases into jagged "pixelated" glyphs at board distance/angle.
  const tex = new DynamicTexture(`labelTex_${pos}`, { width: TEX_W, height: TEX_H }, scene, true);
  const ctx = tex.getContext() as CanvasRenderingContext2D;

  // Background fill
  ctx.fillStyle = "#f7f2df";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // Rounded-rect border framing the face (theme-tinted, subtle).
  ctx.strokeStyle = palette.tileBorder;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(14, 14, TEX_W - 28, TEX_H - 28, 28);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (isCorner) {
    // Corner art: big glyph on top, tile name (from board data, so it follows
    // the board's language) beneath it.
    const glyph = cornerLabel(pos, tile.type);
    const isGo = tile.type === "go" || pos === 0;
    ctx.fillStyle = isGo ? "#b91c1c" : "#111";
    ctx.font = "bold 280px Arial";
    ctx.fillText(glyph, TEX_W / 2, TEX_H * 0.36);

    ctx.fillStyle = "#111";
    ctx.font = "bold 92px Arial";
    const nameLines = wrapLines(ctx, tile.name, TEX_W - 120, 2);
    nameLines.forEach((line, i) => {
      ctx.fillText(line, TEX_W / 2, TEX_H * 0.62 + i * 104);
    });

    // GO also advertises its landing bonus.
    if (isGo) {
      ctx.fillStyle = "#b91c1c";
      ctx.font = "bold 88px Arial";
      ctx.fillText(`⟲ +${board.rules.goLandMoney}`, TEX_W / 2, TEX_H * 0.85);
    }
  } else {
    const icon = tile.type === "street" ? null : TYPE_ICONS[tile.type];
    const price = tilePrice(board, tile);

    // Name: uniform font size across ALL tiles, wrapping to 2 lines.
    const FONT_SIZE = 74;
    const LINE_H = 86;
    ctx.font = `bold ${FONT_SIZE}px Arial`;
    ctx.fillStyle = "#111";
    const lines = wrapLines(ctx, tile.name, TEX_W - 64, 2);

    if (icon) {
      // Icon above the name (both nudged up to leave room for the price line).
      ctx.font = "140px Arial";
      ctx.fillText(icon, TEX_W / 2, TEX_H * 0.26);
      ctx.font = `bold ${FONT_SIZE}px Arial`;
      const startY = TEX_H * 0.56 - ((lines.length - 1) * LINE_H) / 2;
      lines.forEach((line, i) => ctx.fillText(line, TEX_W / 2, startY + i * LINE_H));
    } else {
      const startY = TEX_H * 0.4 - ((lines.length - 1) * LINE_H) / 2;
      lines.forEach((line, i) => ctx.fillText(line, TEX_W / 2, startY + i * LINE_H));
    }

    // Price line for purchasable tiles (streets/stations/attractions).
    if (price > 0) {
      ctx.fillStyle = "#4a4436";
      ctx.font = "bold 60px Arial";
      ctx.fillText(`LPD ${price}`, TEX_W / 2, TEX_H * 0.85);
    }
  }

  tex.update();
  // Mipmaps + trilinear + anisotropic = crisp text at any board distance/angle
  // (fixes the jagged "pixelated" glyph aliasing).
  tex.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);
  tex.anisotropicFilteringLevel = 16;

  // Plane covers the full label region of the tile (excluding the colour bar).
  // The colour bar sits at the inner edge, so the label plane spans the rest
  // of the tile width and depth for maximum text coverage.
  const BAR_DEPTH = 0.4;
  const labelRegionDepth = tileD - BAR_DEPTH;
  const planeW = isCorner ? CORNER * 0.9 : TILE_W * 0.92;
  const planeH = isCorner ? CORNER * 0.9 : labelRegionDepth * 0.92;
  const label = MeshBuilder.CreatePlane(
    `label_${pos}`,
    { width: planeW, height: planeH },
    scene
  );
  label.rotation.x = Math.PI / 2; // lie flat
  // Orient so each name reads from OUTSIDE its edge (real-board convention):
  // the top of the text points toward the outer edge. At the tile's natural
  // angle this holds for all four edges.
  label.rotation.y = (angleDeg * Math.PI) / 180;
  // Shift toward the board centre (opposite the outer edge) so the label sits
  // clear of the inner colour bar rather than centred on the whole tile.
  const [odx, odz] = outerDirection(pos);
  const innerShift = isCorner ? 0 : BAR_DEPTH / 2;
  label.position.set(cx - odx * innerShift, 0.096, cz - odz * innerShift);
  label.isPickable = false;

  const labelMat = new StandardMaterial(`labelMat_${pos}`, scene);
  labelMat.diffuseTexture = tex;
  labelMat.backFaceCulling = false;
  labelMat.specularColor = new Color3(0, 0, 0); // no shine → no top-down glare
  labelMat.emissiveColor = new Color3(0.2, 0.2, 0.2); // self-lit so text is legible
  label.material = labelMat;
}

/** 3D jail cage in the felt centre (centred at world origin). */
function buildJailCage(scene: Scene) {
  // Centre the cage at origin (0,0,0) = middle of the board
  const CX = 0;
  const CZ = 0;
  const W = 2.2;
  const H = 0.65;
  const BAR_R = 0.04;
  const BARS = 6;
  const cageMat = new StandardMaterial("cageMat", scene);
  cageMat.diffuseColor = new Color3(0.25, 0.25, 0.3);
  cageMat.specularColor = new Color3(0.7, 0.7, 0.7);

  // Floor
  const floor = MeshBuilder.CreateBox("cageFloor", { width: W, height: 0.05, depth: W }, scene);
  floor.position.set(CX, 0.025, CZ);
  const floorMat = new StandardMaterial("cageFloorMat", scene);
  floorMat.diffuseColor = new Color3(0.5, 0.4, 0.3);
  floor.material = floorMat;

  // Vertical bars on all 4 sides
  const step = W / (BARS - 1);
  const sides: Array<{ dx: number; dz: number; along: "x" | "z" }> = [
    { dx: 0, dz: -W / 2, along: "x" }, // front (–z)
    { dx: 0, dz: W / 2, along: "x" },  // back  (+z)
    { dx: -W / 2, dz: 0, along: "z" }, // left  (–x)
    { dx: W / 2, dz: 0, along: "z" },  // right (+x)
  ];
  for (const side of sides) {
    for (let b = 0; b < BARS; b++) {
      const bar = MeshBuilder.CreateCylinder(
        `cageBar_${side.dx}_${side.dz}_${b}`,
        { diameter: BAR_R * 2, height: H, tessellation: 6 },
        scene
      );
      const t = -W / 2 + b * step;
      if (side.along === "x") {
        bar.position.set(CX + t, 0.05 + H / 2, CZ + side.dz);
      } else {
        bar.position.set(CX + side.dx, 0.05 + H / 2, CZ + t);
      }
      bar.material = cageMat;
    }
  }

  // Top horizontal rails
  for (const side of sides) {
    const rail = MeshBuilder.CreateCylinder(
      `cageRail_${side.dx}_${side.dz}`,
      { diameter: BAR_R * 2, height: W, tessellation: 6 },
      scene
    );
    if (side.along === "x") {
      rail.rotation.z = Math.PI / 2;
      rail.position.set(CX, 0.05 + H, CZ + side.dz);
    } else {
      rail.rotation.x = Math.PI / 2;
      rail.position.set(CX + side.dx, 0.05 + H, CZ);
    }
    rail.material = cageMat;
  }

  // "JAIL" text label floating above the cage
  const jailTex = new DynamicTexture("jailTex", { width: 128, height: 32 }, scene, false);
  const jctx = jailTex.getContext() as CanvasRenderingContext2D;
  jctx.fillStyle = "#1a1a2e";
  jctx.fillRect(0, 0, 128, 32);
  jctx.fillStyle = "#ffd700";
  jctx.font = "bold 20px Arial";
  jctx.textAlign = "center";
  jctx.textBaseline = "middle";
  jctx.fillText("JAIL", 64, 16);
  jailTex.update();

  const jailSign = MeshBuilder.CreatePlane("jailSign", { width: 1.4, height: 0.35 }, scene);
  jailSign.position.set(CX, 0.05 + H + 0.25, CZ);
  jailSign.billboardMode = 7; // always face camera
  const jailMat = new StandardMaterial("jailSignMat", scene);
  jailMat.diffuseTexture = jailTex;
  jailMat.backFaceCulling = false;
  jailSign.material = jailMat;
}
