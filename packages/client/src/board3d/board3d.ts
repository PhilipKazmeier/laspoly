// ---------------------------------------------------------------------------
// board3d/board3d.ts — the Board3D orchestrator: scene/camera/lights/table,
// player-token management and movement animation, active-player highlight,
// per-player on-board displays, and delegation to DiceRig (dice cup + roll),
// BuildingRenderer (buildings + ownership markers) and tiles.ts (static
// geometry). Public API is unchanged from the original single-file board3d.ts.
// ---------------------------------------------------------------------------
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
  DynamicTexture,
  AbstractMesh,
  Mesh,
  SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders/OBJ";
import { getBoard, listBoards, JAIL_POS } from "@laspoly/shared";
import type { GameState, FormattedEvent } from "@laspoly/shared";
import { getTheme } from "../theme.js";
import { getQuality } from "../quality.js";
import {
  ThemePalette,
  THEMES,
  GROUP_COLORS,
  PLAYER_COLOR_HEX,
  STATION_POSITIONS,
  playerColor3,
  brighten,
  tileXZ,
  TOKEN_Y,
  LABEL_Y,
  RING_Y,
  HOP_DURATION_MS,
  HOP_HEIGHT,
} from "./constants.js";
import { drawBoard, makeWoodTexture } from "./tiles.js";
import { DiceRig } from "./dice.js";
import { BuildingRenderer } from "./buildings.js";
import { Effects } from "./effects.js";

export class Board3D {
  private engine: Engine;
  private scene: Scene;
  private tokenMeshes: Map<string, AbstractMesh> = new Map();
  private currentBoardId: string | null = null;
  private readonly palette: ThemePalette = THEMES[getTheme()];
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
  private dice: DiceRig;
  private buildings: BuildingRenderer;
  private effects: Effects;
  private camera!: ArcRotateCamera;
  private tokenRings: Map<string, AbstractMesh> = new Map();
  // Interaction hooks
  private rollHandler: (() => void) | null = null;
  private tileClickHandler: ((pos: number) => void) | null = null;
  // Active-player highlight ring (feature #3)
  private activeHighlightMesh: AbstractMesh | null = null;
  private activeHighlightPlayerId: string | null = null;
  private activeHighlightObs: ReturnType<typeof this.scene.onBeforeRenderObservable.add> | null = null;
  // Resolvers for animateMoveAsync
  private moveResolvers: Map<string, () => void> = new Map();
  // Per-player deed/money displays
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

    // Neon-Vegas: midnight scene background so any edge beyond the table reads
    // as the same dark world as the HUD (matches --bg-0 #0a0913).
    this.scene.clearColor = this.palette.clear;

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
    key.intensity = this.palette.keyIntensity;
    key.specular = new Color3(0.1, 0.1, 0.1);
    if (this.palette.keyDiffuse) key.diffuse = this.palette.keyDiffuse;
    // Soft fill from straight above so the board is evenly lit when viewed top-down.
    const fill = new DirectionalLight("fill", new Vector3(0, -1, 0), this.scene);
    fill.specular = new Color3(0, 0, 0);
    // Cool the ambient toward the violet world tone (neon); classic leaves it white.
    if (this.palette.ambientDiffuse) ambient.diffuse = this.palette.ambientDiffuse;

    // ---- Post-processing / glow / shadows (quality-gated) -------------------
    this.effects = new Effects(this.scene, getTheme(), getQuality());
    this.effects.initPipeline(this.camera);
    this.effects.initGlow();
    this.effects.initShadows();
    this.effects.initEnvironment();
    // The shadow light adds ~0.35 directional intensity, so dim the flat fill
    // to keep overall board brightness unchanged. Low quality keeps the
    // original fill (no shadow light exists there).
    fill.intensity = getQuality() === "high" ? 0.1 : 0.25;

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
    // Large enough that the wood fills the view in both camera angles (bug 8a:
    // the table edge previously revealed the dark scene background).
    const table = MeshBuilder.CreateBox(
      "table",
      { width: 48, height: 0.5, depth: 48 },
      this.scene
    );
    table.position.y = -0.45;
    const tableMat = new StandardMaterial("tableMat", this.scene);
    // Classic: procedural wood texture. Neon: flat dark colour (one continuous
    // surface; the tiled wood showed seams and clashed with the glass HUD).
    if (this.palette.tableWood) {
      tableMat.diffuseTexture = makeWoodTexture(this.scene);
      // Tight specular highlights read as varnish on the wood.
      tableMat.specularPower = 64;
    } else {
      tableMat.diffuseColor = this.palette.tableDiffuse;
    }
    tableMat.specularColor = this.palette.tableSpecular;
    table.material = tableMat;
    this.effects.addShadowReceiver(table);

    // Neon: faint self-lit gold rim around the table edge (glow-registered).
    if (!this.palette.tableWood) {
      const RIM_W = 0.35, RIM_H = 0.1, T = 48;
      const rimParts: Mesh[] = [];
      for (const sz of [-1, 1]) {
        const strip = MeshBuilder.CreateBox(`tableRim_z${sz}`, { width: T, height: RIM_H, depth: RIM_W }, this.scene);
        strip.position.set(0, -0.2, sz * (T / 2 - RIM_W / 2));
        rimParts.push(strip);
      }
      for (const sx of [-1, 1]) {
        const strip = MeshBuilder.CreateBox(`tableRim_x${sx}`, { width: RIM_W, height: RIM_H, depth: T - 2 * RIM_W }, this.scene);
        strip.position.set(sx * (T / 2 - RIM_W / 2), -0.2, 0);
        rimParts.push(strip);
      }
      const rim = Mesh.MergeMeshes(rimParts, true, true, undefined, false, false);
      if (rim) {
        const rimMat = new StandardMaterial("tableRimMat", this.scene);
        rimMat.diffuseColor = new Color3(0.2, 0.16, 0.05);
        rimMat.emissiveColor = new Color3(0.35, 0.28, 0.08);
        rimMat.specularColor = new Color3(0, 0, 0);
        rim.material = rimMat;
        rim.isPickable = false;
        this.effects.addGlowMesh(rim);
      }
    }

    // ---- Initial board -------------------------------------------------------
    const boards = listBoards();
    if (boards.length > 0 && boards[0]) {
      this.drawBoardOnce(boards[0].id);
    }

    // Preload car models (async, best-effort)
    this.preloadCarModels();

    // Dice cup + dice
    this.dice = new DiceRig(this.scene, this.palette, this.effects);
    // Buildings + ownership markers
    this.buildings = new BuildingRenderer(this.scene, this.effects);

    this.engine.runRenderLoop(() => this.scene.render());
    window.addEventListener("resize", () => this.engine.resize());
  }

  /** Draw the static board geometry exactly once per board id. */
  private drawBoardOnce(boardId: string) {
    if (this.currentBoardId === boardId) return;
    this.currentBoardId = boardId;
    drawBoard(this.scene, this.palette, getBoard(boardId));
    // Large static surfaces receive token/building shadows (no-op on low quality).
    for (const m of this.scene.meshes) {
      if (m.name === "boardBase" || m.name === "felt" || m.name.startsWith("tile_")) {
        this.effects.addShadowReceiver(m);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Asset preloading
  // -------------------------------------------------------------------------
  private async preloadCarModels(): Promise<void> {
    // figureIndex 0-4 → car1..car5, 5 → police. Keyed by figureIndex.
    const files = ["car1.obj", "car2.obj", "car3.obj", "car4.obj", "car5.obj", "police.obj"];
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await SceneLoader.ImportMeshAsync("", "/assets/", files[i]!, this.scene);
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
        merged.name = `carTemplate_${i}`; // i = figureIndex 0-5
        merged.setEnabled(false);
        merged.isPickable = false;
        this.carModels.set(i, merged);
      } catch {
        // Silently skip; cylinder fallback used in rebuildTokens()
      }
    }
    this.carsLoaded = true;
    // If a state arrived before models finished loading, rebuild tokens now
    if (this.lastState) {
      this.rebuildTokens(this.lastState, this.lastMyId);
    }
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
    this.effects.addShadowCaster(clone);
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
    this.effects.addShadowCaster(mesh);
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

    // Half-size billboard so names read small and uniform across all tokens (bug 1).
    const plane = MeshBuilder.CreatePlane(`lbl_${playerId}`, { width: 0.45, height: 0.11 }, this.scene);
    plane.billboardMode = 7;
    const mat = new StandardMaterial(`lblMat_${playerId}`, this.scene);
    mat.diffuseTexture = tex;
    mat.backFaceCulling = false;
    mat.emissiveColor = new Color3(1, 1, 1);
    plane.material = mat;
    plane.isPickable = false;
    this.tokenLabels.set(playerId, plane);
  }

  /** Bright halo ring under a token so each player's colour is unmistakable. */
  private ensureTokenRing(playerId: string, color: string): AbstractMesh {
    let ring = this.tokenRings.get(playerId);
    if (!ring) {
      const ringColor = brighten(playerColor3(color));
      ring = MeshBuilder.CreateTorus(
        `ring_${playerId}`,
        { diameter: 0.55, thickness: 0.12, tessellation: 16 },
        this.scene
      );
      const ringMat = new StandardMaterial(`ringMat_${playerId}`, this.scene);
      // Emissive carries the hue (so it pops regardless of lighting angle),
      // with a touch of diffuse for shading. specular off to avoid white blowout.
      ringMat.diffuseColor = ringColor.scale(0.3);
      ringMat.emissiveColor = ringColor;
      ringMat.specularColor = new Color3(0, 0, 0);
      ring.material = ringMat;
      ring.isPickable = false;
      // NOT glow-registered: the halo glow bleeds over the car token and makes
      // it unreadable (verified by screenshot). The emissive material already
      // makes the ring pop; glow stays reserved for cup + ownership frames.
      this.tokenRings.set(playerId, ring);
    }
    return ring;
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
        const carIdx = player.figureIndex ?? 0;
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
        mesh.position.set(targetX, TOKEN_Y, targetZ);
        const lbl = this.tokenLabels.get(player.id);
        if (lbl) lbl.position.set(targetX, LABEL_Y, targetZ);
        const ring = this.ensureTokenRing(player.id, player.color);
        ring.position.set(targetX, RING_Y, targetZ);
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
    const carIdx = player.figureIndex ?? 0;
    const mesh = this.carsLoaded
      ? (this.cloneCarToken(carIdx, color, playerId) ?? this.makeFallbackToken(playerId, color))
      : this.makeFallbackToken(playerId, color);
    this.tokenMeshes.set(playerId, mesh);
    if (!this.tokenLabels.has(playerId)) {
      this.addTokenLabel(playerId, player.name, player.color);
    }
    const [x, z] = tileXZ(player.position);
    mesh.position.set(x, TOKEN_Y, z);
    const lbl = this.tokenLabels.get(playerId);
    if (lbl) lbl.position.set(x, LABEL_Y, z);
    const ring = this.ensureTokenRing(playerId, player.color);
    ring.position.set(x, RING_Y, z);
  }

  /**
   * Snap a player's token straight to a tile with no walk animation. Used when a
   * player buys out of jail: they reappear on the P field rather than walking
   * there (bug 8b). Ensures the token exists first.
   */
  snapPlayerToTile(playerId: string, pos: number, state: GameState, myId: string | null): void {
    this.ensureTokenExists(playerId, state, myId);
    this.prevPositions.set(playerId, pos);
    this.snapTokenToTile(playerId, pos);
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
  // Public state application (called by the serial state queue in main.ts)
  // -------------------------------------------------------------------------

  /** Apply all non-animation visual updates (buildings, ownership, HUD, board). Called after animation resolves. */
  applyVisuals(state: GameState, myId: string | null): void {
    this.lastState = state;
    this.lastMyId = myId;
    this.drawBoardOnce(state.boardId);
    this.rebuildTokens(state, myId);
    this.buildings.update(state);
    this.updatePlayerDisplays(state);
  }

  /** Instantly snap all tokens to positions in `state` (reconnect / fast-forward). */
  snapToState(state: GameState, myId: string | null): void {
    // Clear any in-flight animations
    this.moveQueues.clear();
    this.moveAnimating.clear();
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
   * FormattedEvent only carries {key, text, playerId}; movement and dice data
   * are read from the authoritative GameState by the serial state queue. This
   * hook is retained as the documented entry point for event-keyed board
   * effects and is intentionally a no-op for now.
   */
  handleEvents(_events: FormattedEvent[]) {
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
    const needsRoll = (s: GameState) => s.phase === "awaiting-roll" || s.phase === "awaiting-casino";
    if (!prev) {
      if (needsRoll(state)) this.dice.showCup();
      return;
    }
    // Bring the cup back at the start of a roll OR when entering the casino (which
    // also needs a manual roll, bug 2-8).
    if (
      needsRoll(state) &&
      (prev.phase !== state.phase || prev.currentPlayerIndex !== state.currentPlayerIndex)
    ) {
      this.dice.showCup();
    }
  }

  /**
   * Plays the dice animation and resolves EXACTLY when the dice have settled
   * (see DiceRig.playDiceAnimationAsync for the safety-timeout contract).
   */
  playDiceAnimationAsync(d1: number, d2: number): Promise<void> {
    return this.dice.playDiceAnimationAsync(d1, d2);
  }

  // -------------------------------------------------------------------------
  // Token movement
  // -------------------------------------------------------------------------
  private enqueueMove(playerId: string, from: number, to: number) {
    const RING = 40;

    // Into jail: the cage sits at the felt centre and JAIL_POS (40) is not a real
    // ring tile, so slide straight to the cage instead of walking tiles (walking
    // toward 40 never terminates on the ring). Callers that want the "walk onto
    // the Go-To-Jail field first" effect pass that as a separate prior move.
    if (to === JAIL_POS) {
      const existing = this.moveQueues.get(playerId) ?? [];
      this.moveQueues.set(playerId, [...existing, [0, 0]]);
      if (!this.moveAnimating.has(playerId)) this.driveAnimation(playerId);
      return;
    }

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
      const capMs = hops * HOP_DURATION_MS + 1800;
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
    const [x, z] = pos === JAIL_POS ? [0, 0] : tileXZ(pos);
    const mesh = this.tokenMeshes.get(playerId);
    if (mesh) { mesh.position.set(x, TOKEN_Y, z); mesh.rotation.y = 0; }
    const lbl = this.tokenLabels.get(playerId);
    if (lbl) lbl.position.set(x, LABEL_Y, z);
    const ring = this.tokenRings.get(playerId);
    if (ring) ring.position.set(x, RING_Y, z);
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
        if (lbl) lbl.position.set(destX, LABEL_Y, destZ);
        if (ring) ring.position.set(destX, RING_Y, destZ);
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
          if (ring) ring.position.set(destX, RING_Y, destZ);
          if (t >= 1) finish();
        }
      });
    });
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
      // Resolve FIRST, then squash — the landing bounce is pure garnish and
      // must never delay the serial state queue.
      this.playLandingSquash(mesh);
      return;
    }

    this.moveAnimating.add(playerId);
    const next = queue.shift()!;
    const targetX = next[0];
    const targetZ = next[1];
    this.moveQueues.set(playerId, queue);

    // Speed ramp: long moves accelerate mid-run (the safety cap in
    // animateMoveAsync assumes HOP_DURATION_MS per hop, so ramping only ever
    // makes hops FASTER — the cap stays valid).
    const hopMs = queue.length >= 5 ? 85 : HOP_DURATION_MS;

    const startX = mesh.position.x;
    const startZ = mesh.position.z;
    const startY = mesh.position.y;
    let elapsed = 0;
    let lastTime = performance.now();
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      this.scene.onBeforeRenderObservable.remove(obs);
      clearTimeout(hopTimer);
      mesh.position.set(targetX, TOKEN_Y, targetZ);
      const lbl = this.tokenLabels.get(playerId);
      if (lbl) lbl.position.set(targetX, LABEL_Y, targetZ);
      const ring2 = this.tokenRings.get(playerId);
      if (ring2) ring2.position.set(targetX, RING_Y, targetZ);
      this.driveAnimation(playerId);
    };

    // Safety timer: advance to the next hop even if rAF is throttled.
    const hopTimer = setTimeout(finish, hopMs + 80);

    const obs = this.scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      elapsed += now - lastTime;
      lastTime = now;
      const t = Math.min(elapsed / hopMs, 1);
      // Ease-in-out on the horizontal glide; the vertical arc keeps raw t so
      // the hop peaks mid-stride.
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      mesh.position.x = startX + (targetX - startX) * e;
      mesh.position.z = startZ + (targetZ - startZ) * e;
      mesh.position.y = startY + HOP_HEIGHT * 4 * t * (1 - t);

      const lbl = this.tokenLabels.get(playerId);
      if (lbl) lbl.position.set(mesh.position.x, mesh.position.y + 0.8, mesh.position.z);
      const ring = this.tokenRings.get(playerId);
      if (ring) ring.position.set(mesh.position.x, RING_Y, mesh.position.z);

      if (t >= 1) finish();
    });
  }

  /**
   * Landing squash: a quick scale dip when a token finishes its walk.
   * Fire-and-forget garnish with its own safety reset — never awaited.
   */
  private playLandingSquash(mesh: AbstractMesh): void {
    const SQUASH_MS = 140;
    const origY = mesh.scaling.y; // car tokens carry a normalization scale
    let elapsed = 0;
    let lastTime = performance.now();
    let done = false;
    // eslint-disable-next-line prefer-const
    let obs: ReturnType<typeof this.scene.onBeforeRenderObservable.add>;
    const finish = () => {
      if (done) return;
      done = true;
      this.scene.onBeforeRenderObservable.remove(obs);
      clearTimeout(safety);
      mesh.scaling.y = origY;
    };
    const safety = setTimeout(finish, SQUASH_MS + 200);
    obs = this.scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      elapsed += now - lastTime;
      lastTime = now;
      const t = Math.min(elapsed / SQUASH_MS, 1);
      // Dip to 0.82 at mid-squash, back to 1 (parabolic).
      const dip = 1 - 0.18 * 4 * t * (1 - t);
      mesh.scaling.y = origY * dip;
      if (t >= 1) finish();
    });
  }

  // -------------------------------------------------------------------------
  // Active-player highlight (feature #3)
  // A hovering marker placed ABOVE the active token to make the current
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

    // Floating downward-pointing cone hovering ABOVE the active token (bug 2-7).
    // (Replaces the old flat disc under the token, which also showed under jailed
    // players in the cage — that under-token indicator is gone now.)
    const cone = MeshBuilder.CreateCylinder(
      "activeHighlight",
      { diameterTop: 0, diameterBottom: 0.34, height: 0.42, tessellation: 16 },
      this.scene
    );
    cone.rotation.x = Math.PI; // apex points DOWN toward the token
    cone.isPickable = false;

    const mat = new StandardMaterial("activeHighlightMat", this.scene);
    mat.diffuseColor = new Color3(1, 0.85, 0.1);
    mat.emissiveColor = new Color3(0.95, 0.8, 0.05);
    mat.specularColor = new Color3(0, 0, 0);
    mat.backFaceCulling = false;
    cone.material = mat;
    this.activeHighlightMesh = cone;

    // Position it immediately
    this._updateActiveHighlightPosition();

    // Bob up/down so it reads as a hovering marker.
    let elapsed = 0;
    let lastTime = performance.now();
    this.activeHighlightObs = this.scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      elapsed += now - lastTime;
      lastTime = now;
      this._updateActiveHighlightPosition(elapsed);
    });
  }

  private _updateActiveHighlightPosition(elapsed = 0): void {
    const mesh = this.activeHighlightMesh;
    const pid = this.activeHighlightPlayerId;
    if (!mesh || !pid) return;
    const token = this.tokenMeshes.get(pid);
    if (token) {
      const bob = 0.12 * Math.sin((elapsed / 500) * Math.PI);
      mesh.position.set(token.position.x, token.position.y + 1.05 + bob, token.position.z);
      mesh.rotation.y = elapsed / 600; // slow spin
    }
  }
}
