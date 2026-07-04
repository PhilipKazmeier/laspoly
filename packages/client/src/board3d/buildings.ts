// ---------------------------------------------------------------------------
// board3d/buildings.ts — building meshes (houses/hotel/factory) and per-tile
// ownership frames, with signature-based caching: a tile's meshes are only
// rebuilt when its building/ownership state actually changes (previously every
// state update disposed and recreated everything).
//
// update() returns the positions whose buildings changed this update — the
// drop-in placement animation consumes that list.
// ---------------------------------------------------------------------------
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  DynamicTexture,
  AbstractMesh,
  Mesh,
  SceneLoader,
  Scene,
} from "@babylonjs/core";
import type { GameState } from "@laspoly/shared";
import {
  TILE_W,
  TILE_D,
  tileXZ,
  getFieldAngle,
  outerDirection,
  playerColor3,
  brighten,
} from "./constants.js";
import type { Effects } from "./effects.js";

interface CachedEntry {
  sig: string;
  meshes: AbstractMesh[];
}

export class BuildingRenderer {
  private buildingCache: Map<number, CachedEntry> = new Map();
  private ownershipCache: Map<number, CachedEntry> = new Map();
  // Lazy-built templates, cloned per tile.
  private templates: Map<string, Mesh> = new Map();
  private materials: Map<string, StandardMaterial> = new Map();
  private houseObjTemplate: Mesh | null = null;

  constructor(private scene: Scene, private effects?: Effects) {
    // Best-effort: a nicer house model exists in assets; swap it in when it
    // loads (cache cleared so tiles rebuild with the upgraded template).
    void this.tryLoadHouseObj();
  }

  private async tryLoadHouseObj(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync("", "/assets/", "house.obj", this.scene);
      const real = result.meshes.filter(
        (m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0
      );
      if (real.length === 0) return;
      const merged = real.length === 1
        ? real[0]!
        : Mesh.MergeMeshes(real, true, true, undefined, false, false);
      if (!merged) return;
      const bounds = merged.getBoundingInfo().boundingBox.extendSize;
      const maxDim = Math.max(bounds.x, bounds.y, bounds.z) * 2 || 1;
      merged.scaling.setAll(0.34 / maxDim);
      merged.setEnabled(false);
      merged.isPickable = false;
      merged.name = "houseObjTemplate";
      this.houseObjTemplate = merged;
      // Rebuild any tiles currently showing procedural houses.
      for (const [pos, entry] of this.buildingCache) {
        if (entry.sig.split("|")[0] !== "0") {
          entry.meshes.forEach((m) => m.dispose());
          this.buildingCache.delete(pos);
        }
      }
    } catch {
      // Procedural fallback stays.
    }
  }

  private getMaterial(key: string, make: (mat: StandardMaterial) => void): StandardMaterial {
    let mat = this.materials.get(key);
    if (!mat) {
      mat = new StandardMaterial(`bldg_${key}`, this.scene);
      mat.specularColor = new Color3(0.1, 0.1, 0.1);
      make(mat);
      this.materials.set(key, mat);
    }
    return mat;
  }

  /** Merged prism-roof house / stacked hotel / chimney factory templates. */
  private getTemplate(kind: "house" | "hotel" | "factory" | "skyscraper"): Mesh {
    if (kind === "house" && this.houseObjTemplate) return this.houseObjTemplate;
    let tpl = this.templates.get(kind);
    if (tpl) return tpl;

    const parts: Mesh[] = [];
    if (kind === "house") {
      const body = MeshBuilder.CreateBox("h_body", { width: 0.26, height: 0.2, depth: 0.26 }, this.scene);
      body.position.y = 0.1;
      const roof = MeshBuilder.CreateCylinder("h_roof", { tessellation: 3, diameter: 0.36, height: 0.28 }, this.scene);
      roof.rotation.z = Math.PI / 2;
      roof.rotation.y = Math.PI / 2;
      roof.position.y = 0.25;
      parts.push(body, roof);
    } else if (kind === "hotel") {
      const base = MeshBuilder.CreateBox("ht_base", { width: 0.42, height: 0.32, depth: 0.42 }, this.scene);
      base.position.y = 0.16;
      const upper = MeshBuilder.CreateBox("ht_upper", { width: 0.32, height: 0.26, depth: 0.32 }, this.scene);
      upper.position.y = 0.45;
      const roof = MeshBuilder.CreateCylinder("ht_roof", { tessellation: 3, diameter: 0.4, height: 0.34 }, this.scene);
      roof.rotation.z = Math.PI / 2;
      roof.rotation.y = Math.PI / 2;
      roof.position.y = 0.64;
      parts.push(base, upper, roof);
    } else if (kind === "skyscraper") {
      // Three tapering storeys — a proper tower above hotel height.
      const s1 = MeshBuilder.CreateBox("sk_1", { width: 0.36, height: 0.34, depth: 0.36 }, this.scene);
      s1.position.y = 0.17;
      const s2 = MeshBuilder.CreateBox("sk_2", { width: 0.3, height: 0.3, depth: 0.3 }, this.scene);
      s2.position.y = 0.49;
      const s3 = MeshBuilder.CreateBox("sk_3", { width: 0.24, height: 0.28, depth: 0.24 }, this.scene);
      s3.position.y = 0.78;
      const spire = MeshBuilder.CreateCylinder("sk_spire", { diameterTop: 0, diameterBottom: 0.08, height: 0.18, tessellation: 6 }, this.scene);
      spire.position.y = 1.0;
      parts.push(s1, s2, s3, spire);
    } else {
      const hall = MeshBuilder.CreateBox("f_hall", { width: 0.55, height: 0.3, depth: 0.55 }, this.scene);
      hall.position.y = 0.15;
      const chimney = MeshBuilder.CreateCylinder("f_chimney", { diameter: 0.11, height: 0.38, tessellation: 8 }, this.scene);
      chimney.position.set(0.18, 0.4, 0.18);
      parts.push(hall, chimney);
    }
    tpl = Mesh.MergeMeshes(parts, true, true, undefined, false, false)!;
    tpl.name = `tpl_${kind}`;
    tpl.setEnabled(false);
    tpl.isPickable = false;
    this.templates.set(kind, tpl);
    return tpl;
  }

  private cloneBuilding(kind: "house" | "hotel" | "factory" | "skyscraper", name: string, mortgaged: boolean): AbstractMesh {
    const tpl = this.getTemplate(kind);
    const clone = tpl.clone(name)!;
    clone.setEnabled(true);
    clone.isPickable = false;
    const colors: Record<string, Color3> = {
      house: new Color3(0.15, 0.65, 0.2),
      hotel: new Color3(0.8, 0.12, 0.12),
      factory: new Color3(0.62, 0.58, 0.3),
      skyscraper: new Color3(0.25, 0.28, 0.4),
    };
    const base = colors[kind]!;
    const matKey = `${kind}_${mortgaged ? "m" : "n"}`;
    clone.material = this.getMaterial(matKey, (mat) => {
      mat.diffuseColor = mortgaged ? base.scale(0.4) : base;
      // Tower windows glow warm at night — reads as lit offices.
      if (kind === "skyscraper" && !mortgaged) mat.emissiveColor = new Color3(0.25, 0.2, 0.08);
    });
    this.effects?.addShadowCaster(clone);
    return clone;
  }

  /**
   * Rebuild changed building/ownership meshes from state.
   * @returns board positions whose buildings changed (used for drop animation).
   */
  update(state: GameState): number[] {
    const changed = this.updateBuildings(state);
    this.updateOwnershipMarkers(state);
    this.updateUnbuildableMarkers(state);
    return changed;
  }

  // ---------------------------------------------------------------------------
  // Unbuildable-field markers (house rule): a ⛔ badge on the building spot of
  // each no-build street. The set is fixed per game — cached by signature so
  // markers rebuild only on a new game/rematch.
  // ---------------------------------------------------------------------------
  private unbuildableSig = "";
  private unbuildableMeshes: AbstractMesh[] = [];
  private noBuildTex: DynamicTexture | null = null;

  private getNoBuildTex(): DynamicTexture {
    if (this.noBuildTex) return this.noBuildTex;
    const S = 128;
    const tex = new DynamicTexture("noBuildTex", { width: S, height: S }, this.scene, true);
    tex.hasAlpha = true;
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, S, S);
    ctx.font = "104px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⛔", S / 2, S / 2 + 6);
    tex.update();
    this.noBuildTex = tex;
    return tex;
  }

  private updateUnbuildableMarkers(state: GameState) {
    const fields = state.unbuildableFields ?? [];
    const sig = fields.join(",");
    if (sig === this.unbuildableSig) return;
    this.unbuildableSig = sig;
    this.unbuildableMeshes.forEach((m) => m.dispose());
    this.unbuildableMeshes = [];

    for (const pos of fields) {
      const [x, z] = tileXZ(pos);
      const [odx, odz] = outerDirection(pos);
      // The building spot at the inner edge stays empty on these tiles — the
      // badge occupies it so the rule is readable at a glance.
      const plane = MeshBuilder.CreatePlane(`nobuild_${pos}`, { width: 0.5, height: 0.5 }, this.scene);
      plane.rotation.x = Math.PI / 2;
      plane.rotation.y = (getFieldAngle(pos) * Math.PI) / 180;
      plane.position.set(x - odx * (TILE_D / 2 - 0.35), 0.14, z - odz * (TILE_D / 2 - 0.35));
      plane.isPickable = false;
      const mat = new StandardMaterial(`nobuildMat_${pos}`, this.scene);
      mat.diffuseTexture = this.getNoBuildTex();
      mat.opacityTexture = this.getNoBuildTex();
      mat.emissiveColor = new Color3(0.9, 0.9, 0.9);
      mat.specularColor = new Color3(0, 0, 0);
      mat.backFaceCulling = false;
      plane.material = mat;
      this.unbuildableMeshes.push(plane);
    }
  }

  /**
   * Drop-in placement animation for freshly (re)built positions: meshes fall
   * from above with a small bounce + a dust puff. Fire-and-forget garnish
   * with its own safety snap — never awaited by the state queue.
   */
  animateDropIn(positions: number[]): void {
    for (const pos of positions) {
      const entry = this.buildingCache.get(pos);
      if (!entry) continue;
      for (const mesh of entry.meshes) this.dropMesh(mesh);
      const [x, z] = tileXZ(pos);
      this.effects?.dustPuff(x, 0.15, z);
    }
  }

  private dropMesh(mesh: AbstractMesh): void {
    const FALL_MS = 260;
    const BOUNCE_MS = 140;
    const targetY = mesh.position.y;
    mesh.position.y = targetY + 1.4;
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
      if (!mesh.isDisposed()) mesh.position.y = targetY;
    };
    const safety = setTimeout(finish, FALL_MS + BOUNCE_MS + 300);
    obs = this.scene.onBeforeRenderObservable.add(() => {
      if (mesh.isDisposed()) { finish(); return; }
      const now = performance.now();
      elapsed += now - lastTime;
      lastTime = now;
      if (elapsed <= FALL_MS) {
        const t = elapsed / FALL_MS;
        mesh.position.y = targetY + 1.4 * (1 - t * t); // ease-in fall
      } else {
        const t2 = Math.min((elapsed - FALL_MS) / BOUNCE_MS, 1);
        mesh.position.y = targetY + 0.12 * Math.sin(Math.PI * t2) * (1 - t2);
        if (t2 >= 1) finish();
      }
    });
  }

  private updateBuildings(state: GameState): number[] {
    const changedPositions: number[] = [];
    const seen = new Set<number>();

    for (const [posStr, b] of Object.entries(state.buildings)) {
      const pos = Number(posStr);
      if (!b || (!b.houses && !b.hotel && !b.factory && !b.skyscraper)) continue;
      seen.add(pos);

      const mortgaged = !!state.mortgaged[pos];
      const sig = `${b.houses}|${b.hotel ? 1 : 0}|${b.factory ? 1 : 0}|${b.skyscraper ? 1 : 0}|${mortgaged ? 1 : 0}`;
      const cached = this.buildingCache.get(pos);
      if (cached?.sig === sig) continue; // unchanged — keep existing meshes

      cached?.meshes.forEach((m) => m.dispose());
      const meshes: AbstractMesh[] = [];
      const [x, z] = tileXZ(pos);
      const [odx, odz] = outerDirection(pos);
      // Buildings sit toward the INNER edge (opposite the outer direction),
      // in a row along the tile's cross axis (perpendicular to inner-outer).
      const innerX = x - odx * (TILE_D / 2 - 0.35);
      const innerZ = z - odz * (TILE_D / 2 - 0.35);
      const perpX = odz, perpZ = -odx;
      const angleRad = (getFieldAngle(pos) * Math.PI) / 180;

      if (b.skyscraper) {
        const m = this.cloneBuilding("skyscraper", `bldg_${pos}`, mortgaged);
        m.position.set(innerX, 0.1, innerZ);
        m.rotation.y = angleRad;
        meshes.push(m);
      } else if (b.hotel) {
        const m = this.cloneBuilding("hotel", `bldg_${pos}`, mortgaged);
        m.position.set(innerX, 0.1, innerZ);
        m.rotation.y = angleRad;
        meshes.push(m);
      } else if (b.factory) {
        const m = this.cloneBuilding("factory", `bldg_${pos}`, mortgaged);
        m.position.set(innerX, 0.1, innerZ);
        m.rotation.y = angleRad;
        meshes.push(m);
      } else {
        const SPACING = 0.3;
        for (let i = 0; i < b.houses; i++) {
          const m = this.cloneBuilding("house", `bldg_${pos}_${i}`, mortgaged);
          const off = (i - (b.houses - 1) / 2) * SPACING;
          m.position.set(innerX + perpX * off, 0.1, innerZ + perpZ * off);
          m.rotation.y = angleRad;
          meshes.push(m);
        }
      }
      this.buildingCache.set(pos, { sig, meshes });
      changedPositions.push(pos);
    }

    // Tiles whose buildings vanished entirely.
    for (const [pos, entry] of this.buildingCache) {
      if (!seen.has(pos)) {
        entry.meshes.forEach((m) => m.dispose());
        this.buildingCache.delete(pos);
      }
    }
    return changedPositions;
  }

  // ---------------------------------------------------------------------------
  // Ownership markers: a glowing border frame around the tile perimeter in the
  // owner's colour. Mortgaged: the frame goes grey AND a diagonal-stripe
  // overlay reads instantly as "closed".
  // ---------------------------------------------------------------------------

  /** Shared diagonal-stripe texture for mortgaged tiles (built lazily once). */
  private mortgageStripeTex: DynamicTexture | null = null;
  private getMortgageStripeTex(): DynamicTexture {
    if (this.mortgageStripeTex) return this.mortgageStripeTex;
    const S = 256;
    const tex = new DynamicTexture("mortgageStripes", { width: S, height: S }, this.scene, true);
    tex.hasAlpha = true;
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, S, S);
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 18;
    for (let d = -S; d < S * 2; d += 56) {
      ctx.beginPath();
      ctx.moveTo(d, 0);
      ctx.lineTo(d + S, S);
      ctx.stroke();
    }
    tex.update();
    this.mortgageStripeTex = tex;
    return tex;
  }

  /** Build the 4-box border frame around a (non-corner) tile, merged into one mesh. */
  private buildOwnershipFrame(pos: number): Mesh | null {
    const [cx, cz] = tileXZ(pos);
    const BW = 0.06;  // border thickness
    const BH = 0.1;   // border height
    const w = TILE_W, d = TILE_D;
    const parts: Mesh[] = [];
    for (const sz of [-1, 1]) {
      const box = MeshBuilder.CreateBox(`ownEdge_${pos}_${sz}`, { width: w, height: BH, depth: BW }, this.scene);
      box.position.set(0, 0, sz * (d / 2 - BW / 2));
      parts.push(box);
    }
    for (const sx of [-1, 1]) {
      const box = MeshBuilder.CreateBox(`ownSide_${pos}_${sx}`, { width: BW, height: BH, depth: d - 2 * BW }, this.scene);
      box.position.set(sx * (w / 2 - BW / 2), 0, 0);
      parts.push(box);
    }
    const merged = Mesh.MergeMeshes(parts, true, true, undefined, false, false);
    if (!merged) return null;
    merged.name = `own_${pos}`;
    merged.position.set(cx, 0.12, cz);
    merged.rotation.y = (getFieldAngle(pos) * Math.PI) / 180;
    merged.isPickable = false;
    return merged;
  }

  private updateOwnershipMarkers(state: GameState) {
    const seen = new Set<number>();

    for (const [posStr, playerId] of Object.entries(state.ownership)) {
      const pos = Number(posStr);
      const player = state.players.find((p) => p.id === playerId);
      if (!player) continue;

      const isCorner = pos === 0 || pos === 10 || pos === 20 || pos === 30;
      if (isCorner) continue; // corners aren't ownable properties
      seen.add(pos);

      const isMortgaged = !!state.mortgaged[pos];
      const sig = `${playerId}|${isMortgaged ? 1 : 0}`;
      const cached = this.ownershipCache.get(pos);
      if (cached?.sig === sig) continue; // unchanged

      cached?.meshes.forEach((m) => m.dispose());
      const frame = this.buildOwnershipFrame(pos);
      if (!frame) continue;

      const mat = new StandardMaterial(`ownMat_${pos}`, this.scene);
      const baseColor = brighten(playerColor3(player.color));
      if (isMortgaged) {
        mat.diffuseColor = new Color3(0.35, 0.35, 0.35);
        mat.emissiveColor = new Color3(0.08, 0.08, 0.08);
      } else {
        mat.diffuseColor = baseColor.scale(0.3);
        mat.emissiveColor = baseColor;
      }
      mat.specularColor = new Color3(0, 0, 0);
      frame.material = mat;
      if (!isMortgaged) this.effects?.addGlowMesh(frame);

      if (isMortgaged) {
        const [cx, cz] = tileXZ(pos);
        const overlay = MeshBuilder.CreatePlane(`ownStripes_${pos}`, { width: TILE_W * 0.9, height: TILE_D * 0.8 }, this.scene);
        overlay.rotation.x = Math.PI / 2;
        overlay.rotation.y = (getFieldAngle(pos) * Math.PI) / 180;
        overlay.position.set(cx, 0.135, cz);
        overlay.isPickable = false;
        const oMat = new StandardMaterial(`ownStripesMat_${pos}`, this.scene);
        oMat.diffuseTexture = this.getMortgageStripeTex();
        oMat.opacityTexture = this.getMortgageStripeTex();
        oMat.specularColor = new Color3(0, 0, 0);
        oMat.backFaceCulling = false;
        overlay.material = oMat;
        overlay.setParent(frame); // keeps world transform; disposed with the frame
      }

      this.ownershipCache.set(pos, { sig, meshes: [frame] });
    }

    // Frames for tiles no longer owned.
    for (const [pos, entry] of this.ownershipCache) {
      if (!seen.has(pos)) {
        entry.meshes.forEach((m) => m.dispose());
        this.ownershipCache.delete(pos);
      }
    }
  }
}
