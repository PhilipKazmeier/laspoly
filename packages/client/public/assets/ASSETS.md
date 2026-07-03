# Asset manifest & licenses

Vendored third-party assets (no CDN — the deploy is a single offline-capable container).
Added 2026-07-03 for the Back Room overhaul (docs/idea-brief.md §6).

| File | Source | License |
|---|---|---|
| `fonts/fraunces-600-latin.woff2` | Google Fonts — Fraunces wght 600, latin subset (fonts.google.com/specimen/Fraunces) | SIL OFL 1.1 |
| `fonts/inter-var-latin.woff2` | Google Fonts — Inter variable (covers wght 400–600), latin subset (fonts.google.com/specimen/Inter) | SIL OFL 1.1 |
| `tex/wood_dark_diff_1k.jpg` | Poly Haven — "Dark Wood" diffuse 1K (polyhaven.com/a/dark_wood) | CC0 |
| `tex/wood_dark_nor_1k.jpg` | Poly Haven — "Dark Wood" normal (GL) 1K (polyhaven.com/a/dark_wood) | CC0 |
| `env/warm_interior_1k.hdr` | Poly Haven — "Artist Workshop" HDRI 1K (polyhaven.com/a/artist_workshop) | CC0 |

The latin subsets include the German set (äöüß, €).

All other files under `assets/` (car/house/dice OBJ models, felt/card/dollar textures,
audio) are ports of the original LasPoly game's own assets (see `old-java/`), not
third-party downloads.
