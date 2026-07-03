// ---------------------------------------------------------------------------
// director.ts — the one owner of camera movement (plan phase 3).
//
// Turn grammar: focus(player) → diceMoment() → follow(token) → present(tile)
// → release(). The StateQueue calls these at the matching points of its
// serial animation pipeline; every move is a fire-and-forget eased tween, so
// the Director never adds wall-clock time to the queue.
//
// Two intensities: "full" (the local player's turn — camera leans in, follows
// the token) and "calm" (bot turns — a gentle lean toward the mover's board
// quadrant, no following). A pointer-down from the user cancels the current
// move and silences the Director until the next focus() call (i.e. for the
// rest of that turn) — the player always wins the camera fight.
//
// prefers-reduced-motion: every tween becomes an instant cut.
// ---------------------------------------------------------------------------
import {
  Scene,
  ArcRotateCamera,
  Vector3,
  AbstractMesh,
  PointerEventTypes,
} from "@babylonjs/core";
import { tileXZ } from "./board3d/constants.js";

export type Intensity = "full" | "calm";
export type ViewPreset = "standard" | "top";

interface CamPose {
  alpha: number;
  beta: number;
  radius: number;
  target: Vector3;
}

const HOME: CamPose = {
  alpha: -Math.PI / 2,
  beta: Math.PI / 3.2,
  radius: 32,
  target: Vector3.Zero(),
};
const TOP: CamPose = {
  alpha: -Math.PI / 2,
  beta: 0.25,
  radius: 38,
  target: Vector3.Zero(),
};

/** cubic-bezier(.22,1,.36,1)-ish: decisive start, soft landing (see tokens.css). */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export class Director {
  private tween: {
    from: CamPose;
    to: CamPose;
    start: number;
    duration: number;
    resolve: (() => void) | null;
  } | null = null;
  private followMesh: AbstractMesh | null = null;
  private userOverride = false;
  private intensity: Intensity = "calm";
  private view: ViewPreset = "standard";
  private celebrating = false;

  private get reducedMotion(): boolean {
    return typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  constructor(
    private scene: Scene,
    private camera: ArcRotateCamera,
  ) {
    // Step tweens + follow every frame.
    scene.onBeforeRenderObservable.add(() => this.step());
    // The player always wins: any pointer-down cancels direction for this turn.
    scene.onPointerObservable.add((pi) => {
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        this.tween?.resolve?.();
        this.tween = null;
        this.followMesh = null;
        this.userOverride = true;
        this.celebrating = false;
      }
    });
  }

  /** Home pose for the current view preset. */
  private home(): CamPose {
    return this.view === "top" ? TOP : HOME;
  }

  setIntensity(i: Intensity): void {
    this.intensity = i;
  }

  /** View toggle (standard/top): an instant preset cut, and direction resumes from it. */
  setView(v: ViewPreset): void {
    this.view = v;
    this.tween = null;
    this.followMesh = null;
    const p = this.home();
    this.apply(p);
  }

  /**
   * A new turn begins for the token at `pos`. Full: lean in toward the token.
   * Calm: a subtle lean toward its board quadrant. Clears any user override —
   * the override lasts exactly one turn.
   */
  focus(pos: number): void {
    this.userOverride = false;
    this.celebrating = false;
    const [x, z] = tileXZ(pos);
    const home = this.home();
    const full = this.intensity === "full";
    const lean = full ? 0.45 : 0.18;
    this.moveTo({
      alpha: home.alpha,
      beta: full ? home.beta - 0.06 : home.beta,
      radius: full ? home.radius - 7 : home.radius - 2,
      target: new Vector3(x * lean, 0, z * lean),
    }, 700);
  }

  /** The cup lifts and the dice tumble (board centre). Full intensity only. */
  diceMoment(): void {
    if (this.userOverride || this.intensity !== "full") return;
    const home = this.home();
    this.moveTo({
      alpha: home.alpha,
      beta: home.beta - 0.1,
      radius: home.radius - 10,
      target: new Vector3(0, 0.5, 0),
    }, 600);
  }

  /** Track a moving token. Full intensity only; ends at the next move/release. */
  follow(mesh: AbstractMesh): void {
    if (this.userOverride || this.intensity !== "full") return;
    this.tween = null;
    this.followMesh = mesh;
  }

  /** Hold on a tile (e.g. the landed property while its prompt is up). */
  present(pos: number): void {
    if (this.userOverride) return;
    const [x, z] = tileXZ(pos);
    const home = this.home();
    const full = this.intensity === "full";
    this.moveTo({
      alpha: home.alpha,
      beta: home.beta - (full ? 0.08 : 0),
      radius: full ? home.radius - 9 : home.radius - 3,
      target: new Vector3(x * 0.55, 0, z * 0.55),
    }, 600);
  }

  /** The turn's business is done: ease back to the table overview. */
  release(): void {
    if (this.userOverride) return;
    this.followMesh = null;
    this.moveTo(this.home(), 900);
  }

  /**
   * Win orbit (migrated from Board3D.playWinCelebration): a slow full spin.
   * Cancelled by any pointer-down; hard cap handled by the caller's timeout.
   */
  celebrate(): void {
    this.userOverride = false;
    this.followMesh = null;
    this.tween = null;
    this.celebrating = true;
  }

  stopCelebration(): void {
    this.celebrating = false;
  }

  // -- internals ------------------------------------------------------------

  private apply(p: CamPose): void {
    this.camera.alpha = p.alpha;
    this.camera.beta = p.beta;
    this.camera.radius = p.radius;
    this.camera.setTarget(p.target.clone());
  }

  private moveTo(to: CamPose, duration: number): void {
    this.followMesh = null;
    if (this.reducedMotion) {
      this.tween = null;
      this.apply(to);
      return;
    }
    this.tween = {
      from: {
        alpha: this.camera.alpha,
        beta: this.camera.beta,
        radius: this.camera.radius,
        target: this.camera.target.clone(),
      },
      to,
      start: performance.now(),
      duration,
      resolve: null,
    };
  }

  private step(): void {
    if (this.celebrating) {
      this.camera.alpha += 0.006;
      return;
    }
    if (this.followMesh) {
      // Ease the look-at toward the moving token; radius/angles stay put.
      const t = this.camera.target;
      const m = this.followMesh.position;
      this.camera.setTarget(new Vector3(
        t.x + (m.x - t.x) * 0.08,
        t.y + (0 - t.y) * 0.08,
        t.z + (m.z - t.z) * 0.08,
      ));
      return;
    }
    const tw = this.tween;
    if (!tw) return;
    const raw = (performance.now() - tw.start) / tw.duration;
    const k = easeOut(Math.min(1, raw));
    this.camera.alpha = tw.from.alpha + (tw.to.alpha - tw.from.alpha) * k;
    this.camera.beta = tw.from.beta + (tw.to.beta - tw.from.beta) * k;
    this.camera.radius = tw.from.radius + (tw.to.radius - tw.from.radius) * k;
    this.camera.setTarget(Vector3.Lerp(tw.from.target, tw.to.target, k));
    if (raw >= 1) {
      tw.resolve?.();
      this.tween = null;
    }
  }
}
