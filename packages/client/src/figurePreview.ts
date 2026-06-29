import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
  Color4,
  StandardMaterial,
  Mesh,
  SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders/OBJ";

// figureIndex 0-4 → car1..car5, 5 → police.
const FIGURE_FILES = ["car1.obj", "car2.obj", "car3.obj", "car4.obj", "car5.obj", "police.obj"];

/**
 * A tiny self-contained Babylon scene that renders the selected vehicle model as a
 * slowly auto-rotating 3D preview, tinted in the player's colour (bug 2). One engine
 * per picker; dispose() tears it down when the room view is rebuilt.
 */
export class FigurePreview {
  private engine: Engine;
  private scene: Scene;
  private current: Mesh | null = null;
  private loadToken = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false }, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.07, 0.07, 0.12, 1);

    const cam = new ArcRotateCamera("cam", Math.PI / 4, Math.PI / 3, 2.4, Vector3.Zero(), this.scene);
    cam.attachControl(canvas, true);
    cam.lowerRadiusLimit = 1.4;
    cam.upperRadiusLimit = 4;

    new HemisphericLight("h", new Vector3(0, 1, 0), this.scene).intensity = 0.9;
    const dir = new DirectionalLight("d", new Vector3(-1, -2, -1), this.scene);
    dir.intensity = 0.6;

    this.engine.runRenderLoop(() => {
      if (this.current) this.current.rotation.y += 0.012;
      this.scene.render();
    });
  }

  /** Load + show the given figure tinted with `colorHex` (e.g. "#ef4444"). */
  async show(figureIndex: number, colorHex: string): Promise<void> {
    const token = ++this.loadToken;
    const file = FIGURE_FILES[figureIndex] ?? FIGURE_FILES[0]!;
    let result;
    try {
      result = await SceneLoader.ImportMeshAsync("", "/assets/", file, this.scene);
    } catch {
      return; // best-effort; leave the previous model
    }
    if (token !== this.loadToken) {
      // A newer selection superseded this load — drop it.
      result.meshes.forEach((m) => m.dispose());
      return;
    }
    if (this.current) { this.current.dispose(); this.current = null; }

    const real = result.meshes.filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0);
    if (real.length === 0) return;
    const merged = real.length === 1 ? real[0]! : Mesh.MergeMeshes(real, true, true, undefined, false, false);
    if (!merged) return;

    // Normalise to ~1.2 units so every model fills the preview similarly.
    const ext = merged.getBoundingInfo().boundingBox.extendSize;
    const maxDim = Math.max(ext.x, ext.y, ext.z) * 2 || 1;
    merged.scaling.setAll(1.2 / maxDim);

    const c = Color3.FromHexString(colorHex);
    const mat = new StandardMaterial("previewMat", this.scene);
    mat.diffuseColor = c;
    mat.specularColor = new Color3(0.4, 0.4, 0.4);
    mat.emissiveColor = c.scale(0.45);
    merged.material = mat;
    merged.getChildMeshes().forEach((m) => (m.material = mat));
    merged.position.set(0, 0, 0);
    this.current = merged;
  }

  dispose(): void {
    this.loadToken++;
    this.scene.dispose();
    this.engine.dispose();
  }
}
