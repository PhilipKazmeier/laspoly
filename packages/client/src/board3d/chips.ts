// ---------------------------------------------------------------------------
// board3d/chips.ts — money made visible (plan phase 5): a small stack of
// casino chips arcs from payer to payee whenever LPD changes hands. The
// count scales with log10 of the amount; endpoints are token positions (or
// the table centre for the bank). Fire-and-forget, self-disposing.
// ---------------------------------------------------------------------------
import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
} from "@babylonjs/core";

const CHIP_COLORS = ["#c05b4d", "#5b7fa6", "#5f9a6e", "#d4b45a", "#262421"];

let chipTemplate: Mesh | null = null;
const chipMats: StandardMaterial[] = [];

function ensureTemplate(scene: Scene): Mesh {
  if (chipTemplate && !chipTemplate.isDisposed()) return chipTemplate;
  chipMats.length = 0;
  for (const hex of CHIP_COLORS) {
    const m = new StandardMaterial(`chipMat_${hex}`, scene);
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.15, 0.13, 0.1);
    chipMats.push(m);
  }
  chipTemplate = MeshBuilder.CreateCylinder(
    "chipTemplate",
    { diameter: 0.34, height: 0.07, tessellation: 20 },
    scene,
  );
  chipTemplate.setEnabled(false);
  return chipTemplate;
}

/** Number of chips for an amount: 1 chip at 1–9 LPD up to 4 chips at 1000+. */
function chipCount(amount: number): number {
  return Math.max(1, Math.min(4, Math.floor(Math.log10(Math.max(1, Math.abs(amount)))) + 1));
}

/**
 * Fly a chip stack from `from` to `to` (world positions). Staggered starts,
 * an eased arc, a tiny scatter on landing. Never blocks the state queue.
 */
export function flyChips(scene: Scene, from: Vector3, to: Vector3, amount: number): void {
  const template = ensureTemplate(scene);
  const n = chipCount(amount);
  const DUR = 750;
  const STAGGER = 90;

  for (let i = 0; i < n; i++) {
    const chip = template.clone(`chip_${performance.now()}_${i}`);
    chip.setEnabled(true);
    chip.material = chipMats[i % chipMats.length]!;
    chip.isPickable = false;
    const start = performance.now() + i * STAGGER;
    const jitter = new Vector3((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4);
    const src = from.add(new Vector3(0, 0.25, 0));
    const dst = to.add(jitter).add(new Vector3(0, 0.12, 0));

    const obs = scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      if (now < start) { chip.position.copyFrom(src); return; }
      const raw = (now - start) / DUR;
      const t = Math.min(1, raw);
      const k = 1 - Math.pow(1 - t, 2); // ease-out
      const p = Vector3.Lerp(src, dst, k);
      p.y += Math.sin(t * Math.PI) * 1.6; // the arc
      chip.position.copyFrom(p);
      chip.rotation.x = t * Math.PI * 2;
      if (raw >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        // Rest briefly on the table, then fade out by disposal.
        chip.rotation.x = 0;
        setTimeout(() => chip.dispose(), 900);
      }
    });
  }
}
