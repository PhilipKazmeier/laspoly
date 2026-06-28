#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JAR="$ROOT/dist/LasPoly.jar"
JFX_VERSION="${JFX_VERSION:-21.0.2}"
JFX_DIR="${JFX_DIR:-$ROOT/.javafx/javafx-sdk-$JFX_VERSION/lib}"

if [[ ! -d "$JFX_DIR" ]]; then
  "$ROOT/scripts/run.sh" --help >/dev/null 2>&1 || true
fi

exec java \
  --module-path "$JFX_DIR" \
  --add-modules javafx.controls,javafx.fxml,javafx.graphics,javafx.media,javafx.swing,javafx.web \
  -cp "$JAR" \
  de.hhn.seb.labsw.laspoly.debug.GameDebugger \
  "$@"
