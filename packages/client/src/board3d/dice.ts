// ---------------------------------------------------------------------------
// board3d/dice.ts — the dice cup + two pip dice and the roll animation.
// The `playDiceAnimationAsync` promise contract is consumed by the serial
// state queue in main.ts: it resolves EXACTLY when the dice have settled and
// are visible, with an internal safety timeout so the queue can never
// deadlock when the render loop is throttled (headless e2e).
// ---------------------------------------------------------------------------
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector4,
  Quaternion,
  Axis,
  DynamicTexture,
  AbstractMesh,
  Mesh,
  Scene,
} from "@babylonjs/core";
import {
  ThemePalette,
  CUP_LIFT,
  SHAKE_CYCLES,
  SHAKE_AMP,
  DIE_SIZE,
  DICE_SAFETY_MS,
  DICE_SKINS,
  DiceSkin,
} from "./constants.js";
import type { Effects } from "./effects.js";

export class DiceRig {
  private diceCupMesh: AbstractMesh | null = null;
  private dieMesh1: AbstractMesh | null = null;
  private dieMesh2: AbstractMesh | null = null;
  private diceAnimating = false;
  /** Lazily built per-skin materials (atlas texture + surface params). */
  private skinMaterials: Map<number, StandardMaterial> = new Map();
  private currentSkin = -1;

  constructor(private scene: Scene, private palette: ThemePalette, private effects?: Effects) {
    this.initDice();
  }

  showCup(): void {
    if (this.diceCupMesh) this.diceCupMesh.setEnabled(true);
    // Hide the previous roll's dice below the felt so a turn awaiting a roll shows
    // the CUP, not leftover dice.
    if (this.dieMesh1) this.dieMesh1.position.y = -2;
    if (this.dieMesh2) this.dieMesh2.position.y = -2;
  }

  hideCup(): void {
    if (this.diceCupMesh) this.diceCupMesh.setEnabled(false);
  }

  private initDice(): void {
    // Place the dice area in the felt corner opposite the card deck.
    // CZ = +3.5 puts it in the near (camera-facing) half of the felt.
    const CX = -3.5, CZ = 3.5;
    // Cup base Y so the bottom rim sits on the felt surface.
    const CUP_BASE_Y = 0.02;
    const CUP_HEIGHT = 2.2;  // clearly bigger than a single die
    const CUP_R_TOP = 0.85;
    const CUP_R_BOT = 0.65;

    // Procedural cup: open-top truncated cone.
    // Use backFaceCulling=false so both the outside and inside of the shell are
    // visible (fixes the "half-rendered" bug where the interior was invisible).
    const cup = MeshBuilder.CreateCylinder(
      "diceCup",
      { diameterTop: CUP_R_TOP * 2, diameterBottom: CUP_R_BOT * 2, height: CUP_HEIGHT, tessellation: 20, sideOrientation: Mesh.DOUBLESIDE },
      this.scene
    );
    // Centre of the cylinder is at its mid-height, so shift up by half-height to rest on felt.
    cup.position.set(CX, CUP_BASE_Y + CUP_HEIGHT / 2, CZ);
    cup.isPickable = true; // click-to-roll

    const cupMat = new StandardMaterial("cupMat", this.scene);
    // Neon: dark cup with a gold self-lit rim. Classic: leather brown (palette).
    cupMat.diffuseColor = this.palette.cupDiffuse;
    cupMat.emissiveColor = this.palette.cupEmissive;
    cupMat.specularColor = this.palette.cupSpecular;
    cupMat.backFaceCulling = false; // double-sided so interior shows
    cup.material = cupMat;
    this.effects?.addShadowCaster(cup);
    this.effects?.addGlowMesh(cup);
    this.diceCupMesh = cup;

    // Pip dice — atlas-textured cubes with distinct faces for 1–6.
    // They start hidden below the felt and only surface after the cup lifts.
    for (let d = 0; d < 2; d++) {
      const dx = CX + (d === 0 ? -0.32 : 0.32);
      const dz = CZ + (d === 0 ? -0.14 : 0.14);
      const die = this.createPipDie(`die_${d}`, DIE_SIZE);
      die.isPickable = false;
      this.effects?.addShadowCaster(die);
      die.position.set(dx, -2, dz);  // hidden below felt
      if (d === 0) this.dieMesh1 = die; else this.dieMesh2 = die;
    }
  }

  /** Draw a standard Western die pip pattern for `value` (1–6) onto a W×H canvas. */
  private drawPipFace(ctx: CanvasRenderingContext2D, value: number, W: number, H: number, skin: DiceSkin) {
    ctx.fillStyle = skin.face;
    ctx.fillRect(0, 0, W, H);
    // Thin border so adjacent faces read as separate.
    ctx.strokeStyle = skin.border;
    ctx.lineWidth = W * 0.03;
    ctx.strokeRect(0, 0, W, H);
    ctx.fillStyle = skin.pip;
    const r = W * 0.1;   // pip radius
    const m = W * 0.27;  // margin from edge to pip centre
    const c = W / 2;     // centre
    const dots: Array<[number, number]> = [];
    if (value === 1) { dots.push([c, c]); }
    if (value === 2) { dots.push([m, m], [W - m, H - m]); }
    if (value === 3) { dots.push([m, m], [c, c], [W - m, H - m]); }
    if (value === 4) { dots.push([m, m], [W - m, m], [m, H - m], [W - m, H - m]); }
    if (value === 5) { dots.push([m, m], [W - m, m], [c, c], [m, H - m], [W - m, H - m]); }
    if (value === 6) { dots.push([m, m], [W - m, m], [m, c], [W - m, c], [m, H - m], [W - m, H - m]); }
    for (const [px, py] of dots) {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Build a die cube using a 6-column texture atlas so every face shows distinct pips.
   * BabylonJS CreateBox with faceUV maps each of the 6 cube faces to a 1/6-width
   * strip of the atlas texture — this is the reliable multi-face approach.
   *
   * Babylon faceUV index → geometric face: 0=front(−Z), 1=back(+Z), 2=right(+X),
   * 3=left(−X), 4=top(+Y), 5=bottom(−Y). We assign values so opposites sum to 7:
   * top=1, bottom=6, front=2, back=5, right=3, left=4. orientDie() then rotates the
   * die so the rolled value faces up. (Face index i shows value faceValues[i].)
   */
  /** Per-skin die material (6-column pip atlas + surface params), cached. */
  private getSkinMaterial(skinIdx: number): StandardMaterial {
    const cached = this.skinMaterials.get(skinIdx);
    if (cached) return cached;
    const skin = DICE_SKINS[skinIdx] ?? DICE_SKINS[0]!;
    const COLS = 6;
    const CELL = 128;
    // pip value per faceUV index [front,back,right,left,top,bottom]
    const faceValues = [2, 5, 3, 4, 1, 6];
    const atlas = new DynamicTexture(`dieAtlas_${skinIdx}`, { width: COLS * CELL, height: CELL }, this.scene, false);
    const actx = atlas.getContext() as CanvasRenderingContext2D;
    for (let col = 0; col < COLS; col++) {
      actx.save();
      actx.translate(col * CELL, 0);
      this.drawPipFace(actx, faceValues[col]!, CELL, CELL, skin);
      actx.restore();
    }
    atlas.update();
    const mat = new StandardMaterial(`dieMat_skin${skinIdx}`, this.scene);
    mat.diffuseTexture = atlas;
    mat.specularColor = new Color3(...skin.specular);
    mat.emissiveColor = new Color3(...skin.emissive);
    this.skinMaterials.set(skinIdx, mat);
    return mat;
  }

  /** Swap both dice to the given skin's material (no-op when unchanged). */
  private setSkin(skinIdx: number): void {
    if (skinIdx === this.currentSkin) return;
    this.currentSkin = skinIdx;
    const mat = this.getSkinMaterial(skinIdx);
    if (this.dieMesh1) this.dieMesh1.material = mat;
    if (this.dieMesh2) this.dieMesh2.material = mat;
  }

  private createPipDie(name: string, size: number): Mesh {
    const COLS = 6;
    // Map each face to its column in the atlas via faceUV
    // Vector4(u0, v0, u1, v1) in UV space; each column is 1/6 wide.
    const faceUV: Vector4[] = [];
    for (let i = 0; i < COLS; i++) {
      const u0 = i / COLS;
      const u1 = (i + 1) / COLS;
      faceUV.push(new Vector4(u0, 0, u1, 1));
    }
    const box = MeshBuilder.CreateBox(name, { size, faceUV, wrap: true }, this.scene);
    box.material = this.getSkinMaterial(0);
    return box;
  }

  /**
   * Orient a die so `value` pips face up, lying flat on the felt. Base pose
   * (faceValues above): +Y=1, -Y=6, -Z=2, +Z=5, +X=3, -X=4.
   */
  private orientDie(mesh: AbstractMesh, value: number) {
    const H = Math.PI / 2;
    // Babylon is left-handed: X-axis rotations are inverted vs the right-handed
    // derivation, so the -Z/+Z (values 2/5) signs are flipped (verified on board).
    let q: Quaternion;
    switch (value) {
      case 6: q = Quaternion.RotationAxis(Axis.X, Math.PI); break; // -Y=6 → up
      case 2: q = Quaternion.RotationAxis(Axis.X, -H); break;      // -Z=2 → up
      case 5: q = Quaternion.RotationAxis(Axis.X, H); break;       // +Z=5 → up
      case 3: q = Quaternion.RotationAxis(Axis.Z, H); break;       // +X=3 → up
      case 4: q = Quaternion.RotationAxis(Axis.Z, -H); break;      // -X=4 → up
      default: q = Quaternion.Identity(); break;                   // +Y=1 already up
    }
    mesh.rotationQuaternion = q;
  }

  /** Cup lift / shake / descend / settle (reproduces DiceCup.playAnimation).
   *  `onDone` fires the instant the dice have settled and are visible on the felt. */
  private playDiceAnimation(d1: number, d2: number, onDone?: () => void) {
    if (this.diceAnimating) return;
    const cup = this.diceCupMesh;
    if (!cup) { onDone?.(); return; }
    this.diceAnimating = true;

    const die1 = this.dieMesh1;
    const die2 = this.dieMesh2;

    // Fixed XZ position of the cup — the cup ONLY moves up/down, never sideways.
    const fixedCupX = cup.position.x;
    const fixedCupZ = cup.position.z;
    // baseY is the resting Y (bottom of cup on the felt).
    const baseY = cup.position.y;

    let phase: "lift" | "shake" | "descend" | "toss" | "settle" = "lift";
    let elapsed = 0;
    let lastTime = performance.now();

    // Toss parameters: each die falls from above with a random tumble before
    // snapping to its rolled face (visual-only randomness — Math.random is
    // fine client-side; determinism binds the engine).
    const TOSS_MS = 300;
    const TOSS_FROM_Y = 1.1;
    const tumble = [0, 1].map(() => ({
      yaw: (2 + Math.random() * 2) * Math.PI * (Math.random() < 0.5 ? -1 : 1),
      pitch: (2 + Math.random() * 2) * Math.PI * (Math.random() < 0.5 ? -1 : 1),
      roll: (2 + Math.random() * 2) * Math.PI * (Math.random() < 0.5 ? -1 : 1),
    }));

    // Keep dice hidden below the felt while the cup is up.
    if (die1) die1.position.y = -2;
    if (die2) die2.position.y = -2;

    const obs = this.scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      if (phase === "lift") {
        elapsed += dt;
        const t = Math.min(elapsed / 300, 1);
        // Only Y changes — X/Z stay fixed at the cup's rest spot.
        cup.position.set(fixedCupX, baseY + CUP_LIFT * t, fixedCupZ);
        cup.rotation.z = Math.sin(t * Math.PI * 2) * SHAKE_AMP * 0.5;
        if (t >= 1) { elapsed = 0; phase = "shake"; }
      } else if (phase === "shake") {
        elapsed += dt;
        const t = elapsed / (100 * SHAKE_CYCLES);
        cup.position.set(fixedCupX, baseY + CUP_LIFT, fixedCupZ); // stay at peak Y, no drift
        cup.rotation.z = Math.sin(t * Math.PI * 2 * SHAKE_CYCLES) * SHAKE_AMP;
        // Cross-axis wobble makes the shake read as a real rattle, not a metronome.
        cup.rotation.x = Math.sin(t * Math.PI * 2 * SHAKE_CYCLES * 0.7) * SHAKE_AMP * 0.6;
        if (elapsed >= 100 * SHAKE_CYCLES) { elapsed = 0; phase = "descend"; }
      } else if (phase === "descend") {
        elapsed += dt;
        const t = Math.min(elapsed / 300, 1);
        cup.position.set(fixedCupX, baseY + CUP_LIFT * (1 - t), fixedCupZ); // Y only, X/Z fixed
        cup.rotation.z = 0;
        cup.rotation.x = 0;
        if (t >= 1) {
          elapsed = 0;
          phase = "toss";
          // Cup vanishes; the dice are revealed mid-air and tumble down.
          this.hideCup();
          if (die1) die1.position.set(fixedCupX - 0.3, TOSS_FROM_Y, fixedCupZ - 0.12);
          if (die2) die2.position.set(fixedCupX + 0.3, TOSS_FROM_Y, fixedCupZ + 0.12);
        }
      } else if (phase === "toss") {
        // Dice fall under ease-in gravity while tumbling randomly; the rolled
        // face snaps up the instant they land (settle bounce follows).
        elapsed += dt;
        const t = Math.min(elapsed / TOSS_MS, 1);
        const fall = t * t; // ease-in
        const y = TOSS_FROM_Y + (0.25 - TOSS_FROM_Y) * fall;
        const dice = [die1, die2];
        for (let i = 0; i < 2; i++) {
          const die = dice[i];
          if (!die) continue;
          die.position.y = y;
          const tw = tumble[i]!;
          die.rotationQuaternion = Quaternion.RotationYawPitchRoll(tw.yaw * t, tw.pitch * t, tw.roll * t);
        }
        if (t >= 1) {
          if (die1) this.orientDie(die1, d1);
          if (die2) this.orientDie(die2, d2);
          elapsed = 0;
          phase = "settle";
        }
      } else {
        // "settle" phase: dice bounce on the felt to a stop, faces already up.
        elapsed += dt;
        const decay = 1 - Math.min(elapsed / 300, 1);
        const bounce = Math.abs(Math.sin((elapsed / 80) * Math.PI)) * 0.15 * decay;
        if (die1) die1.position.y = 0.25 + bounce;
        if (die2) die2.position.y = 0.25 + bounce;
        if (elapsed >= 400) {
          // Dice have settled — pips show the rolled value (no number overlay).
          this.scene.onBeforeRenderObservable.remove(obs);
          this.diceAnimating = false;
          onDone?.();
        }
      }
    });
  }

  /**
   * Plays the dice animation and resolves EXACTLY when the dice have settled and
   * are visible on the felt — so the caller (the serial state queue) starts the
   * token move only after the cup animation finished AND the dice are shown. A
   * safety timeout guarantees the queue never deadlocks if rAF is throttled.
   */
  playDiceAnimationAsync(d1: number, d2: number, skinIdx = 0): Promise<void> {
    // Re-skin for the current roller before the sequence starts.
    this.setSkin(skinIdx);
    // Force any stale animation to end so we always start a fresh, full sequence.
    this.diceAnimating = false;
    return new Promise<void>((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      this.playDiceAnimation(d1, d2, finish);
      setTimeout(finish, DICE_SAFETY_MS); // safety net only
    });
  }
}
