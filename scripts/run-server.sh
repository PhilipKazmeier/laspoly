#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JAR="$ROOT/dist/LasPoly-server.jar"
PORT="${LASPOLY_PORT:-8080}"
BASE_URI="${LASPOLY_BASE_URI:-http://0.0.0.0:${PORT}/laspoly/}"

if [[ ! -f "$JAR" ]]; then
  echo "Building server jar ..."
  (cd "$ROOT" && ./gradlew serverJar -q)
fi

exec java -Djava.awt.headless=true -jar "$JAR" "$BASE_URI"
