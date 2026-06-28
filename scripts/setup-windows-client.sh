#!/usr/bin/env bash
# One-time download of portable Windows JRE + OpenJFX for a native second client window.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JFX_VERSION="${JFX_VERSION:-21.0.2}"
TOOLS="$ROOT/.tools"
JRE_DIR="$TOOLS/win-jre"
JFX_DIR="$TOOLS/win-javafx/javafx-sdk-$JFX_VERSION"

mkdir -p "$TOOLS"

if [[ ! -x "$JRE_DIR/bin/java.exe" ]]; then
  echo "Downloading Temurin JRE 21 (Windows x64) ..."
  tmp="$(mktemp)"
  curl -fsSL -o "$tmp" \
    "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse?project=jdk"
  rm -rf "$JRE_DIR"
  mkdir -p "$JRE_DIR"
  python3 -m zipfile -e "$tmp" "$TOOLS"
  rm -f "$tmp"
  extracted="$(find "$TOOLS" -maxdepth 1 -type d -name 'jdk-*' | head -1)"
  if [[ -n "$extracted" && "$extracted" != "$JRE_DIR" ]]; then
    rm -rf "$JRE_DIR"
    mv "$extracted" "$JRE_DIR"
  fi
  echo "JRE → $JRE_DIR"
fi

if [[ ! -d "$JFX_DIR/lib" ]]; then
  echo "Downloading OpenJFX $JFX_VERSION (Windows x64) ..."
  tmp="$(mktemp)"
  curl -fsSL -o "$tmp" \
    "https://download2.gluonhq.com/openjfx/$JFX_VERSION/openjfx-${JFX_VERSION}_windows-x64_bin-sdk.zip"
  rm -rf "$TOOLS/win-javafx"
  mkdir -p "$TOOLS/win-javafx"
  python3 -m zipfile -e "$tmp" "$TOOLS/win-javafx"
  rm -f "$tmp"
  echo "JavaFX → $JFX_DIR"
fi

echo "Done. Run second client from Windows:"
echo "  powershell.exe -ExecutionPolicy Bypass -File \"$(wslpath -w "$ROOT/scripts/run-client-windows.ps1")\" 1"
