#!/usr/bin/env bash
# Print LasPoly server list index (0=8080, 1=8090). Uses .laspoly-server.port when no arg.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT_FILE="$ROOT/.laspoly-server.port"

if [[ -n "${1:-}" ]]; then
  echo "$1"
  exit 0
fi

if [[ -f "$PORT_FILE" ]]; then
  case "$(tr -d '[:space:]' < "$PORT_FILE")" in
    8080) echo 0 ;;
    8090) echo 1 ;;
    *) echo 1 ;;
  esac
else
  echo 1
fi
