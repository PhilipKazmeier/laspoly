#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JAR="$ROOT/dist/LasPoly.jar"
JFX_VERSION="${JFX_VERSION:-21.0.2}"
JFX_DIR="${JFX_DIR:-$ROOT/.javafx/javafx-sdk-$JFX_VERSION/lib}"

if [[ ! -f "$JAR" ]]; then
  echo "Missing $JAR — build with ./gradlew jar or copy LasPoly.jar into dist/." >&2
  exit 1
fi

if [[ ! -d "$JFX_DIR" ]]; then
  echo "Downloading OpenJFX $JFX_VERSION ..."
  mkdir -p "$ROOT/.javafx"
  tmp="$(mktemp)"
  curl -fsSL -o "$tmp" "https://download2.gluonhq.com/openjfx/$JFX_VERSION/openjfx-${JFX_VERSION}_linux-x64_bin-sdk.zip"
  python3 -m zipfile -e "$tmp" "$ROOT/.javafx"
  rm -f "$tmp"
fi

if [[ $# -eq 0 ]]; then
  SERVER_IDX="$("$ROOT/scripts/resolve-server-index.sh")"
  PORT_FILE="$ROOT/.laspoly-server.port"
  if [[ -f "$PORT_FILE" ]]; then
    echo "Using server index $SERVER_IDX (port $(cat "$PORT_FILE"))" >&2
  else
    echo "Using server index $SERVER_IDX (default 8090)" >&2
  fi
  set -- "$SERVER_IDX"
fi

exec java \
  --module-path "$JFX_DIR" \
  --add-modules javafx.controls,javafx.fxml,javafx.graphics,javafx.media,javafx.swing,javafx.web \
  -cp "$JAR" \
  de.hhn.seb.labsw.laspoly.main.Main \
  "$@"
