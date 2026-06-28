#!/usr/bin/env bash
# Second LasPoly client on a separate virtual display (avoids WSLg JavaFX conflict).
# View it via VNC: connect to localhost:5901 (TigerVNC / RealVNC on Windows).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DISPLAY_NUM="${LASPOLY_DISPLAY_NUM:-99}"
VNC_PORT="${LASPOLY_VNC_PORT:-5901}"
export DISPLAY=":${DISPLAY_NUM}"

if ! command -v Xvfb >/dev/null; then
  echo "Need Xvfb: sudo apt install xvfb" >&2
  exit 1
fi

if ! xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then
  echo "Starting Xvfb on $DISPLAY ..."
  Xvfb "$DISPLAY" -screen 0 1280x720x24 -ac +extension GLX +render -noreset \
    > "$ROOT/.laspoly-xvfb.log" 2>&1 &
  echo $! > "$ROOT/.laspoly-xvfb.pid"
  sleep 1
fi

if command -v x11vnc >/dev/null; then
  if ! pgrep -f "x11vnc.*rfbport ${VNC_PORT}" >/dev/null 2>&1; then
    echo "Starting VNC on localhost:${VNC_PORT} (open in Windows VNC viewer) ..."
    x11vnc -display "$DISPLAY" -localhost -nopw -forever -shared -bg \
      -rfbport "$VNC_PORT" -o "$ROOT/.laspoly-vnc.log"
  else
    echo "VNC already on localhost:${VNC_PORT}"
  fi
else
  echo "Tip: sudo apt install x11vnc — then reconnect to see this window on localhost:${VNC_PORT}" >&2
fi

idx="${1:-1}"
echo "Starting client 2 on $DISPLAY → server index $idx"
exec "$ROOT/scripts/run.sh" "$idx"
