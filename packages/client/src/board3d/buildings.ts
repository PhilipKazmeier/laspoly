// ---------------------------------------------------------------------------
// board3d/buildings.ts — building meshes (houses/hotel/factory) and per-tile
// ownership markers, rebuilt from state on every update. (Mesh caching lands
// in a later phase; this module currently preserves the dispose/recreate
// behaviour of the original board3d.ts verbatim.)
// ---------------------------------------------------------------------------
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  DynamicTexture,
  AbstractMesh,
  Mesh,
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

export class BuildingRenderer {
  private buildingMeshes: Map<number, AbstractMesh> = new Map();
  private ownershipMarkers: Map<number, AbstractMesh> = new Map();

  constructor(private scene: Scene, private effects?: Effects) {}

  /** Rebuild building + ownership-marker meshes from state. */
  update(state: GameState): void {
    this.updateBuildings(state);
    this.updateOwnershipMarkers(state);
  }

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
      this.effects?.addShadowCaster(mesh);
      // Offset slightly toward the board centre from the tile
      const [, odz] = outerDirection(pos);
      mesh.position.set(x, 0.35, z + odz * 0.5);
      this.buildingMeshes.set(pos, mesh);
    }
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
    // Diagonal stripes across the tile face.
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
    // Local-space tile footprint (W along X, D along Z), rotated afterwards.
    const w = TILE_W, d = TILE_D;
    const parts: Mesh[] = [];
    // Long edges (along X at ±z)
    for (const sz of [-1, 1]) {
      const box = MeshBuilder.CreateBox(`ownEdge_${pos}_${sz}`, { width: w, height: BH, depth: BW }, this.scene);
      box.position.set(0, 0, sz * (d / 2 - BW / 2));
      parts.push(box);
    }
    // Short edges (along Z at ±x)
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

      const frame = this.buildOwnershipFrame(pos);
      if (!frame) continue;
      const isMortgaged = !!state.mortgaged[pos];

      const mat = new StandardMaterial(`ownMat_${pos}`, this.scene);
      const baseColor = brighten(playerColor3(player.color));
      if (isMortgaged) {
        // Mortgaged → dull grey frame so it reads distinctly from an active deed.
        mat.diffuseColor = new Color3(0.35, 0.35, 0.35);
        mat.emissiveColor = new Color3(0.08, 0.08, 0.08);
      } else {
        mat.diffuseColor = baseColor.scale(0.3);
        mat.emissiveColor = baseColor;
      }
      mat.specularColor = new Color3(0, 0, 0);
      frame.material = mat;
      if (!isMortgaged) this.effects?.addGlowMesh(frame);

      // Diagonal-stripe overlay on top of the tile face while mortgaged.
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

      this.ownershipMarkers.set(pos, frame);
    }
  }
}
