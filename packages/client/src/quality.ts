// Graphics quality: "high" enables the heavy visual effects (bloom pipeline,
// glow layer, shadows, ambient particles); "low" disables them for weak GPUs.
// Persisted in localStorage; switching reloads the page so the Babylon scene
// rebuilds cleanly with or without the effect pipeline (same proven pattern
// as the theme switch in theme.ts).

export type Quality = "high" | "low";

const KEY = "laspoly_quality";

export function getQuality(): Quality {
  return localStorage.getItem(KEY) === "low" ? "low" : "high";
}

export function setQuality(quality: Quality): void {
  localStorage.setItem(KEY, quality);
}
