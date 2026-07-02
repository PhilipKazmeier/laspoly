// ---------------------------------------------------------------------------
// board3d/cards.ts — the action-card draw animation: a card rises from the
// deck, flips from its patterned back to a face bearing the card title,
// hovers a beat, then fades out. Resolves when done; an internal safety
// timeout guarantees the serial state queue can never stall on it.
// ---------------------------------------------------------------------------
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Texture,
  DynamicTexture,
  Scene,
} from "@babylonjs/core";
import { SCALE } from "./constants.js";

// Deck rest position (matches the cardDeck mesh in tiles.ts).
const DECK_XZ = 240 * SCALE; // = 4.0

const RISE_FLIP_MS = 650;
const HOVER_MS = 450;
const FADE_MS = 220;
const SAFETY_MS = 2500;

/** Draw the card face (cream, gold border, "?" watermark, wrapped title). */
function makeCardFace(scene: Scene, title: string): DynamicTexture {
  const W = 512, H = 720;
  const tex = new DynamicTexture("cardFaceTex", { width: W, height: H }, scene, true);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  ctx.fillStyle = "#f7f2df";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.roundRect(16, 16, W - 32, H - 32, 24);
  ctx.stroke();
  // Pale watermark
  ctx.fillStyle = "rgba(201,162,39,0.18)";
  ctx.font = "bold 420px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", W / 2, H / 2 + 30);
  // Title, wrapped
  ctx.fillStyle = "#1c1917";
  ctx.font = "bold 64px Arial";
  const words = title.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > W - 96 && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, 3);
  const startY = H / 2 - ((shown.length - 1) * 76) / 2;
  shown.forEach((line, i) => ctx.fillText(line, W / 2, startY + i * 76));
  tex.update();
  return tex;
}

/**
 * Plays the card-draw animation. The card billboard rises from the deck while
 * "flipping" (scale-X crush with a texture swap at the crossover — reads as a
 * flip from every camera angle), hovers, then fades and disposes.
 */
export function animateCardDrawAsync(scene: Scene, title: string): Promise<void> {
  return new Promise<void>((resolve) => {
    // Test/integration hook: lets e2e (and the verification harness) know the
    // fly-in started without polling the 3D scene.
    window.dispatchEvent(new CustomEvent("laspoly:cardfly", { detail: { title } }));
    const plane = MeshBuilder.CreatePlane("cardDraw", { width: 1.5, height: 2.1 }, scene);
    plane.billboardMode = 7; // always face the camera
    plane.isPickable = false;
    plane.position.set(DECK_XZ, 0.4, DECK_XZ);

    const backTex = new Texture("/assets/cardpattern.png", scene);
    const faceTex = makeCardFace(scene, title);
    const mat = new StandardMaterial("cardDrawMat", scene);
    mat.diffuseTexture = backTex;
    mat.emissiveColor = new Color3(0.45, 0.45, 0.45); // readable in the dark scene
    mat.specularColor = new Color3(0, 0, 0);
    mat.backFaceCulling = false;
    plane.material = mat;

    const START_Y = 0.4;
    const END = { x: 1.5, y: 3.2, z: 1.5 };
    let phase: "riseflip" | "hover" | "fade" = "riseflip";
    let flipped = false;
    let elapsed = 0;
    let lastTime = performance.now();
    let done = false;

    // eslint-disable-next-line prefer-const
    let obs: ReturnType<typeof scene.onBeforeRenderObservable.add>;
    const finish = () => {
      if (done) return;
      done = true;
      scene.onBeforeRenderObservable.remove(obs);
      clearTimeout(safety);
      plane.dispose();
      faceTex.dispose();
      resolve();
    };
    const safety = setTimeout(finish, SAFETY_MS);

    obs = scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      elapsed += now - lastTime;
      lastTime = now;

      if (phase === "riseflip") {
        const t = Math.min(elapsed / RISE_FLIP_MS, 1);
        const e = 1 - Math.pow(1 - t, 3); // ease-out rise
        plane.position.set(
          DECK_XZ + (END.x - DECK_XZ) * e,
          START_Y + (END.y - START_Y) * e,
          DECK_XZ + (END.z - DECK_XZ) * e,
        );
        // Flip: crush to zero width at the midpoint and swap to the face.
        plane.scaling.x = Math.abs(Math.cos(Math.PI * t));
        if (t >= 0.5 && !flipped) {
          flipped = true;
          mat.diffuseTexture = faceTex;
        }
        if (t >= 1) { plane.scaling.x = 1; elapsed = 0; phase = "hover"; }
      } else if (phase === "hover") {
        // Gentle bob while the player reads the title.
        plane.position.y = END.y + 0.06 * Math.sin((elapsed / HOVER_MS) * Math.PI * 2);
        if (elapsed >= HOVER_MS) { elapsed = 0; phase = "fade"; }
      } else {
        const t = Math.min(elapsed / FADE_MS, 1);
        plane.visibility = 1 - t;
        if (t >= 1) finish();
      }
    });
  });
}
