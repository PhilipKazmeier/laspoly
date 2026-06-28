import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  PointLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Texture,
  DynamicTexture,
  AbstractMesh,
  SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders/OBJ";
import { getBoard, listBoards, JAIL_POS } from "@laspoly/shared";
import type { GameState } from "@laspoly/shared";

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

// ---------------------------------------------------------------------------
// Coordinate helpers (mirrored from Board.java, scaled 20/1200 ≈ 0.01667)
// ---------------------------------------------------------------------------
const SCALE = 20 / 1200; // 1 Java unit → 0.01667 Babylon units

// Regular tile: 100 J wide × 150 J deep
const TILE_W = 100 * SCALE; // ≈ 1.667
const TILE_D = 150 * SCALE; // ≈ 2.5
// Corner tile: 150 × 150
const CORNER = 150 * SCALE; // ≈ 2.5

/** World XZ for the centre of tile at board position [0..40]. */
function tileXZ(pos: number): [number, number] {
  if (pos === JAIL_POS) return [0, 0]; // jailed tokens → cage in felt centre

  // Corners
  if (pos === 0) return [-525 * SCALE, -525 * SCALE]; // GO       bottom-left
  if (pos === 10) return [525 * SCALE, -525 * SCALE]; // FreePark bottom-right
  if (pos === 20) return [525 * SCALE, 525 * SCALE]; // Casino   top-right
  if (pos === 30) return [-525 * SCALE, 525 * SCALE]; // GoJail   top-left

  // Bottom edge  (pos 1–9):  z fixed, x varies left→right
  if (pos < 10) {
    const x = (-600 + pos * 100 - 50 + 150) * SCALE;
    return [x, -525 * SCALE];
  }
  // Right edge   (pos 11–19): x fixed, z varies top→bottom (in Java +z is "up")
  if (pos < 20) {
    const z = (-600 + (pos - 10) * 100 - 50 + 150) * SCALE;
    return [525 * SCALE, z];
  }
  // Top edge     (pos 21–29): z fixed, x varies right→left
  if (pos < 30) {
    const x = (600 - (pos - 20) * 100 + 50 - 150) * SCALE;
    return [x, 525 * SCALE];
  }
  // Left edge    (pos 31–39): x fixed, z varies bottom→top
  const z = (600 - (pos - 30) * 100 + 50 - 150) * SCALE;
  return [-525 * SCALE, z];
}

/** Rotation angle (degrees around Y) for a tile at this position (from Board.java). */
function getFieldAngle(pos: number): number {
  if (pos <= 10) return 0;
  if (pos <= 20) return 270;
  if (pos <= 30) return 180;
  return 90;
}

/**
 * For a tile at `pos`, returns the XZ offset FROM tile centre toward the OUTER
 * edge of the board, so the colour-bar sits on that outer edge.
 */
function outerDirection(pos: number): [number, number] {
  if (pos <= 10) return [0, -1]; // bottom edge  → outer is –z
  if (pos <= 20) return [1, 0]; //  right edge   → outer is +x
  if (pos <= 30) return [0, 1]; //  top edge     → outer is +z
  return [-1, 0]; //              left edge    → outer is –x
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
  // Car OBJ models (player tokens), keyed by car index 1-5
  private carModels: Map<number, AbstractMesh[]> = new Map();
  private carsLoaded = false;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);

    // ---- Camera ------------------------------------------------------------
    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 3.2,
      32,
      Vector3.Zero(),
      this.scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 15;
    camera.upperRadiusLimit = 80;
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.lowerBetaLimit = 0.1;

    // ---- Lighting ----------------------------------------------------------
    const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.65;
    const key = new PointLight("key", new Vector3(0, 20, -5), this.scene);
    key.intensity = 0.55;

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
        const meshes = result.meshes;
        // Scale down (SketchUp / Blender units → Babylon; cars are ~1 m but feel huge)
        meshes.forEach((m) => {
          m.scaling.setAll(0.008);
          m.setEnabled(false);
          m.isPickable = false;
        });
        this.carModels.set(i, meshes);
      } catch {
        // Silently skip; sphere fallback used in update()
      }
    }
    this.carsLoaded = true;
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

  /** Adds the group-coloured bar on the OUTER edge of a property tile. */
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

    // In local space, the bar sits at z = –(tileD/2 - BAR_DEPTH/2) i.e. the outer (–z) edge.
    // After parent rotation this maps to the correct world side.
    // But since Babylon has no parent hierarchy here we compute world position directly.
    // The tile's local –z edge in world space:
    const localOffsetZ = -(tileD / 2 - BAR_DEPTH / 2); // in tile-local space
    const rad = (angleDeg * Math.PI) / 180;
    const worldOffsetX = localOffsetZ * Math.sin(rad);
    const worldOffsetZ = localOffsetZ * Math.cos(rad);

    // Adjust: outer direction tells us which world side is "outer".
    // For angle=0 (bottom edge), outerDir=(0,-1), localOffsetZ is –z in tile space,
    // which maps to –z in world space → matches.
    // The formula localOffsetZ * sin(rad), cos(rad) gives (0, localOffsetZ) for angle=0 → correct.
    // For angle=270 (right edge), rad=3π/2: sin=–1, cos≈0 → worldX= localOffsetZ * –1 = +halfD,
    // worldZ=0.  The outer direction for right edge is +x.  We need worldX = +halfD.  ✓

    bar.position.set(cx + worldOffsetX, 0.11, cz + worldOffsetZ);
    bar.rotation.y = rad;

    const barMat = new StandardMaterial(`barMat_${pos}`, this.scene);
    barMat.diffuseColor = hexToColor3(colorHex);
    bar.material = barMat;

    // Suppress unused variable warnings
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
    const TEX_W = 256;
    const TEX_H = isCorner ? 256 : 128;

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
      ctx.font = "bold 40px Arial";
      ctx.fillText(label, TEX_W / 2, TEX_H / 2);
    } else {
      // Street / station / attraction: wrapped text, rotated 90° in texture space
      // so it reads left-to-right when the label plane is on the outer half of the tile.
      // We draw top→bottom rotated 90° CCW so reading from outside is natural.
      ctx.save();
      ctx.translate(TEX_W / 2, TEX_H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const FONT_SIZE = 16;
      const MAX_W = TEX_H - 8; // label uses the short dimension for max-width
      ctx.font = `bold ${FONT_SIZE}px Arial`;
      ctx.fillStyle = "#111";
      // Measure and auto-shrink if needed
      const totalWidth = ctx.measureText(name).width;
      const finalFont = totalWidth <= MAX_W ? `bold ${FONT_SIZE}px Arial` : `bold 12px Arial`;
      ctx.font = finalFont;

      // Wrap text
      const LINE_H = 18;
      const words = name.split(" ");
      const lineMaxW = TEX_W - 10;
      const lines: string[] = [];
      let current = "";
      for (const w of words) {
        const test = current ? `${current} ${w}` : w;
        if (ctx.measureText(test).width > lineMaxW && current) {
          lines.push(current);
          current = w;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);

      const startY = -((lines.length - 1) * LINE_H) / 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i]!, 0, startY + i * LINE_H);
      }

      ctx.restore();
    }

    tex.update();

    // Plane on top of the tile
    const planeW = isCorner ? CORNER * 0.9 : TILE_W * 0.88;
    const planeH = isCorner ? CORNER * 0.9 : TILE_D * 0.88;
    const label = MeshBuilder.CreatePlane(
      `label_${pos}`,
      { width: planeW, height: planeH },
      this.scene
    );
    label.rotation.x = Math.PI / 2; // lie flat
    label.rotation.y = (angleDeg * Math.PI) / 180;
    label.position.set(cx, 0.095, cz);

    const labelMat = new StandardMaterial(`labelMat_${pos}`, this.scene);
    labelMat.diffuseTexture = tex;
    labelMat.backFaceCulling = false;
    labelMat.emissiveColor = new Color3(0.05, 0.05, 0.05); // a touch of self-lit so text is legible
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
    const meshes = this.carModels.get(idx);
    if (!meshes || meshes.length === 0) return undefined;

    const root = meshes[0];
    if (!root) return undefined;
    const clone = root.clone(`token_${playerId}`, null);
    if (!clone) return undefined;
    clone.setEnabled(true);
    clone.scaling.setAll(0.008);
    // Tint by overriding material
    const mat = new StandardMaterial(`tokenMat_${playerId}`, this.scene);
    mat.diffuseColor = color;
    mat.specularColor = new Color3(0.5, 0.5, 0.5);
    clone.material = mat;
    return clone;
  }

  /** Fallback token: a coloured cylinder (clearly visible on tile). */
  private makeFallbackToken(playerId: string, color: Color3): AbstractMesh {
    const mesh = MeshBuilder.CreateCylinder(
      `token_${playerId}`,
      { diameter: 0.55, height: 0.65, tessellation: 8 },
      this.scene
    );
    const mat = new StandardMaterial(`tokenMat_${playerId}`, this.scene);
    mat.diffuseColor = color;
    mat.emissiveColor = color.scale(0.3); // glow a bit so tokens stand out
    mesh.material = mat;
    return mesh;
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
  // Public update (called on every GameState message)
  // -------------------------------------------------------------------------
  update(state: GameState, _myId: string | null) {
    this.drawBoard(state.boardId);

    // Remove tokens for players who left / died
    for (const [id, mesh] of this.tokenMeshes) {
      if (!state.players.find((p) => p.id === id)) {
        mesh.dispose();
        this.tokenMeshes.delete(id);
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
        if (old) {
          old.dispose();
          this.tokenMeshes.delete(player.id);
        }
        continue;
      }

      const [x, z] = tileXZ(player.position);
      const group = byPos.get(player.position) ?? [];
      const i = group.indexOf(player.id);
      const offsetX = (i % 2) * 0.38 - 0.19;
      const offsetZ = Math.floor(i / 2) * 0.38 - 0.19;

      let mesh = this.tokenMeshes.get(player.id);
      if (!mesh) {
        const colorHex = player.color.startsWith("#") ? player.color : `#${player.color}`;
        const color = hexToColor3(colorHex);
        const carIdx = (state.players.indexOf(player) % 5) + 1;

        if (this.carsLoaded) {
          mesh = this.cloneCarToken(carIdx, color, player.id) ?? this.makeFallbackToken(player.id, color);
        } else {
          mesh = this.makeFallbackToken(player.id, color);
        }
        this.tokenMeshes.set(player.id, mesh);
      }

      mesh.position.set(x + offsetX, 0.25, z + offsetZ);
    }

    this.updateBuildings(state);
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
