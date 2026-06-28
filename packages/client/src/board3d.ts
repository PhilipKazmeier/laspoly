import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import { getBoard, listBoards, JAIL_POS } from "@laspoly/shared";
import type { GameState, Tile } from "@laspoly/shared";

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

function tileXZ(pos: number): [number, number] {
  const S = 2;
  const E = 9;
  if (pos === 0) return [E, E];
  if (pos <= 9) return [E - pos * S, E];
  if (pos === 10) return [-E, E];
  if (pos <= 19) return [-E, E - (pos - 10) * S];
  if (pos === 20) return [-E, -E];
  if (pos <= 29) return [-E + (pos - 20) * S, -E];
  if (pos === 30) return [E, -E];
  if (pos <= 39) return [E, -E + (pos - 30) * S];
  return [-E, E]; // JAIL_POS=40 = jail corner
}

export class Board3D {
  private engine: Engine;
  private scene: Scene;
  private tokenMeshes: Map<string, ReturnType<typeof MeshBuilder.CreateSphere>> = new Map();
  private buildingMeshes: Map<number, ReturnType<typeof MeshBuilder.CreateBox>> = new Map();
  private currentBoardId: string | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);

    // Camera
    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 4,
      45,
      Vector3.Zero(),
      this.scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 15;
    camera.upperRadiusLimit = 80;
    camera.upperBetaLimit = Math.PI / 2.2;

    // Light
    new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);

    // Board background
    const ground = MeshBuilder.CreateBox(
      "ground",
      { width: 22, height: 0.1, depth: 22 },
      this.scene
    );
    const groundMat = new StandardMaterial("groundMat", this.scene);
    groundMat.diffuseColor = new Color3(0.2, 0.5, 0.2);
    ground.material = groundMat;
    ground.position.y = -0.05;

    // Draw initial board (use first available)
    const boards = listBoards();
    if (boards.length > 0 && boards[0]) {
      this.drawBoard(boards[0].id);
    }

    this.engine.runRenderLoop(() => this.scene.render());
    window.addEventListener("resize", () => this.engine.resize());
  }

  private drawBoard(boardId: string) {
    if (this.currentBoardId === boardId) return;
    this.currentBoardId = boardId;

    const board = getBoard(boardId);
    const tileWidth = 1.8;

    for (const tile of board.tiles) {
      const [x, z] = tileXZ(tile.pos);

      const tileMesh = MeshBuilder.CreateBox(
        `tile_${tile.pos}`,
        { width: tileWidth, height: 0.1, depth: tileWidth },
        this.scene
      );
      tileMesh.position.set(x, 0.05, z);

      const tileMat = new StandardMaterial(`tileMat_${tile.pos}`, this.scene);
      tileMat.diffuseColor = new Color3(0.9, 0.9, 0.9);
      tileMesh.material = tileMat;

      // Color bar for street/station/attraction
      const group = (tile as { group?: string }).group;
      if (group && GROUP_COLORS[group]) {
        const colorHex = GROUP_COLORS[group];
        if (colorHex) {
          const bar = MeshBuilder.CreateBox(
            `bar_${tile.pos}`,
            { width: tileWidth, height: 0.05, depth: 0.3 },
            this.scene
          );
          bar.position.set(x, 0.13, z + tileWidth / 2 - 0.15);
          const barMat = new StandardMaterial(`barMat_${tile.pos}`, this.scene);
          barMat.diffuseColor = hexToColor3(colorHex);
          bar.material = barMat;
        }
      }
    }

    // Jail tile (pos 40)
    const [jx, jz] = tileXZ(JAIL_POS);
    const jailMesh = MeshBuilder.CreateBox(
      "tile_jail",
      { width: 1.8, height: 0.1, depth: 1.8 },
      this.scene
    );
    jailMesh.position.set(jx, 0.05, jz);
    const jailMat = new StandardMaterial("jailMat", this.scene);
    jailMat.diffuseColor = new Color3(0.8, 0.7, 0.5);
    jailMesh.material = jailMat;
  }

  private updateBuildings(state: GameState) {
    // Remove markers for positions no longer in state.buildings
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

      // Dispose old marker for this position so we redraw fresh
      const existing = this.buildingMeshes.get(pos);
      if (existing) existing.dispose();

      let mesh: ReturnType<typeof MeshBuilder.CreateBox>;
      const mat = new StandardMaterial(`bldgMat_${pos}`, this.scene);

      if (b.hotel) {
        // Hotel: tall red box
        mesh = MeshBuilder.CreateBox(`bldg_${pos}`, { width: 0.4, height: 0.6, depth: 0.4 }, this.scene);
        mat.diffuseColor = new Color3(0.8, 0.1, 0.1);
      } else if (b.factory) {
        // Factory: wide yellowish box
        mesh = MeshBuilder.CreateBox(`bldg_${pos}`, { width: 0.6, height: 0.35, depth: 0.6 }, this.scene);
        mat.diffuseColor = new Color3(0.6, 0.6, 0.2);
      } else {
        // Houses: small green box, width scales with house count
        mesh = MeshBuilder.CreateBox(`bldg_${pos}`, { width: Math.max(0.1, 0.2 * b.houses), height: 0.25, depth: 0.2 }, this.scene);
        mat.diffuseColor = new Color3(0.1, 0.7, 0.1);
      }

      // Dim if mortgaged
      if (state.mortgaged[pos]) {
        mat.diffuseColor = mat.diffuseColor.scale(0.4);
      }

      mesh.material = mat;
      mesh.position.set(x, 0.35, z - 0.5);
      this.buildingMeshes.set(pos, mesh);
    }
  }

  update(state: GameState, _myId: string | null) {
    // Ensure board is drawn for current boardId
    this.drawBoard(state.boardId);

    // Remove old tokens
    for (const [id, mesh] of this.tokenMeshes) {
      if (!state.players.find(p => p.id === id)) {
        mesh.dispose();
        this.tokenMeshes.delete(id);
      }
    }

    // Group players by position for offset
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
        continue;
      }

      const [x, z] = tileXZ(player.position);
      const group = byPos.get(player.position) ?? [];
      const i = group.indexOf(player.id);
      const offsetX = (i % 2) * 0.4 - 0.2;
      const offsetZ = Math.floor(i / 2) * 0.4 - 0.2;

      let mesh = this.tokenMeshes.get(player.id);
      if (!mesh) {
        mesh = MeshBuilder.CreateSphere(
          `token_${player.id}`,
          { diameter: 0.4 },
          this.scene
        );
        const mat = new StandardMaterial(`tokenMat_${player.id}`, this.scene);
        mat.diffuseColor = hexToColor3(
          player.color.startsWith("#") ? player.color : `#${player.color}`
        );
        mesh.material = mat;
        this.tokenMeshes.set(player.id, mesh);
      }

      mesh.position.set(x + offsetX, 0.5, z + offsetZ);
    }

    this.updateBuildings(state);
  }
}
