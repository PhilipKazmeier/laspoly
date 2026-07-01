// Two visual themes: the original "classic" look and the new "neon" (Neon-Vegas
// glass) look. The choice is persisted in localStorage. The DOM applies it via a
// `theme-classic` body class (see the .theme-classic override block in ui.ts);
// the 3D board reads it at construction (see board3d.ts). Switching reloads the
// page so the Babylon scene rebuilds cleanly under the new palette.

export type Theme = "neon" | "classic";

const KEY = "laspoly_theme";

export function getTheme(): Theme {
  return localStorage.getItem(KEY) === "classic" ? "classic" : "neon";
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
}

/** Toggle the body class that drives the DOM theme. Call before/at UI build. */
export function applyThemeClass(theme: Theme = getTheme()): void {
  document.body.classList.toggle("theme-classic", theme === "classic");
}
