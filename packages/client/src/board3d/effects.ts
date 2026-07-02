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
  Color4,
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  ParticleSystem,
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

  // ---------------------------------------------------------------------------
  // Environment: neon starfield skybox + drifting dust motes. Classic gets its
  // warm room feel from the palette (clear colour + key light) instead.
  // ---------------------------------------------------------------------------
  initEnvironment(): void {
    if (this.theme !== "neon") return;

    // Inside-out box with an emissive night-sky texture. infiniteDistance keeps
    // it glued to the camera so it always fills the horizon.
    const sky = MeshBuilder.CreateBox(
      "sky",
      { size: 400, sideOrientation: Mesh.BACKSIDE },
      this.scene
    );
    const mat = new StandardMaterial("skyMat", this.scene);
    mat.disableLighting = true;
    mat.emissiveTexture = this.makeStarfieldTexture();
    mat.backFaceCulling = false;
    mat.specularColor = new Color3(0, 0, 0);
    sky.material = mat;
    sky.infiniteDistance = true;
    sky.isPickable = false;

    if (this.quality === "high") this.initDust();
  }

  /** 1024² night sky: vertical midnight gradient + scattered stars. */
  private makeStarfieldTexture(): DynamicTexture {
    const S = 1024;
    const tex = new DynamicTexture("skyTex", { width: S, height: S }, this.scene, true);
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    const grad = ctx.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, "#1a1230");
    grad.addColorStop(1, "#0a0913");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);
    // Stars: client-side Math.random is fine (visual only — determinism binds
    // the engine, not the renderer).
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * S;
      const y = Math.random() * S;
      const r = 0.5 + Math.random() * 1.0;
      const a = 0.3 + Math.random() * 0.7;
      ctx.fillStyle = Math.random() < 0.15 ? `rgba(255,220,150,${a})` : `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    tex.update();
    return tex;
  }

  /** One-shot grey dust puff at a world position (building placement). */
  dustPuff(x: number, y: number, z: number): void {
    if (this.quality === "low") return;
    const T = 16;
    const tex = new DynamicTexture(`puffTex_${Date.now()}`, { width: T, height: T }, this.scene, false);
    tex.hasAlpha = true;
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    const grad = ctx.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
    grad.addColorStop(0, "rgba(200,200,200,0.9)");
    grad.addColorStop(1, "rgba(200,200,200,0)");
    ctx.clearRect(0, 0, T, T);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, T, T);
    tex.update();

    const ps = new ParticleSystem(`puff_${Date.now()}`, 20, this.scene);
    ps.particleTexture = tex;
    ps.emitter = new Vector3(x, y, z);
    ps.minEmitBox = new Vector3(-0.15, 0, -0.15);
    ps.maxEmitBox = new Vector3(0.15, 0.05, 0.15);
    ps.minSize = 0.06;
    ps.maxSize = 0.16;
    ps.minLifeTime = 0.25;
    ps.maxLifeTime = 0.45;
    ps.emitRate = 120;
    ps.direction1 = new Vector3(-0.6, 0.4, -0.6);
    ps.direction2 = new Vector3(0.6, 0.9, 0.6);
    ps.minEmitPower = 0.4;
    ps.maxEmitPower = 1.0;
    ps.color1 = new Color4(0.75, 0.72, 0.65, 0.7);
    ps.color2 = new Color4(0.6, 0.6, 0.6, 0.5);
    ps.colorDead = new Color4(0.6, 0.6, 0.6, 0);
    ps.targetStopDuration = 0.3;
    ps.disposeOnStop = true;
    ps.onDisposeObservable.add(() => tex.dispose());
    ps.start();
  }

  /** Slow-drifting golden dust motes above the board (neon + high only). */
  private initDust(): void {
    const T = 16;
    const tex = new DynamicTexture("dustTex", { width: T, height: T }, this.scene, false);
    tex.hasAlpha = true;
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    const grad = ctx.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.clearRect(0, 0, T, T);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, T, T);
    tex.update();

    const ps = new ParticleSystem("dust", 150, this.scene);
    ps.particleTexture = tex;
    ps.emitter = new Vector3(0, 0, 0);
    ps.minEmitBox = new Vector3(-11, 0.5, -11);
    ps.maxEmitBox = new Vector3(11, 6, 11);
    ps.minSize = 0.02;
    ps.maxSize = 0.06;
    ps.minLifeTime = 6;
    ps.maxLifeTime = 12;
    ps.emitRate = 12;
    ps.direction1 = new Vector3(-0.02, 0.05, -0.02);
    ps.direction2 = new Vector3(0.02, 0.08, 0.02);
    ps.minEmitPower = 0.4;
    ps.maxEmitPower = 1;
    ps.blendMode = ParticleSystem.BLENDMODE_ADD;
    ps.color1 = new Color4(1, 0.9, 0.6, 0.5);
    ps.color2 = new Color4(0.9, 0.9, 1, 0.35);
    ps.colorDead = new Color4(1, 1, 1, 0);
    ps.start();
  }
}
