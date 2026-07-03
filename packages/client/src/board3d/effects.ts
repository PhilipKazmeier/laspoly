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
  HDRCubeTexture,
  Vector3,
  Color3,
  Color4,
  DynamicTexture,
  ParticleSystem,
  AbstractMesh,
  Mesh,
} from "@babylonjs/core";
import type { Quality } from "../quality.js";

export class Effects {
  private glow: GlowLayer | null = null;
  private shadows: ShadowGenerator | null = null;

  constructor(
    private scene: Scene,
    private quality: Quality,
  ) {}

  /** FXAA + warm-room vignette. FXAA stays on even at low quality. */
  initPipeline(camera: ArcRotateCamera): void {
    const pipeline = new DefaultRenderingPipeline("default", false, this.scene, [camera]);
    pipeline.fxaaEnabled = true;

    // NO scene-wide bloom: the near-white tiles sit at luminance ~1.0, so any
    // bloom threshold below 1 blooms the entire tile ring into glare and
    // washes out the labels (verified by screenshot at thresholds 0.55 and
    // 0.85). Lamplight accents come from the included-only GlowLayer instead.
    //
    // The vignette IS the room: it darkens the table edges toward the
    // surrounding dark, implying walls without modelling them.
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.vignetteEnabled = true;
    pipeline.imageProcessing.vignetteWeight = 1.8;
  }

  /** Glow layer for hand-picked emissive meshes (skipped at low quality). */
  initGlow(): void {
    if (this.quality === "low") return;
    // Lamplight, not neon: low intensity, only hand-registered meshes.
    this.glow = new GlowLayer("glow", this.scene, { blurKernelSize: 32 });
    this.glow.intensity = 0.35;
    // Included-only mode: nothing glows unless registered via addGlowMesh().
    // (Adding one mesh switches the layer from "all emissive" to "only these".)
  }

  /** Register a mesh with the glow layer (no-op when glow is off). */
  addGlowMesh(mesh: Mesh): void {
    this.glow?.addIncludedOnlyMesh(mesh);
  }

  /**
   * The warm key light of the room — a directional "lamp over the table" that
   * also drives the blurred-exponential shadow map. Skipped entirely at low
   * quality (the caller compensates with a brighter flat fill there).
   */
  initShadows(): void {
    if (this.quality === "low") return;
    const key = new DirectionalLight(
      "keyLight",
      new Vector3(-0.45, -1, 0.3),
      this.scene
    );
    key.position = new Vector3(14, 26, -10);
    key.intensity = 0.8;
    key.diffuse = new Color3(1, 0.88, 0.7); // warm tungsten
    key.specular = new Color3(0.08, 0.06, 0.04);

    const gen = new ShadowGenerator(1024, key);
    gen.useBlurExponentialShadowMap = true;
    gen.blurKernel = 16;
    gen.setDarkness(0.4);
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
  // Environment: the room beyond the table is implied, not modelled — the dark
  // clear colour + vignette are the walls; a warm interior HDRI feeds image-
  // based lighting into the PBR table so the wood picks up believable sheen.
  // Drifting dust motes in the key light complete the atmosphere (high only).
  // ---------------------------------------------------------------------------
  initEnvironment(): void {
    if (this.quality === "low") return;

    // IBL only — no visible skybox. 128px prefilter keeps startup cheap.
    const env = new HDRCubeTexture(
      "/assets/env/warm_interior_1k.hdr",
      this.scene,
      128,
      false,
      true,
      false,
      true
    );
    this.scene.environmentTexture = env;
    this.scene.environmentIntensity = 0.4;

    if (this.quality === "high") this.initDust();
  }

  /** Celebration confetti burst at a world position (win). Skipped on low quality. */
  confettiBurst(x: number, y: number, z: number): void {
    if (this.quality === "low") return;
    const T = 8;
    const tex = new DynamicTexture("confettiTex", { width: T, height: T }, this.scene, false);
    tex.hasAlpha = true;
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, T, T);
    tex.update();

    const palette: Color4[] = [
      new Color4(0.94, 0.27, 0.27, 1), // red
      new Color4(0.23, 0.51, 0.96, 1), // blue
      new Color4(0.13, 0.77, 0.37, 1), // green
      new Color4(0.92, 0.7, 0.03, 1),  // gold
      new Color4(0.66, 0.33, 0.97, 1), // purple
    ];
    for (let burst = 0; burst < 2; burst++) {
      const ps = new ParticleSystem(`confetti_${burst}`, 300, this.scene);
      ps.particleTexture = tex;
      ps.emitter = new Vector3(x, y + 0.3, z);
      ps.minEmitBox = new Vector3(-0.2, 0, -0.2);
      ps.maxEmitBox = new Vector3(0.2, 0.2, 0.2);
      ps.minSize = 0.05;
      ps.maxSize = 0.12;
      ps.minLifeTime = 1.4;
      ps.maxLifeTime = 2.6;
      ps.emitRate = 220;
      // Cone upward with spread; gravity pulls the streamers back down.
      ps.direction1 = new Vector3(-1, 2.2, -1);
      ps.direction2 = new Vector3(1, 3.2, 1);
      ps.minEmitPower = 2.2;
      ps.maxEmitPower = 4.2;
      ps.gravity = new Vector3(0, -4, 0);
      ps.minAngularSpeed = -6;
      ps.maxAngularSpeed = 6;
      ps.color1 = palette[(burst * 2) % palette.length]!;
      ps.color2 = palette[(burst * 2 + 1) % palette.length]!;
      ps.colorDead = new Color4(1, 1, 1, 0);
      ps.targetStopDuration = 2.5;
      ps.disposeOnStop = true;
      ps.start();
    }
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
