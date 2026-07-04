// ---------------------------------------------------------------------------
// tokenFactory.ts — procedural player-token meshes shared by the 3D board and
// the room-picker preview. figureIndex 0-5 stay the OBJ vehicles (loaded
// elsewhere); 6-8 are built here; CUSTOM_FIGURE_INDEX renders an uploaded
// picture as a standee (image plane on a base disc).
// ---------------------------------------------------------------------------
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Texture,
  Mesh,
  Scene,
  Vector3,
} from "@babylonjs/core";

/**
 * Build the procedural figure for `figureIndex` (6 = top hat, 7 = pawn,
 * 8 = rocket), normalized to roughly token size and centred on the origin.
 * Returns null for indices this factory doesn't own (0-5 vehicles, custom).
 */
export function buildProceduralToken(scene: Scene, figureIndex: number): Mesh | null {
  const parts: Mesh[] = [];
  if (figureIndex === 6) {
    // Top hat: wide brim + tall crown.
    const brim = MeshBuilder.CreateCylinder("th_brim", { diameter: 0.52, height: 0.06, tessellation: 24 }, scene);
    brim.position.y = 0.03;
    const crown = MeshBuilder.CreateCylinder("th_crown", { diameter: 0.32, height: 0.38, tessellation: 24 }, scene);
    crown.position.y = 0.25;
    parts.push(brim, crown);
  } else if (figureIndex === 7) {
    // Pawn: base disc → tapered stem → sphere head.
    const base = MeshBuilder.CreateCylinder("pw_base", { diameter: 0.42, height: 0.08, tessellation: 20 }, scene);
    base.position.y = 0.04;
    const stem = MeshBuilder.CreateCylinder("pw_stem", { diameterBottom: 0.26, diameterTop: 0.14, height: 0.34, tessellation: 20 }, scene);
    stem.position.y = 0.25;
    const head = MeshBuilder.CreateSphere("pw_head", { diameter: 0.24, segments: 12 }, scene);
    head.position.y = 0.5;
    parts.push(base, stem, head);
  } else if (figureIndex === 8) {
    // Rocket: body + nose cone + three fins.
    const body = MeshBuilder.CreateCylinder("rk_body", { diameter: 0.24, height: 0.42, tessellation: 16 }, scene);
    body.position.y = 0.25;
    const nose = MeshBuilder.CreateCylinder("rk_nose", { diameterBottom: 0.24, diameterTop: 0, height: 0.2, tessellation: 16 }, scene);
    nose.position.y = 0.56;
    parts.push(body, nose);
    for (let i = 0; i < 3; i++) {
      const fin = MeshBuilder.CreateBox(`rk_fin_${i}`, { width: 0.05, height: 0.2, depth: 0.16 }, scene);
      const angle = (i / 3) * Math.PI * 2;
      fin.position.set(Math.sin(angle) * 0.14, 0.1, Math.cos(angle) * 0.14);
      fin.rotation.y = angle;
      parts.push(fin);
    }
  } else {
    return null;
  }
  const merged = Mesh.MergeMeshes(parts, true, true, undefined, false, false);
  if (!merged) return null;
  merged.name = `tokenTpl_${figureIndex}`;
  return merged;
}

/**
 * Custom-image standee: the uploaded picture on a vertical billboard plane
 * over a small player-coloured base disc. Babylon Textures accept data URLs
 * directly. The plane must NOT be glow-registered or a shadow caster (alpha
 * planes cast ugly shadows).
 */
export function makeStandee(scene: Scene, dataUrl: string, color: Color3, name: string): Mesh {
  const base = MeshBuilder.CreateCylinder(`${name}_base`, { diameter: 0.45, height: 0.06, tessellation: 20 }, scene);
  base.position.y = 0.03;
  const baseMat = new StandardMaterial(`${name}_baseMat`, scene);
  baseMat.diffuseColor = color.scale(0.4);
  baseMat.emissiveColor = color;
  baseMat.specularColor = new Color3(0, 0, 0);
  base.material = baseMat;

  const plane = MeshBuilder.CreatePlane(`${name}_img`, { width: 0.58, height: 0.58 }, scene);
  plane.position.y = 0.36;
  plane.billboardMode = 7; // face the camera from every angle
  const mat = new StandardMaterial(`${name}_imgMat`, scene);
  const tex = new Texture(dataUrl, scene);
  tex.hasAlpha = true;
  mat.diffuseTexture = tex;
  mat.emissiveColor = new Color3(0.85, 0.85, 0.85); // legible in the dark scene
  mat.specularColor = new Color3(0, 0, 0);
  mat.backFaceCulling = false;
  plane.material = mat;
  plane.parent = base;
  plane.position = new Vector3(0, 0.33, 0);
  base.isPickable = false;
  plane.isPickable = false;
  return base;
}
