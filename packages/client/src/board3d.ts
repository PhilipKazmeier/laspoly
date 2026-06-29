import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  PointLight,
  DirectionalLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Texture,
  DynamicTexture,
  AbstractMesh,
  Mesh,
  SceneLoader,
  MultiMaterial,
} from "@babylonjs/core";
import "@babylonjs/loaders/OBJ";
import { getBoard, listBoards, JAIL_POS } from "@laspoly/shared";
import type { GameState, FormattedEvent } from "@laspoly/shared";

// ---------------------------------------------------------------------------
// Colour palette (matches FieldConfiguration.loadGroupColors from Java)
// ---------------------------------------------------------------------------
const GROUP_COLORS: Record<string, string> = {
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

function hexToColor3(hex: string): Color3 {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return new Color3(r, g, b);
}

// Player colours arrive as CSS colour NAMES (e.g. "red", "blue") from the
// server (room.ts COLORS), not hex. Map the known names to vivid hex so the
// 3D tokens/rings render in the right colour instead of black.
const PLAYER_COLOR_HEX: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  purple: "#a855f7",
  orange: "#f97316",
};

/** Resolve a player colour (CSS name or hex) to a Color3. */
function playerColor3(c: string): Color3 {
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
function brighten(c: Color3, target = 0.95): Color3 {
  const max = Math.max(c.r, c.g, c.b);
  if (max <= 0) return new Color3(0.6, 0.6, 0.6);
  const f = target / max;
  return new Color3(Math.min(1, c.r * f), Math.min(1, c.g * f), Math.min(1, c.b * f));
}

// ---------------------------------------------------------------------------
// Coordinate helpers (mirrored from Board.java, scaled 20/1200 ≈ 0.01667)
// ---------------------------------------------------------------------------
const SCALE = 20 / 1200; // 1 Java unit → 0.01667 Babylon units

// Station tile positions (mirror of engine.ts STATION_POSITIONS) used to detect
// station→station TRAVEL and play the subway dive/emerge animation.
const STATION_POSITIONS = new Set([5, 15, 25, 35]);

// Regular tile: 100 J wide × 150 J deep
const TILE_W = 100 * SCALE; // ≈ 1.667
const TILE_D = 150 * SCALE; // ≈ 2.5
// Corner tile: 150 × 150
const CORNER = 150 * SCALE; // ≈ 2.5

/** World XZ for the centre of tile at board position [0..40]. */
function tileXZ(pos: number): [number, number] {
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
function getFieldAngle(pos: number): number {
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
function outerDirection(pos: number): [number, number] {
  if (pos <= 10) return [0, 1];  // bottom edge → outer is +z (toward camera/near)
  if (pos <= 20) return [1, 0];  // right edge  → outer is +x (unchanged)
  if (pos <= 30) return [0, -1]; // top edge    → outer is -z (away from camera/far)
  return [-1, 0];                 // left edge   → outer is -x (unchanged)
}

/**
 * Draw wrapped text on a canvas 2D context.
 * Returns the number of lines actually drawn.
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      lineCount++;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
    lineCount++;
  }
  return lineCount;
}

// ---------------------------------------------------------------------------
// Board3D class
// ---------------------------------------------------------------------------
export class Board3D {
  private engine: Engine;
  private scene: Scene;
  private tokenMeshes: Map<string, AbstractMesh> = new Map();
  private buildingMeshes: Map<number, AbstractMesh> = new Map();
  private currentBoardId: string | null = null;
  // Car OBJ models (player tokens): one merged template mesh per car index 1-5
  private carModels: Map<number, Mesh> = new Map();
  private carsLoaded = false;
  private lastState: GameState | null = null;
  private lastMyId: string | null = null;
  private tokenLabels: Map<string, AbstractMesh> = new Map();
  // Per-player: queue of [x, z] world positions to hop through
  private moveQueues: Map<string, Array<[number, number]>> = new Map();
  private moveAnimating: Set<string> = new Set();
  private prevPositions: Map<string, number> = new Map();
  // Dice
  private diceCupMesh: AbstractMesh | null = null;
  private dieMesh1: AbstractMesh | null = null;
  private dieMesh2: AbstractMesh | null = null;
  private diceAnimating = false;
  private diceResultLabel: AbstractMesh | null = null;
  private camera!: ArcRotateCamera;
  private tokenRings: Map<string, AbstractMesh> = new Map();
  // Interaction hooks
  private rollHandler: (() => void) | null = null;
  private tileClickHandler: ((pos: number) => void) | null = null;
  // Active-player highlight ring (feature #3)
  private activeHighlightMesh: AbstractMesh | null = null;
  private activeHighlightPlayerId: string | null = null;
  private activeHighlightObs: ReturnType<typeof this.scene.onBeforeRenderObservable.add> | null = null;
  // Dice cup visibility
  private cupVisible = true;
  // Token moves deferred until the dice animation settles
  private movePending: Map<string, { from: number; to: number }> = new Map();
  // Resolvers for animateMoveAsync
  private moveResolvers: Map<string, () => void> = new Map();
  // Ownership markers (tilePos -> stripe mesh) and per-player deed/money displays
  private ownershipMarkers: Map<number, AbstractMesh> = new Map();
  private playerDisplayMeshes: Map<string, AbstractMesh> = new Map();
  // World seat positions for up to 4 players' on-board deed/money displays
  private readonly SEAT_POSITIONS: Array<[number, number, number]> = [
    [-12, 0.5, -12],
    [12, 0.5, -12],
    [12, 0.5, 12],
    [-12, 0.5, 12],
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);

    // ---- Camera ------------------------------------------------------------
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
    this.camera.lowerBetaLimit = 0.15; // prevent fully-vertical "mirror" glare

    // ---- Lighting ----------------------------------------------------------
    // Specular is suppressed across lights/materials so the felt + board read
    // flat and legible from a top-down view (no white blowout).
    const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.8;
    ambient.specular = new Color3(0, 0, 0);
    const key = new PointLight("key", new Vector3(0, 20, -5), this.scene);
    key.intensity = 0.3;
    key.specular = new Color3(0.1, 0.1, 0.1);
    // Soft fill from straight above so the board is evenly lit when viewed top-down.
    const fill = new DirectionalLight("fill", new Vector3(0, -1, 0), this.scene);
    fill.intensity = 0.25;
    fill.specular = new Color3(0, 0, 0);

    // ---- Pointer picking: tile clicks + dice-cup click → roll --------------
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== 1) return; // POINTERDOWN
      const picked = pointerInfo.pickInfo;
      if (!picked?.hit || !picked.pickedMesh) return;
      const meshName = picked.pickedMesh.name;
      if (meshName.startsWith("tile_")) {
        const pos = parseInt(meshName.slice(5), 10);
        if (!isNaN(pos) && this.tileClickHandler) this.tileClickHandler(pos);
      } else if (meshName === "diceCup") {
        if (this.rollHandler) this.rollHandler();
      }
    });

    // ---- Wooden table -------------------------------------------------------
    const table = MeshBuilder.CreateBox(
      "table",
      { width: 30, height: 0.5, depth: 30 },
      this.scene
    );
    table.position.y = -0.45;
    const tableMat = new StandardMaterial("tableMat", this.scene);
    // Try to apply a tiled wood-ish colour; no external wood texture required.
    tableMat.diffuseColor = new Color3(0.45, 0.28, 0.12);
    tableMat.specularColor = new Color3(0.15, 0.1, 0.05);
    table.material = tableMat;

    // ---- Initial board -------------------------------------------------------
    const boards = listBoards();
    if (boards.length > 0 && boards[0]) {
      this.drawBoard(boards[0].id);
    }

    // Preload car models (async, best-effort)
    this.preloadCarModels();

    // Dice cup + dice (async, best-effort)
    this.initDice();

    this.engine.runRenderLoop(() => this.scene.render());
    window.addEventListener("resize", () => this.engine.resize());
  }

  // -------------------------------------------------------------------------
  // Asset preloading
  // -------------------------------------------------------------------------
  private async preloadCarModels(): Promise<void> {
    for (let i = 1; i <= 5; i++) {
      try {
        const result = await SceneLoader.ImportMeshAsync("", "/assets/", `car${i}.obj`, this.scene);
        // OBJ loads as one or more real meshes; merge geometry into a single template.
        const realMeshes = result.meshes.filter(
          (m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0
        );
        if (realMeshes.length === 0) continue;
        const merged =
          realMeshes.length === 1
            ? realMeshes[0]!
            : Mesh.MergeMeshes(realMeshes, true, true, undefined, false, false);
        if (!merged) continue;

        // Raw car spans ~0.3 units; normalise to a ~0.7-unit token (fits a tile,
        // leaves room for up to 4 tokens clustered without overlapping).
        const bounds = merged.getBoundingInfo().boundingBox.extendSize;
        const maxDim = Math.max(bounds.x, bounds.y, bounds.z) * 2 || 1;
        const target = 0.7;
        merged.scaling.setAll(target / maxDim);
        merged.name = `carTemplate_${i}`;
        merged.setEnabled(false);
        merged.isPickable = false;
        this.carModels.set(i, merged);
      } catch {
        // Silently skip; cylinder fallback used in rebuildTokens()
      }
    }
    this.carsLoaded = true;
    // If update() was already called before models finished loading, rebuild tokens now
    if (this.lastState) {
      this.rebuildTokens(this.lastState, this.lastMyId);
    }
  }

  // -------------------------------------------------------------------------
  // Board geometry
  // -------------------------------------------------------------------------
  private drawBoard(boardId: string) {
    if (this.currentBoardId === boardId) return;
    this.currentBoardId = boardId;

    const board = getBoard(boardId);

    // ---- Green board base ---------------------------------------------------
    // Total board: 1200 × 1200 Java units → 20 × 20 Babylon units
    const boardBase = MeshBuilder.CreateBox(
      "boardBase",
      { width: 20, height: 0.08, depth: 20 },
      this.scene
    );
    boardBase.position.y = -0.04;
    const boardMat = new StandardMaterial("boardMat", this.scene);
    boardMat.diffuseColor = new Color3(0.32, 0.54, 0.28);
    boardMat.specularColor = new Color3(0, 0, 0); // flat, no glare from above
    boardBase.material = boardMat;

    // ---- Felt centre --------------------------------------------------------
    const FELT_SIZE = 11.5;
    const felt = MeshBuilder.CreateBox(
      "felt",
      { width: FELT_SIZE, height: 0.02, depth: FELT_SIZE },
      this.scene
    );
    felt.position.y = 0.01;
    const feltMat = new StandardMaterial("feltMat", this.scene);
    feltMat.diffuseTexture = new Texture("/assets/tex_felt.png", this.scene);
    feltMat.specularColor = new Color3(0, 0, 0); // flat, no glare from above
    felt.material = feltMat;

    // ---- Card deck ----------------------------------------------------------
    const DECK_SCALE = 240 * SCALE; // 240 Java → 4.0 Babylon (from Board.java)
    const deck = MeshBuilder.CreateBox(
      "cardDeck",
      { width: 1.6, height: 0.25, depth: 2.1 },
      this.scene
    );
    deck.position.set(DECK_SCALE, 0.14, DECK_SCALE);
    deck.rotation.y = (45 * Math.PI) / 180;
    const deckMat = new StandardMaterial("deckMat", this.scene);
    deckMat.diffuseTexture = new Texture("/assets/cardpattern.png", this.scene);
    deck.material = deckMat;

    // ---- Jail cage ----------------------------------------------------------
    this.buildJailCage();

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
        this.scene
      );
      tileMesh.position.set(cx, 0.045, cz);
      tileMesh.rotation.y = (angle * Math.PI) / 180;
      tileMesh.isPickable = true; // tile-click hook (setTileClickHandler)

      const tileMat = new StandardMaterial(`tileMat_${tile.pos}`, this.scene);
      tileMat.diffuseColor = new Color3(0.97, 0.95, 0.88);
      tileMesh.material = tileMat;

      // ---- Colour bar (inner-edge, facing board centre) --------------------
      const group = (tile as { group?: string }).group;
      if (group && GROUP_COLORS[group]) {
        const colorHex = GROUP_COLORS[group];
        if (colorHex) {
          this.addColorBar(cx, cz, tile.pos, isCorner, tileW, tileD, angle, colorHex);
        }
      }

      // ---- Label (DynamicTexture on a flat plane) --------------------------
      this.addTileLabel(cx, cz, tile.pos, tile.name, tile.type as string, isCorner, tileW, tileD, angle);
    }
  }

  /** Adds the group-coloured bar on the INNER edge (toward board centre) of a property tile. */
  private addColorBar(
    cx: number,
    cz: number,
    pos: number,
    isCorner: boolean,
    tileW: number,
    tileD: number,
    angleDeg: number,
    colorHex: string
  ) {
    const BAR_DEPTH = 0.4; // thickness of the bar (toward centre)
    const [odx, odz] = outerDirection(pos);

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
      this.scene
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

    const barMat = new StandardMaterial(`barMat_${pos}`, this.scene);
    barMat.diffuseColor = hexToColor3(colorHex);
    barMat.specularColor = new Color3(0, 0, 0);
    bar.material = barMat;

    // Suppress unused variable warnings (outer direction kept for reference)
    void odx;
    void odz;
  }

  /** Adds a DynamicTexture label plane on top of a tile. */
  private addTileLabel(
    cx: number,
    cz: number,
    pos: number,
    name: string,
    type: string,
    isCorner: boolean,
    tileW: number,
    tileD: number,
    angleDeg: number
  ) {
    // High-resolution texture so labels read crisply in standard AND top-down.
    const TEX_W = 1024;
    const TEX_H = isCorner ? 1024 : 512;

    const tex = new DynamicTexture(`labelTex_${pos}`, { width: TEX_W, height: TEX_H }, this.scene, false);
    const ctx = tex.getContext() as CanvasRenderingContext2D;

    // Background fill
    ctx.fillStyle = "#f7f2df";
    ctx.fillRect(0, 0, TEX_W, TEX_H);

    // For corner tiles draw a short special label centred
    if (isCorner) {
      const label = cornerLabel(pos, type);
      ctx.fillStyle = "#111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 220px Arial";
      ctx.fillText(label, TEX_W / 2, TEX_H / 2);
    } else {
      // Street / station / attraction: HORIZONTAL text, word-wrapped onto up to
      // 3 lines, vertically centred in the label region (which sits clear of the
      // inner colour bar once the plane is positioned).
      ctx.fillStyle = "#111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const FONT_SIZE = 112;
      const SMALL_SIZE = 84;
      const LINE_H = 128;
      ctx.font = `bold ${FONT_SIZE}px Arial`;
      const MAX_W = TEX_W - 24;
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
      // Shrink slightly if it spills past 2 lines so 3 lines still fit.
      ctx.font = lines.length > 2 ? `bold ${SMALL_SIZE}px Arial` : `bold ${FONT_SIZE}px Arial`;
      const shown = Math.min(lines.length, 3);
      const startY = TEX_H / 2 - ((shown - 1) * LINE_H) / 2;
      for (let i = 0; i < shown; i++) {
        ctx.fillText(lines[i]!, TEX_W / 2, startY + i * LINE_H);
      }
    }

    tex.update();

    // Plane sits in the INNER region of the tile (between the colour bar on the
    // inner edge and the tile centre) so the colour bar never covers the name.
    const BAR_DEPTH = 0.4;
    const labelRegionDepth = tileD - BAR_DEPTH;
    const planeW = isCorner ? CORNER * 0.9 : TILE_W * 0.9;
    const planeH = isCorner ? CORNER * 0.9 : labelRegionDepth * 0.9;
    const label = MeshBuilder.CreatePlane(
      `label_${pos}`,
      { width: planeW, height: planeH },
      this.scene
    );
    label.rotation.x = Math.PI / 2; // lie flat
    // Orient so each name reads from OUTSIDE its edge (real-board convention):
    // the top of the text points toward the outer edge. At the tile's natural
    // angle this holds for all four edges — no per-edge flip (a flip is what made
    // the top/left edges read upside-down).
    label.rotation.y = (angleDeg * Math.PI) / 180;
    // Shift toward the board centre (opposite the outer edge) so the label sits
    // clear of the inner colour bar rather than centred on the whole tile.
    const [odx, odz] = outerDirection(pos);
    const innerShift = isCorner ? 0 : BAR_DEPTH / 2;
    label.position.set(cx - odx * innerShift, 0.096, cz - odz * innerShift);
    label.isPickable = false;

    const labelMat = new StandardMaterial(`labelMat_${pos}`, this.scene);
    labelMat.diffuseTexture = tex;
    labelMat.backFaceCulling = false;
    labelMat.specularColor = new Color3(0, 0, 0); // no shine → no top-down glare
    labelMat.emissiveColor = new Color3(0.15, 0.15, 0.15); // a touch of self-lit so text is legible
    label.material = labelMat;
  }

  /** 3D jail cage in the felt centre (centred at world origin). */
  private buildJailCage() {
    // Centre the cage at origin (0,0,0) = middle of the board
    const CX = 0;
    const CZ = 0;
    const W = 2.2;
    const H = 0.65;
    const BAR_R = 0.04;
    const BARS = 6;
    const cageMat = new StandardMaterial("cageMat", this.scene);
    cageMat.diffuseColor = new Color3(0.25, 0.25, 0.3);
    cageMat.specularColor = new Color3(0.7, 0.7, 0.7);

    // Floor
    const floor = MeshBuilder.CreateBox("cageFloor", { width: W, height: 0.05, depth: W }, this.scene);
    floor.position.set(CX, 0.025, CZ);
    const floorMat = new StandardMaterial("cageFloorMat", this.scene);
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
          this.scene
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
        this.scene
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
    const jailTex = new DynamicTexture("jailTex", { width: 128, height: 32 }, this.scene, false);
    const jctx = jailTex.getContext() as CanvasRenderingContext2D;
    jctx.fillStyle = "#1a1a2e";
    jctx.fillRect(0, 0, 128, 32);
    jctx.fillStyle = "#ffd700";
    jctx.font = "bold 20px Arial";
    jctx.textAlign = "center";
    jctx.textBaseline = "middle";
    jctx.fillText("JAIL", 64, 16);
    jailTex.update();

    const jailSign = MeshBuilder.CreatePlane("jailSign", { width: 1.4, height: 0.35 }, this.scene);
    jailSign.position.set(CX, 0.05 + H + 0.25, CZ);
    jailSign.billboardMode = 7; // always face camera
    const jailMat = new StandardMaterial("jailSignMat", this.scene);
    jailMat.diffuseTexture = jailTex;
    jailMat.backFaceCulling = false;
    jailSign.material = jailMat;
  }

  // -------------------------------------------------------------------------
  // Token management
  // -------------------------------------------------------------------------

  /** Return a clone of car model `idx` (1–5) tinted by `color`, or undefined if not ready. */
  private cloneCarToken(idx: number, color: Color3, playerId: string): AbstractMesh | undefined {
    const template = this.carModels.get(idx);
    if (!template) return undefined;

    const clone = template.clone(`token_${playerId}`);
    if (!clone) return undefined;
    clone.setEnabled(true);
    clone.isPickable = false;
    // Tint by overriding material with a bright, self-lit colour so the car
    // reads clearly as that player's colour (the raw OBJ material is dark).
    // Brighten dark player colours so they don't render near-black.
    const bright = brighten(color);
    const mat = new StandardMaterial(`tokenMat_${playerId}`, this.scene);
    mat.diffuseColor = bright;
    mat.specularColor = new Color3(0.4, 0.4, 0.4);
    mat.emissiveColor = bright.scale(0.7);
    clone.material = mat;
    // Apply to any sub-meshes too (multi-material merges keep a MultiMaterial)
    clone.getChildMeshes().forEach((c) => { c.material = mat; });
    return clone;
  }

  /** Fallback token: a coloured cylinder (clearly visible on tile). */
  private makeFallbackToken(playerId: string, color: Color3): AbstractMesh {
    const mesh = MeshBuilder.CreateCylinder(
      `token_fb_${playerId}`,
      { diameter: 0.35, height: 0.45, tessellation: 8 },
      this.scene
    );
    const mat = new StandardMaterial(`tokenMat_${playerId}`, this.scene);
    mat.diffuseColor = color;
    mat.emissiveColor = color.scale(0.6); // glow a bit so tokens stand out
    mesh.material = mat;
    return mesh;
  }

  /** Floating billboard name label above a token. */
  private addTokenLabel(playerId: string, name: string, color: string) {
    const tex = new DynamicTexture(`lblTex_${playerId}`, { width: 128, height: 32 }, this.scene, false);
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, 128, 32);
    // `color` may be a CSS name (e.g. "red") or hex — both are valid fillStyle.
    ctx.fillStyle = color;
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 64, 16);
    tex.update();

    const plane = MeshBuilder.CreatePlane(`lbl_${playerId}`, { width: 0.9, height: 0.22 }, this.scene);
    plane.billboardMode = 7;
    const mat = new StandardMaterial(`lblMat_${playerId}`, this.scene);
    mat.diffuseTexture = tex;
    mat.backFaceCulling = false;
    mat.emissiveColor = new Color3(1, 1, 1);
    plane.material = mat;
    plane.isPickable = false;
    this.tokenLabels.set(playerId, plane);
  }

  /** (Re)build all token meshes & labels from state, positioning non-animating tokens. */
  private rebuildTokens(state: GameState, myId: string | null) {
    // Remove tokens for players who left
    for (const [id, mesh] of this.tokenMeshes) {
      if (!state.players.find((p) => p.id === id)) {
        mesh.dispose();
        this.tokenMeshes.delete(id);
        const lbl = this.tokenLabels.get(id);
        if (lbl) { lbl.dispose(); this.tokenLabels.delete(id); }
        const ring = this.tokenRings.get(id);
        if (ring) { ring.dispose(); this.tokenRings.delete(id); }
      }
    }

    // Group players by position for overlap offsets
    const byPos: Map<number, string[]> = new Map();
    for (const p of state.players) {
      if (!p.alive) continue;
      const arr = byPos.get(p.position) ?? [];
      arr.push(p.id);
      byPos.set(p.position, arr);
    }

    for (const player of state.players) {
      if (!player.alive) {
        const old = this.tokenMeshes.get(player.id);
        if (old) { old.dispose(); this.tokenMeshes.delete(player.id); }
        const lbl = this.tokenLabels.get(player.id);
        if (lbl) { lbl.dispose(); this.tokenLabels.delete(player.id); }
        const ring = this.tokenRings.get(player.id);
        if (ring) { ring.dispose(); this.tokenRings.delete(player.id); }
        continue;
      }

      const [x, z] = tileXZ(player.position);
      const group = byPos.get(player.position) ?? [];
      const i = group.indexOf(player.id);
      // 2×2 cluster grid: clear non-overlapping offsets for up to 4 tokens/tile.
      const GRID_STEP = 0.45;
      const offsetX = (i % 2) * GRID_STEP - GRID_STEP / 2;
      const offsetZ = Math.floor(i / 2) * GRID_STEP - GRID_STEP / 2;

      // Upgrade a fallback cylinder to a car model once models load
      const existing = this.tokenMeshes.get(player.id);
      if (existing && this.carsLoaded && existing.name.startsWith("token_fb_")) {
        existing.dispose();
        this.tokenMeshes.delete(player.id);
      }

      let mesh = this.tokenMeshes.get(player.id);
      if (!mesh) {
        const color = playerColor3(player.color);
        const carIdx = (state.players.indexOf(player) % 5) + 1;
        mesh = this.carsLoaded
          ? (this.cloneCarToken(carIdx, color, player.id) ?? this.makeFallbackToken(player.id, color))
          : this.makeFallbackToken(player.id, color);
        this.tokenMeshes.set(player.id, mesh);
        if (!this.tokenLabels.has(player.id)) {
          this.addTokenLabel(player.id, player.name, player.color);
        }
      }

      const targetX = x + offsetX;
      const targetZ = z + offsetZ;
      // Initialise prevPositions on first sight so first move animates from a real tile
      if (!this.prevPositions.has(player.id)) {
        this.prevPositions.set(player.id, player.position);
      }
      // Don't teleport tokens mid-animation; driveAnimation() handles positioning
      if (!this.moveAnimating.has(player.id)) {
        mesh.position.set(targetX, 0.35, targetZ);
        const lbl = this.tokenLabels.get(player.id);
        if (lbl) lbl.position.set(targetX, 1.1, targetZ);
        // Coloured ring/disc under token: a bright torus halo that pokes out
        // beyond the car silhouette so each player's colour is unmistakable,
        // even from a top-down view where the car body would hide a flat disc.
        let ring = this.tokenRings.get(player.id);
        if (!ring) {
          const ringColor = brighten(playerColor3(player.color));
          ring = MeshBuilder.CreateTorus(
            `ring_${player.id}`,
            { diameter: 0.55, thickness: 0.12, tessellation: 16 },
            this.scene
          );
          const ringMat = new StandardMaterial(`ringMat_${player.id}`, this.scene);
          // Emissive carries the hue (so it pops regardless of lighting angle),
          // with a touch of diffuse for shading. specular off to avoid white blowout.
          ringMat.diffuseColor = ringColor.scale(0.3);
          ringMat.emissiveColor = ringColor;
          ringMat.specularColor = new Color3(0, 0, 0);
          ring.material = ringMat;
          ring.isPickable = false;
          this.tokenRings.set(player.id, ring);
        }
        ring.position.set(targetX, 0.12, targetZ);
      }
    }

    void myId;
  }

  /**
   * Ensure a token mesh (+ label + ring) exists for `playerId`, positioned at the
   * player's CURRENT tile, before an animation begins. Used by the serial state
   * queue so animateMoveAsync always has a mesh to move. No-op if it exists.
   */
  ensureTokenExists(playerId: string, state: GameState, _myId: string | null): void {
    if (this.tokenMeshes.has(playerId)) return;
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return;
    const color = playerColor3(player.color);
    const carIdx = (state.players.indexOf(player) % 5) + 1;
    const mesh = this.carsLoaded
      ? (this.cloneCarToken(carIdx, color, playerId) ?? this.makeFallbackToken(playerId, color))
      : this.makeFallbackToken(playerId, color);
    this.tokenMeshes.set(playerId, mesh);
    if (!this.tokenLabels.has(playerId)) {
      this.addTokenLabel(playerId, player.name, player.color);
    }
    const [x, z] = tileXZ(player.position);
    mesh.position.set(x, 0.35, z);
    const lbl = this.tokenLabels.get(playerId);
    if (lbl) lbl.position.set(x, 1.1, z);
    let ring = this.tokenRings.get(playerId);
    if (!ring) {
      const ringColor = brighten(playerColor3(player.color));
      ring = MeshBuilder.CreateTorus(
        `ring_${playerId}`,
        { diameter: 0.55, thickness: 0.12, tessellation: 16 },
        this.scene
      );
      const ringMat = new StandardMaterial(`ringMat_${playerId}`, this.scene);
      ringMat.diffuseColor = ringColor.scale(0.3);
      ringMat.emissiveColor = ringColor;
      ringMat.specularColor = new Color3(0, 0, 0);
      ring.material = ringMat;
      ring.isPickable = false;
      this.tokenRings.set(playerId, ring);
    }
    ring.position.set(x, 0.12, z);
  }

  // -------------------------------------------------------------------------
  // Buildings
  // -------------------------------------------------------------------------
  private updateBuildings(state: GameState) {
    // Dispose buildings that no longer exist
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

      let mesh: AbstractMesh;
      const mat = new StandardMaterial(`bldgMat_${pos}`, this.scene);

      if (b.hotel) {
        mesh = MeshBuilder.CreateBox(`bldg_${pos}`, { width: 0.4, height: 0.6, depth: 0.4 }, this.scene);
        mat.diffuseColor = new Color3(0.8, 0.1, 0.1);
      } else if (b.factory) {
        mesh = MeshBuilder.CreateBox(`bldg_${pos}`, { width: 0.6, height: 0.35, depth: 0.6 }, this.scene);
        mat.diffuseColor = new Color3(0.6, 0.6, 0.2);
      } else {
        mesh = MeshBuilder.CreateBox(
          `bldg_${pos}`,
          { width: Math.max(0.1, 0.2 * b.houses), height: 0.25, depth: 0.2 },
          this.scene
        );
        mat.diffuseColor = new Color3(0.1, 0.7, 0.1);
      }

      if (state.mortgaged[pos]) {
        mat.diffuseColor = mat.diffuseColor.scale(0.4);
      }

      mesh.material = mat;
      // Offset slightly toward the board centre from the tile
      const [, odz] = outerDirection(pos);
      mesh.position.set(x, 0.35, z + odz * 0.5);
      this.buildingMeshes.set(pos, mesh);
    }
  }

  // -------------------------------------------------------------------------
  // Ownership markers (on-board, owner-coloured stripe per property tile)
  // -------------------------------------------------------------------------
  private updateOwnershipMarkers(state: GameState) {
    // Dispose markers for tiles that are no longer owned.
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

      const isCorner = pos === 0 || pos === 10 || pos === 20 || pos === 30;
      if (isCorner) continue; // corners aren't ownable properties

      // Recreate each update so owner colour + mortgage state always match.
      const existing = this.ownershipMarkers.get(pos);
      if (existing) { existing.dispose(); this.ownershipMarkers.delete(pos); }

      const [cx, cz] = tileXZ(pos);
      const [odx, odz] = outerDirection(pos);
      const isMortgaged = !!state.mortgaged[pos];

      // A raised owner-coloured stripe at the OUTER edge of the tile (the inner
      // edge now carries the group colour bar, so the owner marker lives outside
      // it to stay distinct). Raised a little so it reads as a "deed flag".
      const marker = MeshBuilder.CreateBox(
        `own_${pos}`,
        { width: TILE_W * 0.7, height: 0.18, depth: 0.16 },
        this.scene
      );
      const outerEdgeX = cx + odx * (TILE_D / 2 - 0.12);
      const outerEdgeZ = cz + odz * (TILE_D / 2 - 0.12);
      marker.position.set(outerEdgeX, 0.13, outerEdgeZ);
      marker.rotation.y = (getFieldAngle(pos) * Math.PI) / 180;

      const mat = new StandardMaterial(`ownMat_${pos}`, this.scene);
      const baseColor = playerColor3(player.color);
      // Mortgaged → dull grey so it reads distinctly from an active deed.
      mat.diffuseColor = isMortgaged ? new Color3(0.3, 0.3, 0.3) : baseColor;
      mat.emissiveColor = isMortgaged ? new Color3(0.1, 0.1, 0.1) : baseColor.scale(0.5);
      mat.specularColor = new Color3(0, 0, 0);
      marker.material = mat;
      marker.isPickable = false;
      this.ownershipMarkers.set(pos, marker);
    }
  }

  // -------------------------------------------------------------------------
  // Per-player on-board deed + money displays (up to 4 players)
  // -------------------------------------------------------------------------
  private updatePlayerDisplays(state: GameState) {
    const board = getBoard(state.boardId);
    const alivePlayers = state.players.filter((p) => p.alive);

    // Remove displays for players who left/died.
    for (const [id, mesh] of this.playerDisplayMeshes) {
      if (!alivePlayers.find((p) => p.id === id)) {
        mesh.dispose();
        this.playerDisplayMeshes.delete(id);
      }
    }

    alivePlayers.slice(0, 4).forEach((player, seatIdx) => {
      // Cheap to recreate for ≤4 players each state change.
      const existing = this.playerDisplayMeshes.get(player.id);
      if (existing) existing.dispose();

      const ownedPositions = Object.entries(state.ownership)
        .filter(([, pid]) => pid === player.id)
        .map(([pos]) => Number(pos));

      const groupSet: Set<string> = new Set();
      for (const pos of ownedPositions) {
        const tile = board.tiles.find((t) => t.pos === pos);
        if (tile && "group" in tile && tile.group) groupSet.add(tile.group as string);
      }

      const TEX_W = 192, TEX_H = 80;
      const tex = new DynamicTexture(`pdTex_${player.id}`, { width: TEX_W, height: TEX_H }, this.scene, false);
      const ctx = tex.getContext() as CanvasRenderingContext2D;
      ctx.fillStyle = "rgba(20,20,30,0.85)";
      ctx.fillRect(0, 0, TEX_W, TEX_H);

      // Name + colour swatch
      const pColorHex = PLAYER_COLOR_HEX[player.color.toLowerCase()] ?? player.color;
      ctx.fillStyle = pColorHex;
      ctx.fillRect(4, 4, 10, 10);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(player.name.slice(0, 14), 18, 4);

      // Money
      ctx.fillStyle = "#facc15";
      ctx.font = "12px Arial";
      ctx.fillText(`LPD ${player.money.toLocaleString()}`, 18, 20);

      // Owned property group colour chips
      let dotX = 4;
      for (const grp of Array.from(groupSet).slice(0, 12)) {
        ctx.fillStyle = GROUP_COLORS[grp] ?? "#888";
        ctx.fillRect(dotX, 40, 12, 12);
        dotX += 14;
      }

      // Deed count
      ctx.fillStyle = "#ddd";
      ctx.font = "11px Arial";
      ctx.fillText(`${ownedPositions.length} props`, 4, 56);

      tex.update();

      const plane = MeshBuilder.CreatePlane(`playerDisplay_${player.id}`, { width: 2.4, height: 1.0 }, this.scene);
      const seat = this.SEAT_POSITIONS[seatIdx] ?? ([-12, 0.5, -12] as [number, number, number]);
      plane.position.set(seat[0], seat[1], seat[2]);
      plane.billboardMode = 7;
      const mat = new StandardMaterial(`pdMat_${player.id}`, this.scene);
      mat.diffuseTexture = tex;
      mat.backFaceCulling = false;
      mat.emissiveColor = new Color3(0.8, 0.8, 0.8);
      mat.specularColor = new Color3(0, 0, 0);
      plane.material = mat;
      plane.isPickable = false;
      this.playerDisplayMeshes.set(player.id, plane);
    });
  }

  // -------------------------------------------------------------------------
  // Public update (called on every GameState message)
  // -------------------------------------------------------------------------
  update(state: GameState, _myId: string | null) {
    this.applyStateDiffs(state);
    this.applyVisuals(state, _myId);
  }

  /** Apply all non-animation visual updates (buildings, ownership, HUD, board). Called after animation resolves. */
  applyVisuals(state: GameState, myId: string | null): void {
    this.lastState = state;
    this.lastMyId = myId;
    this.drawBoard(state.boardId);
    this.rebuildTokens(state, myId);
    this.updateBuildings(state);
    this.updateOwnershipMarkers(state);
    this.updatePlayerDisplays(state);
  }

  /** Instantly snap all tokens to positions in `state` (reconnect / fast-forward). */
  snapToState(state: GameState, myId: string | null): void {
    // Clear any in-flight animations
    this.moveQueues.clear();
    this.moveAnimating.clear();
    this.movePending.clear();
    // Reset prevPositions so next diff starts clean
    for (const p of state.players) {
      const pos = p.inJail ? JAIL_POS : p.position;
      this.prevPositions.set(p.id, pos);
    }
    this.applyVisuals(state, myId);
  }

  /** Register a callback invoked when the player clicks the dice cup to roll. */
  setRollHandler(cb: () => void): void {
    this.rollHandler = cb;
  }

  /** Register a callback called with the tile position (0–39) when a tile is clicked. */
  setTileClickHandler(cb: (pos: number) => void): void {
    this.tileClickHandler = cb;
  }

  /**
   * Called by main.ts with the just-arrived FormattedEvent batch.
   * FormattedEvent only carries {key, text, playerId}; the movement and dice
   * data we need is read from the authoritative GameState in applyStateDiffs()
   * (invoked from update()). This hook is retained as the documented entry
   * point for event-keyed board effects and is intentionally a no-op for now.
   */
  handleEvents(_events: FormattedEvent[]) {
    // Animations are driven by state diffs in update()/applyStateDiffs().
    void _events;
  }

  /** Switch camera between angled standard view and flat top-down view. */
  setView(v: 'standard' | 'top'): void {
    if (v === 'top') {
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = 0.25; // ~14° from vertical — readable top-down without mirror glare
      this.camera.radius = 38;
    } else {
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = Math.PI / 3.2;
      this.camera.radius = 32;
    }
  }

  /**
   * Bring the dice cup back when the turn advances to a player awaiting a roll
   * (the cup was hidden after the previous roll settled). Called by the serial
   * state queue (main.ts) using the previously-rendered state for comparison.
   */
  prepareCupForTurn(state: GameState, prev: GameState | null): void {
    if (!prev) {
      if (state.phase === "awaiting-roll") this.showCup();
      return;
    }
    if (
      state.phase === "awaiting-roll" &&
      (prev.phase !== "awaiting-roll" || prev.currentPlayerIndex !== state.currentPlayerIndex)
    ) {
      this.showCup();
    }
  }

  /** Detect per-player position changes and enqueue movement / jail animations. */
  private applyStateDiffs(state: GameState) {
    // When the turn advances to a new player awaiting a roll, bring the cup back.
    if (this.lastState) {
      const prevPhase = this.lastState.phase;
      const prevCurrentIdx = this.lastState.currentPlayerIndex;
      if (
        state.phase === "awaiting-roll" &&
        (prevPhase !== "awaiting-roll" || prevCurrentIdx !== state.currentPlayerIndex)
      ) {
        this.showCup();
      }
    }

    // Dice: trigger on any player's lastRoll changing (covers bots too).
    if (this.lastState) {
      for (const p of state.players) {
        const prev = this.lastState.players.find((pl) => pl.id === p.id);
        if (p.lastRoll[0] > 0 && prev && (prev.lastRoll[0] !== p.lastRoll[0] || prev.lastRoll[1] !== p.lastRoll[1])) {
          this.playDiceAnimation(p.lastRoll[0], p.lastRoll[1]);
        }
      }
    }

    for (const p of state.players) {
      const prevPos = this.prevPositions.get(p.id);
      const newPos = p.inJail ? JAIL_POS : p.position;
      if (prevPos === undefined) {
        this.prevPositions.set(p.id, newPos);
        continue;
      }
      if (prevPos === newPos) continue;

      if (newPos === JAIL_POS) {
        this.enqueueJailAnimation(p.id);
      } else if (prevPos === JAIL_POS) {
        // Leaving jail: single slide to the destination tile.
        this.moveQueues.set(p.id, [...(this.moveQueues.get(p.id) ?? []), tileXZ(newPos)]);
        if (!this.moveAnimating.has(p.id)) this.driveAnimation(p.id);
      } else {
        // Defer the token walk until the dice animation finishes so the figure
        // only starts moving after the dice have settled (no overlap).
        if (this.diceAnimating) {
          this.movePending.set(p.id, { from: prevPos, to: newPos });
        } else {
          this.enqueueMove(p.id, prevPos, newPos);
        }
      }
      this.prevPositions.set(p.id, newPos);
    }
  }

  private enqueueMove(playerId: string, from: number, to: number) {
    const RING = 40;
    const forwardDist = (((to - from) % RING) + RING) % RING;

    // A forward distance > 12 can't be a dice roll (max 6+6). It's an action-card
    // jump (often a backward move expressed as a large forward wrap). Don't walk
    // the long way clockwise — jump straight to the destination tile.
    if (forwardDist > 12) {
      const dest = tileXZ(to);
      const existing = this.moveQueues.get(playerId) ?? [];
      this.moveQueues.set(playerId, [...existing, dest]);
      if (!this.moveAnimating.has(playerId)) this.driveAnimation(playerId);
      return;
    }

    // Normal forward dice move: walk tile-by-tile clockwise.
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

  /** Enqueues a token move from `from` to `to` and resolves when the token arrives at `to`. */
  animateMoveAsync(playerId: string, from: number, to: number): Promise<void> {
    // No movement: resolve immediately so the queue never stalls.
    if (from === to) return Promise.resolve();

    // Station → station TRAVEL: dive underground and emerge at the destination
    // instead of walking the ring. forwardDist > 4 excludes the rare adjacent
    // dice-step between neighbouring stations.
    const RING = 40;
    const forwardDist = (((to - from) % RING) + RING) % RING;
    if (STATION_POSITIONS.has(from) && STATION_POSITIONS.has(to) && forwardDist > 4) {
      return this.animateSubwayTravel(playerId, from, to);
    }
    return new Promise<void>((resolve) => {
      let done = false;
      let timer: ReturnType<typeof setTimeout>;
      // Wrapped resolver: clears the safety timer and resolves exactly once.
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
      };

      // If a resolver for this player is already registered (e.g. two state
      // updates for the same player arrived back-to-back), fire the stale one
      // immediately so it doesn't leak.
      const stale = this.moveResolvers.get(playerId);
      if (stale) { this.moveResolvers.delete(playerId); stale(); }

      this.moveResolvers.set(playerId, finish);
      this.enqueueMove(playerId, from, to);

      // Safety net: token moves are driven by onBeforeRenderObservable. If the
      // render loop stalls (e.g. headless/background-tab requestAnimationFrame
      // throttling), force-complete so the serial state queue can NEVER deadlock
      // and the game always makes progress. Snaps the token to its destination.
      const hops = forwardDist > 12 ? 1 : forwardDist;
      const capMs = hops * 120 + 1800;
      timer = setTimeout(() => {
        if (done) return;
        this.moveQueues.delete(playerId);
        this.moveAnimating.delete(playerId);
        this.snapTokenToTile(playerId, to);
        if (this.moveResolvers.get(playerId) === finish) this.moveResolvers.delete(playerId);
        finish();
      }, capMs);
    });
  }

  /** Instantly place a player's token (and its label/ring) on a tile. Jail-aware. */
  private snapTokenToTile(playerId: string, pos: number) {
    const [x, z] = pos === 40 ? [0, 0] : tileXZ(pos);
    const mesh = this.tokenMeshes.get(playerId);
    if (mesh) { mesh.position.set(x, 0.35, z); mesh.rotation.y = 0; }
    const lbl = this.tokenLabels.get(playerId);
    if (lbl) lbl.position.set(x, 1.1, z);
    const ring = this.tokenRings.get(playerId);
    if (ring) ring.position.set(x, 0.12, z);
  }

  /**
   * Subway-style travel: the token dives DOWN below the board (subway entrance),
   * teleports to the destination station while hidden underground, then emerges
   * UP at the destination. One self-contained queued animation that resolves on
   * completion (so the serial queue can await it).
   */
  private animateSubwayTravel(playerId: string, _from: number, to: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const mesh = this.tokenMeshes.get(playerId);
      const lbl = this.tokenLabels.get(playerId);
      const ring = this.tokenRings.get(playerId);
      if (!mesh) { resolve(); return; }

      // eslint-disable-next-line prefer-const
      let obs: ReturnType<typeof this.scene.onBeforeRenderObservable.add>;

      const [destX, destZ] = tileXZ(to);
      const DIVE_MS = 420;
      const EMERGE_MS = 420;
      const TOTAL_MS = DIVE_MS + EMERGE_MS;
      const startY = mesh.position.y; // ≈ 0.35
      const UNDERGROUND = -1.6;
      let phase: "dive" | "emerge" = "dive";
      let elapsed = 0;
      let lastTime = performance.now();
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        this.scene.onBeforeRenderObservable.remove(obs);
        clearTimeout(safetyTimer);
        mesh.position.set(destX, startY, destZ);
        mesh.rotation.y = 0;
        if (lbl) lbl.position.set(destX, 1.1, destZ);
        if (ring) ring.position.set(destX, 0.12, destZ);
        resolve();
      };

      // Safety timer so the promise resolves even when rAF is throttled.
      const safetyTimer = setTimeout(finish, TOTAL_MS + 200);

      obs = this.scene.onBeforeRenderObservable.add(() => {
        const now = performance.now();
        elapsed += now - lastTime;
        lastTime = now;

        if (phase === "dive") {
          const t = Math.min(elapsed / DIVE_MS, 1);
          mesh.position.y = startY + (UNDERGROUND - startY) * t;
          mesh.rotation.y = t * Math.PI * 4; // spin while descending
          if (lbl) lbl.position.set(mesh.position.x, mesh.position.y + 0.8, mesh.position.z);
          if (ring) ring.position.y = mesh.position.y;
          if (t >= 1) {
            // Teleport to destination while invisible underground.
            mesh.position.x = destX;
            mesh.position.z = destZ;
            if (lbl) { lbl.position.x = destX; lbl.position.z = destZ; }
            if (ring) { ring.position.x = destX; ring.position.z = destZ; }
            phase = "emerge";
            elapsed = 0;
          }
        } else {
          const t = Math.min(elapsed / EMERGE_MS, 1);
          mesh.position.y = UNDERGROUND + (startY - UNDERGROUND) * t;
          mesh.rotation.y = (1 - t) * Math.PI * 4;
          if (lbl) lbl.position.set(destX, mesh.position.y + 0.8, destZ);
          if (ring) ring.position.set(destX, 0.12, destZ);
          if (t >= 1) finish();
        }
      });
    });
  }

  private enqueueJailAnimation(playerId: string) {
    const jailXZ: [number, number] = [0, 0]; // cage is at world origin
    const existing = this.moveQueues.get(playerId) ?? [];
    this.moveQueues.set(playerId, [...existing, jailXZ]);
    if (!this.moveAnimating.has(playerId)) this.driveAnimation(playerId);
  }

  private driveAnimation(playerId: string) {
    const mesh = this.tokenMeshes.get(playerId);
    if (!mesh) {
      this.moveAnimating.delete(playerId);
      const res = this.moveResolvers.get(playerId);
      if (res) { this.moveResolvers.delete(playerId); res(); }
      return;
    }

    const queue = this.moveQueues.get(playerId);
    if (!queue || queue.length === 0) {
      this.moveAnimating.delete(playerId);
      const res = this.moveResolvers.get(playerId);
      if (res) { this.moveResolvers.delete(playerId); res(); }
      return;
    }

    this.moveAnimating.add(playerId);
    const next = queue.shift()!;
    const targetX = next[0];
    const targetZ = next[1];
    this.moveQueues.set(playerId, queue);

    const startX = mesh.position.x;
    const startZ = mesh.position.z;
    const startY = mesh.position.y;
    const HOP_DURATION = 120; // ms per tile
    const HOP_HEIGHT = 0.5;
    let elapsed = 0;
    let lastTime = performance.now();
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      this.scene.onBeforeRenderObservable.remove(obs);
      clearTimeout(hopTimer);
      mesh.position.set(targetX, 0.35, targetZ);
      const lbl = this.tokenLabels.get(playerId);
      if (lbl) lbl.position.set(targetX, 1.1, targetZ);
      const ring2 = this.tokenRings.get(playerId);
      if (ring2) ring2.position.set(targetX, 0.12, targetZ);
      this.driveAnimation(playerId);
    };

    // Safety timer: advance to the next hop even if rAF is throttled.
    const hopTimer = setTimeout(finish, HOP_DURATION + 80);

    const obs = this.scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      elapsed += now - lastTime;
      lastTime = now;
      const t = Math.min(elapsed / HOP_DURATION, 1);
      mesh.position.x = startX + (targetX - startX) * t;
      mesh.position.z = startZ + (targetZ - startZ) * t;
      mesh.position.y = startY + HOP_HEIGHT * 4 * t * (1 - t);

      const lbl = this.tokenLabels.get(playerId);
      if (lbl) lbl.position.set(mesh.position.x, mesh.position.y + 0.8, mesh.position.z);
      const ring = this.tokenRings.get(playerId);
      if (ring) ring.position.set(mesh.position.x, 0.12, mesh.position.z);

      if (t >= 1) finish();
    });
  }

  // -------------------------------------------------------------------------
  // Dice cup
  // -------------------------------------------------------------------------
  private showCup() {
    if (this.diceCupMesh) this.diceCupMesh.setEnabled(true);
    this.cupVisible = true;
  }

  private hideCup() {
    if (this.diceCupMesh) this.diceCupMesh.setEnabled(false);
    this.cupVisible = false;
  }

  private async initDice(): Promise<void> {
    // Place the dice area in the felt corner opposite the card deck (+4,+4 in world).
    // With the z-flip the near corner is at +z, so we use CZ = +3.5 to stay visible.
    const CX = -3.5, CZ = 3.5;
    // Cup sits at a fixed XZ spot on the felt.  The lift animation moves it straight
    // up (Y only) and back — it never shifts horizontally.
    const CUP_BASE_Y = 0.5; // rests on the felt surface

    // Always build a clean procedural cup first (reliable > fancy OBJ).
    const fallbackCup = MeshBuilder.CreateCylinder(
      "diceCup",
      { diameterTop: 1.4, diameterBottom: 0.9, height: 1.8, tessellation: 16 },
      this.scene
    );
    fallbackCup.position.set(CX, CUP_BASE_Y + 0.9, CZ); // y = base + half-height so bottom rests on felt
    fallbackCup.isPickable = true; // click-to-roll
    const cupMat = new StandardMaterial("cupMatFb", this.scene);
    cupMat.diffuseColor = new Color3(0.22, 0.13, 0.05); // dark leather brown
    cupMat.emissiveColor = new Color3(0.06, 0.03, 0.01);
    cupMat.specularColor = new Color3(0.3, 0.2, 0.1);
    fallbackCup.material = cupMat;
    this.diceCupMesh = fallbackCup;

    // Try to load the OBJ cup; if it works and looks reasonable, replace the procedural one.
    try {
      const cupResult = await SceneLoader.ImportMeshAsync("", "/assets/", "DiceCup.obj", this.scene);
      const cupReal = cupResult.meshes.filter(
        (m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0
      );
      const cup = cupReal.length === 1
        ? cupReal[0]!
        : Mesh.MergeMeshes(cupReal, true, true, undefined, false, false);
      if (cup) {
        const ext = cup.getBoundingInfo().boundingBox.extendSize;
        const maxDim = Math.max(ext.x, ext.y, ext.z) * 2 || 1;
        // Only accept the OBJ if it has reasonable geometry.
        if (maxDim > 0.01 && maxDim < 50) {
          const objMat = new StandardMaterial("cupMatObj", this.scene);
          objMat.diffuseColor = new Color3(0.18, 0.12, 0.06);
          objMat.specularColor = new Color3(0.4, 0.3, 0.2);
          objMat.emissiveColor = new Color3(0.08, 0.05, 0.02);
          cup.material = objMat;
          // Scale to ~1.8 units tall (clearly bigger than a single die).
          cup.scaling.setAll(1.8 / maxDim);
          cup.name = "diceCupObj";
          cup.isPickable = true;
          cup.position.set(CX, CUP_BASE_Y + 0.9, CZ);
          // Retire the procedural fallback and use the OBJ.
          fallbackCup.dispose();
          this.diceCupMesh = cup;
        } else {
          cup.dispose();
        }
      } else {
        throw new Error("no cup mesh");
      }
    } catch {
      // Keep procedural cup — already assigned above.
    }

    // Ensure the cup's name is "diceCup" so the click picker finds it.
    if (this.diceCupMesh) this.diceCupMesh.name = "diceCup";

    // Pip dice — built procedurally as cubes with real pip-face textures.
    // They start HIDDEN below the felt (y < 0) and only become visible after
    // the cup lifts away.
    const DIE_SIZE = 0.45;
    for (let d = 0; d < 2; d++) {
      const dx = CX + (d === 0 ? -0.3 : 0.3);
      const dz = CZ + (d === 0 ? -0.12 : 0.12);
      const die = this.createPipDie(`die_${d}`, DIE_SIZE);
      die.isPickable = false;
      // Hide below the felt until the cup lifts away.
      die.position.set(dx, -2, dz);
      if (d === 0) this.dieMesh1 = die; else this.dieMesh2 = die;
    }
  }

  /** Draw a standard Western die pip pattern for `value` (1–6) onto a W×H canvas. */
  private drawPipFace(ctx: CanvasRenderingContext2D, value: number, W: number, H: number) {
    ctx.fillStyle = "#f4f4ee";
    ctx.fillRect(0, 0, W, H);
    // Thin border so adjacent faces read as separate.
    ctx.strokeStyle = "#ccccc4";
    ctx.lineWidth = W * 0.03;
    ctx.strokeRect(0, 0, W, H);
    ctx.fillStyle = "#161616";
    const r = W * 0.1;   // pip radius
    const m = W * 0.27;  // margin from edge to pip centre
    const c = W / 2;     // centre
    const dots: Array<[number, number]> = [];
    if (value === 1) { dots.push([c, c]); }
    if (value === 2) { dots.push([m, m], [W - m, H - m]); }
    if (value === 3) { dots.push([m, m], [c, c], [W - m, H - m]); }
    if (value === 4) { dots.push([m, m], [W - m, m], [m, H - m], [W - m, H - m]); }
    if (value === 5) { dots.push([m, m], [W - m, m], [c, c], [m, H - m], [W - m, H - m]); }
    if (value === 6) { dots.push([m, m], [W - m, m], [m, c], [W - m, c], [m, H - m], [W - m, H - m]); }
    for (const [px, py] of dots) {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Build a die cube with six DynamicTexture pip faces.
   * Babylon CreateBox sub-mesh face order: +X=0, -X=1, +Y=2, -Y=3, +Z=4, -Z=5.
   * Base pose (no rotation): +Y(top)=1, +X=2, +Z=3; opposite faces sum to 7 so
   * -Y=6, -X=5, -Z=4. orientDie() then rotates `value` onto +Y.
   */
  private createPipDie(name: string, size: number): Mesh {
    const box = MeshBuilder.CreateBox(name, { size }, this.scene);
    // pip value per face sub-mesh index [+X, -X, +Y, -Y, +Z, -Z]
    const faceValues = [2, 5, 1, 6, 3, 4];

    const multi = new MultiMaterial(`dieMat_${name}`, this.scene);
    const TEX = 128;
    for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
      const pipValue = faceValues[faceIdx]!;
      const tex = new DynamicTexture(`dieTex_${name}_f${faceIdx}`, { width: TEX, height: TEX }, this.scene, false);
      const fctx = tex.getContext() as CanvasRenderingContext2D;
      this.drawPipFace(fctx, pipValue, TEX, TEX);
      tex.update();
      const mat = new StandardMaterial(`dieFaceMat_${name}_f${faceIdx}`, this.scene);
      mat.diffuseTexture = tex;
      mat.specularColor = new Color3(0.12, 0.12, 0.12);
      mat.emissiveColor = new Color3(0.15, 0.15, 0.15);
      multi.subMaterials.push(mat);
    }
    box.material = multi;
    // Map each face sub-mesh to its own sub-material.
    if (box.subMeshes) {
      for (let i = 0; i < box.subMeshes.length; i++) {
        box.subMeshes[i]!.materialIndex = i;
      }
    }
    return box;
  }

  /** Rotate a die so `value` pips face up. Base pose: +Y=1, +X=2, +Z=3, -Z=4, -X=5, -Y=6. */
  private orientDie(mesh: AbstractMesh, value: number) {
    const H = Math.PI / 2;
    switch (value) {
      case 1: mesh.rotation.set(0, 0, 0); break;        // +Y=1 already up
      case 6: mesh.rotation.set(Math.PI, 0, 0); break;  // flip → -Y=6 up
      case 2: mesh.rotation.set(0, 0, -H); break;       // +X=2 → up
      case 5: mesh.rotation.set(0, 0, H); break;        // -X=5 → up
      case 3: mesh.rotation.set(-H, 0, 0); break;       // +Z=3 → up
      case 4: mesh.rotation.set(H, 0, 0); break;        // -Z=4 → up
    }
  }

  /** Cup lift / shake / descend / settle (reproduces DiceCup.playAnimation). */
  private playDiceAnimation(d1: number, d2: number) {
    if (this.diceAnimating) return;
    const cup = this.diceCupMesh;
    if (!cup) return;
    this.diceAnimating = true;

    const die1 = this.dieMesh1;
    const die2 = this.dieMesh2;

    // Fixed XZ position of the cup — the cup ONLY moves up/down, never sideways.
    const fixedCupX = cup.position.x;
    const fixedCupZ = cup.position.z;
    // baseY is the resting Y (bottom of cup on the felt).
    const baseY = cup.position.y;
    const LIFT = 2.0;          // how far the cup rises (Y only)
    const SHAKE_CYCLES = 5;
    const SHAKE_AMP = 0.28;

    let phase: "lift" | "shake" | "descend" | "settle" = "lift";
    let elapsed = 0;
    let lastTime = performance.now();

    // Keep dice hidden below the felt while the cup is up.
    if (die1) die1.position.y = -2;
    if (die2) die2.position.y = -2;

    const obs = this.scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      if (phase === "lift") {
        elapsed += dt;
        const t = Math.min(elapsed / 300, 1);
        // Only Y changes — X/Z stay fixed at the cup's rest spot.
        cup.position.set(fixedCupX, baseY + LIFT * t, fixedCupZ);
        cup.rotation.z = Math.sin(t * Math.PI * 2) * SHAKE_AMP * 0.5;
        if (t >= 1) { elapsed = 0; phase = "shake"; }
      } else if (phase === "shake") {
        elapsed += dt;
        const t = elapsed / (100 * SHAKE_CYCLES);
        cup.position.set(fixedCupX, baseY + LIFT, fixedCupZ); // stay at peak Y, no drift
        cup.rotation.z = Math.sin(t * Math.PI * 2 * SHAKE_CYCLES) * SHAKE_AMP;
        if (elapsed >= 100 * SHAKE_CYCLES * 4) { elapsed = 0; phase = "descend"; }
      } else if (phase === "descend") {
        elapsed += dt;
        const t = Math.min(elapsed / 300, 1);
        cup.position.set(fixedCupX, baseY + LIFT * (1 - t), fixedCupZ); // Y only, X/Z fixed
        cup.rotation.z = 0;
        if (t >= 1) {
          elapsed = 0;
          phase = "settle";
          // Cup vanishes; the two pip dice are revealed lying on the felt,
          // oriented so the rolled value faces up — dice were hidden until now.
          this.hideCup();
        }
      } else {
        // "settle" phase: dice drop onto the felt and bounce to a stop.
        // Dice appear at the cup's fixed XZ, spread slightly apart.
        if (die1) { die1.position.set(fixedCupX - 0.3, 0.25, fixedCupZ - 0.12); this.orientDie(die1, d1); }
        if (die2) { die2.position.set(fixedCupX + 0.3, 0.25, fixedCupZ + 0.12); this.orientDie(die2, d2); }
        elapsed += dt;
        const decay = 1 - Math.min(elapsed / 300, 1);
        const bounce = Math.abs(Math.sin((elapsed / 80) * Math.PI)) * 0.15 * decay;
        if (die1) die1.position.y = 0.25 + bounce;
        if (die2) die2.position.y = 0.25 + bounce;
        if (elapsed >= 400) {
          // Dice have settled — pips show the rolled value (no number overlay).
          this.scene.onBeforeRenderObservable.remove(obs);
          this.diceAnimating = false;
          // Release any token moves that were waiting for the dice to settle,
          // so figures only walk AFTER the dice animation completes.
          for (const [pid, move] of this.movePending) {
            this.enqueueMove(pid, move.from, move.to);
          }
          this.movePending.clear();
        }
      }
    });
  }

  /** Plays the dice animation and resolves when the dice have fully settled. */
  playDiceAnimationAsync(d1: number, d2: number): Promise<void> {
    if (this.diceAnimating) return Promise.resolve();
    // Total animation time: lift(300) + shake(400) + descend(300) + settle(400) = 1400 ms.
    // We use a timer-based resolve that mirrors the animation phases so the promise
    // resolves even when the render loop is throttled (e.g. in headless tests).
    const ANIM_TOTAL_MS = 1450;
    this.playDiceAnimation(d1, d2);
    return new Promise<void>((resolve) => {
      // Also watch the render loop (real browser): resolves as soon as the flag clears.
      const check = this.scene.onBeforeRenderObservable.add(() => {
        if (!this.diceAnimating) {
          this.scene.onBeforeRenderObservable.remove(check);
          clearTimeout(timer);
          resolve();
        }
      });
      // Safety timer: resolves even if rAF is throttled (headless/background tabs).
      const timer = setTimeout(() => {
        this.scene.onBeforeRenderObservable.remove(check);
        this.diceAnimating = false;
        resolve();
      }, ANIM_TOTAL_MS + 200);
    });
  }

  private showDiceResultLabel(d1: number, d2: number, cx: number, cz: number) {
    if (this.diceResultLabel) { this.diceResultLabel.dispose(); this.diceResultLabel = null; }
    const tex = new DynamicTexture("diceResultTex", { width: 128, height: 32 }, this.scene, false);
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, 128, 32);
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${d1} + ${d2} = ${d1 + d2}`, 64, 16);
    tex.update();

    const plane = MeshBuilder.CreatePlane("diceResultPlane", { width: 1.2, height: 0.3 }, this.scene);
    plane.position.set(cx, 1.5, cz);
    plane.billboardMode = 7;
    const mat = new StandardMaterial("diceResultMat", this.scene);
    mat.diffuseTexture = tex;
    mat.backFaceCulling = false;
    mat.emissiveColor = new Color3(1, 1, 1);
    plane.material = mat;
    this.diceResultLabel = plane;

    let elapsed = 0;
    let lastTime = performance.now();
    const obs = this.scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      elapsed += now - lastTime;
      lastTime = now;
      if (elapsed > 2000) {
        plane.dispose();
        this.diceResultLabel = null;
        this.scene.onBeforeRenderObservable.remove(obs);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Active-player highlight (feature #3)
  // A pulsing outer ring placed BELOW the active token to make the current
  // player unmistakable. This is purely additive — it never touches existing
  // token/label/ring/animation code.
  // -------------------------------------------------------------------------
  setActivePlayer(playerId: string | null): void {
    // No-op if already tracking this player (avoids recreating each state tick)
    if (playerId === this.activeHighlightPlayerId) {
      // Still update position in case the token moved
      this._updateActiveHighlightPosition();
      return;
    }

    // Tear down any previous highlight
    if (this.activeHighlightObs) {
      this.scene.onBeforeRenderObservable.remove(this.activeHighlightObs);
      this.activeHighlightObs = null;
    }
    if (this.activeHighlightMesh) {
      this.activeHighlightMesh.dispose();
      this.activeHighlightMesh = null;
    }

    this.activeHighlightPlayerId = playerId;
    if (!playerId) return;

    // Create a large pulsing disc under the active token
    const disc = MeshBuilder.CreateDisc(
      "activeHighlight",
      { radius: 0.55, tessellation: 32 },
      this.scene
    );
    disc.rotation.x = Math.PI / 2; // lay flat
    disc.isPickable = false;

    const mat = new StandardMaterial("activeHighlightMat", this.scene);
    mat.diffuseColor = new Color3(1, 1, 0.2);
    mat.emissiveColor = new Color3(0.9, 0.9, 0.1);
    mat.specularColor = new Color3(0, 0, 0);
    mat.alpha = 0.55;
    mat.backFaceCulling = false;
    disc.material = mat;
    this.activeHighlightMesh = disc;

    // Position it immediately
    this._updateActiveHighlightPosition();

    // Pulse: vary alpha & scale over time
    let elapsed = 0;
    let lastTime = performance.now();
    this.activeHighlightObs = this.scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      elapsed += now - lastTime;
      lastTime = now;
      if (!this.activeHighlightMesh) return;
      const pulse = 0.5 + 0.5 * Math.sin((elapsed / 600) * Math.PI);
      (this.activeHighlightMesh.material as StandardMaterial).alpha = 0.25 + 0.45 * pulse;
      const s = 1.0 + 0.15 * pulse;
      this.activeHighlightMesh.scaling.setAll(s);
      // Keep position in sync with moving token
      this._updateActiveHighlightPosition();
    });
  }

  private _updateActiveHighlightPosition(): void {
    const mesh = this.activeHighlightMesh;
    const pid = this.activeHighlightPlayerId;
    if (!mesh || !pid) return;
    const token = this.tokenMeshes.get(pid);
    if (token) {
      mesh.position.set(token.position.x, 0.05, token.position.z);
    }
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function cornerLabel(pos: number, type: string): string {
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

// Silence unused import (needed for side-effects / type resolution)
void drawWrappedText;
