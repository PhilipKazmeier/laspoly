// ---------------------------------------------------------------------------
// board3d/effects.ts — post-processing (bloom/FXAA/vignette), glow layer and
// shadows, all gated by the graphics-quality setting. Later phases add the
// environment (skybox/particles) and one-shot particle effects here.
//
// Design notes:
// - The GlowLayer runs in INCLUDED-ONLY mode: only meshes explicitly passed to
//   addGlowMesh() glow. Without this, every emissive material in the scene
//   (tile labels, name billboards, player displays) blooms into unreadable mush.
// - Shadows use one dedicated DirectionalLight + a blurred exponential shadow
//   map. Casters are the small dynamic meshes (tokens, buildings, cup, dice);
//   receivers are the large static surfaces. Tiles are receivers, NEVER casters.
// ---------------------------------------------------------------------------
import {
  Scene,
  ArcRotateCamera,
  DefaultRenderingPipeline,
  GlowLayer,
  DirectionalLight,
  ShadowGenerator,
  Vector3,
  Color3,
  AbstractMesh,
  Mesh,
} from "@babylonjs/core";
import type { Theme } from "../theme.js";
import type { Quality } from "../quality.js";

export class Effects {
  private glow: GlowLayer | null = null;
  private shadows: ShadowGenerator | null = null;

  constructor(
    private scene: Scene,
    private theme: Theme,
    private quality: Quality,
  ) {}

  /** Bloom + FXAA (+ vignette on neon). FXAA stays on even at low quality. */
  initPipeline(camera: ArcRotateCamera): void {
    const pipeline = new DefaultRenderingPipeline("default", false, this.scene, [camera]);
    pipeline.fxaaEnabled = true;
    if (this.quality === "low") return;

    // NO scene-wide bloom: the near-white tiles sit at luminance ~1.0, so any
    // bloom threshold below 1 blooms the entire tile ring into glare and
    // washes out the labels (verified by screenshot at thresholds 0.55 and
    // 0.85). The selective neon pop comes from the included-only GlowLayer
    // instead — it only affects hand-registered meshes.
    if (this.theme === "neon") {
      pipeline.imageProcessingEnabled = true;
      pipeline.imageProcessing.vignetteEnabled = true;
      pipeline.imageProcessing.vignetteWeight = 1.5;
    }
  }

  /** Glow layer for hand-picked emissive meshes (neon + high only). */
  initGlow(): void {
    if (this.theme !== "neon" || this.quality === "low") return;
    this.glow = new GlowLayer("glow", this.scene, { blurKernelSize: 32 });
    this.glow.intensity = 0.6;
    // Included-only mode: nothing glows unless registered via addGlowMesh().
    // (Adding one mesh switches the layer from "all emissive" to "only these".)
  }

  /** Register a mesh with the glow layer (no-op when glow is off). */
  addGlowMesh(mesh: Mesh): void {
    this.glow?.addIncludedOnlyMesh(mesh);
  }

  /**
   * Blurred-exponential shadow map from a dedicated directional light.
   * Skipped entirely at low quality. The existing straight-down fill light is
   * dimmed by the caller to compensate for the added directional intensity.
   */
  initShadows(): void {
    if (this.quality === "low") return;
    const shadowLight = new DirectionalLight(
      "shadowLight",
      new Vector3(-0.5, -1, 0.35),
      this.scene
    );
    shadowLight.position = new Vector3(12, 24, -9);
    shadowLight.intensity = 0.35;
    shadowLight.specular = new Color3(0, 0, 0);

    const gen = new ShadowGenerator(1024, shadowLight);
    gen.useBlurExponentialShadowMap = true;
    gen.blurKernel = 16;
    gen.setDarkness(0.35);
    this.shadows = gen;
  }

  /** Register a mesh as a shadow caster (no-op when shadows are off). */
  addShadowCaster(mesh: AbstractMesh): void {
    this.shadows?.addShadowCaster(mesh, true);
  }

  /** Mark a mesh as receiving shadows (safe to call when shadows are off). */
  addShadowReceiver(mesh: AbstractMesh): void {
    if (this.shadows) mesh.receiveShadows = true;
  }
}
