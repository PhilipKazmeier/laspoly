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
  AbstractMesh,
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
} from "./constants.js";

export class BuildingRenderer {
  private buildingMeshes: Map<number, AbstractMesh> = new Map();
  private ownershipMarkers: Map<number, AbstractMesh> = new Map();

  constructor(private scene: Scene) {}

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
      // Offset slightly toward the board centre from the tile
      const [, odz] = outerDirection(pos);
      mesh.position.set(x, 0.35, z + odz * 0.5);
      this.buildingMeshes.set(pos, mesh);
    }
  }

  // ---------------------------------------------------------------------------
  // Ownership markers (on-board, owner-coloured stripe per property tile)
  // ---------------------------------------------------------------------------
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
}
