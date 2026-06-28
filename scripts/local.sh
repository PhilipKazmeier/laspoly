#!/usr/bin/env bash
# Local dev helper — build, run server, run client, smoke-test.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT_FILE="$ROOT/.laspoly-server.port"
PID_FILE="$ROOT/.laspoly-server.pid"
WIN_PID_FILE="$ROOT/.laspoly-win-server.pid"

usage() {
  cat <<'EOF'
Usage: ./scripts/local.sh <command>

  build       ./gradlew jar serverJar
  server      start backend (auto-picks 8080 or 8090)
  server-stop stop background server started by this script
  client      run JavaFX client (pass server index: 0=8080, 1=8090)
  client2     second client on virtual display (+ VNC on :5901)
  win-client  launch native Windows client (needs setup-windows-client.sh once)
  win-server  backend on Windows (required for win-client — WSL server is not reachable)
  win-play    win-server + two Windows clients
  test        curl smoke-test against running server
  status      show server port / API health

Local tryout (two players, one machine):
  Terminal 1:  ./scripts/local.sh server
  Terminal 2:  ./scripts/local.sh client        # WSLg window
  Terminal 3:  ./scripts/local.sh client2       # VNC localhost:5901
  Or Windows:  ./scripts/local.sh win-client   # native window (no VNC)

One-liner API check (no GUI):
  ./scripts/local.sh build && ./scripts/local.sh server && ./scripts/local.sh test
EOF
}

pick_port() {
  local p
  for p in 8080 8090; do
    if ! timeout 1 bash -c "echo > /dev/tcp/127.0.0.1/$p" 2>/dev/null; then
      echo "$p"
      return
    fi
  done
  echo "Neither 8080 nor 8090 is free. Stop the other service first." >&2
  exit 1
}

server_index_for_port() {
  case "$1" in
    8080) echo 0 ;;
    8090) echo 1 ;;
    *) echo 1 ;;
  esac
}

cmd_build() {
  ./gradlew jar serverJar -q
  echo "Built dist/LasPoly.jar and dist/LasPoly-server.jar"
}

cmd_server() {
  cmd_build
  local port
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    port="$(cat "$PORT_FILE")"
    echo "Server already running on port $port (pid $(cat "$PID_FILE"))"
    echo "Client: ./scripts/local.sh client $(server_index_for_port "$port")"
    return
  fi
  port="$(pick_port)"
  echo "$port" > "$PORT_FILE"
  nohup env LASPOLY_BASE_URI="http://0.0.0.0:${port}/laspoly/" \
    "$ROOT/scripts/run-server.sh" > "$ROOT/.laspoly-server.log" 2>&1 &
  echo $! > "$PID_FILE"
  sleep 2
  if ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Server failed to start. Log:" >&2
    tail -20 "$ROOT/.laspoly-server.log" >&2
    exit 1
  fi
  echo "Server running on http://localhost:${port}/laspoly/"
  echo "Log: .laspoly-server.log"
  echo "Client: ./scripts/local.sh client $(server_index_for_port "$port")"
}

cmd_server_stop() {
  if [[ -f "$PID_FILE" ]]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE" "$PORT_FILE"
    echo "Server stopped."
  else
    echo "No server pid file."
  fi
}

cmd_client() {
  local idx="${1:-}"
  if [[ ! -f "$PID_FILE" ]] || ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Server not running — starting it ..."
    cmd_server
  fi
  if [[ -z "$idx" && -f "$PORT_FILE" ]]; then
    idx="$(server_index_for_port "$(cat "$PORT_FILE")")"
  fi
  idx="${idx:-0}"
  if ! cmd_test "$(cat "$PORT_FILE")" >/dev/null 2>&1; then
    echo "Server health check failed. See .laspoly-server.log" >&2
    exit 1
  fi
  echo "Starting client → server index $idx (port $(cat "$PORT_FILE"))"
  exec "$ROOT/scripts/run.sh" "$idx"
}

cmd_client2() {
  local idx="${1:-}"
  if [[ ! -f "$PID_FILE" ]] || ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Server not running — starting it ..."
    cmd_server
  fi
  if [[ -z "$idx" && -f "$PORT_FILE" ]]; then
    idx="$(server_index_for_port "$(cat "$PORT_FILE")")"
  fi
  idx="${idx:-1}"
  if ! cmd_test "$(cat "$PORT_FILE")" >/dev/null 2>&1; then
    echo "Server health check failed. See .laspoly-server.log" >&2
    exit 1
  fi
  exec "$ROOT/scripts/run-client2.sh" "$idx"
}

cmd_win_server() {
  local port="${1:-8090}"
  cmd_build
  if [[ ! -f "$ROOT/.tools/win-jre/bin/java.exe" ]]; then
    echo "Setting up Windows JRE ..."
    "$ROOT/scripts/setup-windows-client.sh"
  fi
  cmd_server_stop 2>/dev/null || true
  cmd_win_server_stop 2>/dev/null || true
  echo "$port" > "$PORT_FILE"
  local win_temp
  win_temp="$(powershell.exe -NoProfile -Command '[Console]::Write($env:TEMP)' | tr -d '\r')"
  cp "$ROOT/dist/LasPoly-server.jar" "$(wslpath -u "$win_temp")/LasPoly-server.jar"
  local win_pid
  win_pid="$(powershell.exe -NoProfile -ExecutionPolicy Bypass \
    -File "$(wslpath -w "$ROOT/scripts/start-win-server.ps1")" "$port" | tr -d '\r')"
  if [[ -z "$win_pid" ]]; then
    echo "Windows server failed to start." >&2
    exit 1
  fi
  echo "$win_pid" > "$WIN_PID_FILE"
  sleep 3
  if ! cmd_test "$port" >/dev/null 2>&1; then
    echo "Windows server health check failed." >&2
    exit 1
  fi
  echo "Windows server on http://localhost:${port}/laspoly/ (pid $win_pid)"
  echo "Clients: ./scripts/local.sh win-client 1"
}

cmd_win_server_stop() {
  if [[ -f "$WIN_PID_FILE" ]]; then
    powershell.exe -NoProfile -ExecutionPolicy Bypass \
      -File "$(wslpath -w "$ROOT/scripts/stop-win-server.ps1")" "$(cat "$WIN_PID_FILE")" 2>/dev/null || true
    rm -f "$WIN_PID_FILE"
    echo "Windows server stopped."
  else
    powershell.exe -NoProfile -ExecutionPolicy Bypass \
      -File "$(wslpath -w "$ROOT/scripts/stop-win-server.ps1")" 0 2>/dev/null || true
  fi
}

cmd_win_play() {
  cmd_win_server 8090
  local ps1
  ps1="$(wslpath -w "$ROOT/scripts/run-client-windows.ps1")"
  powershell.exe -NoProfile -Command \
    "Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','$ps1','1'; Start-Sleep -Seconds 2; Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','$ps1','1'"
  echo "Two Windows clients launched. Use different usernames on each."
}

cmd_win_client() {
  local idx="${1:-}"
  if [[ ! -f "$WIN_PID_FILE" ]] || ! powershell.exe -NoProfile -Command "exit !(Get-Process -Id $(cat "$WIN_PID_FILE") -ErrorAction SilentlyContinue)" 2>/dev/null; then
    echo "Windows server not running — starting it ..."
    cmd_win_server 8090
  fi
  idx="${idx:-1}"
  if [[ ! -f "$ROOT/.tools/win-jre/bin/java.exe" ]]; then
    echo "Setting up Windows JRE + JavaFX (one-time download) ..."
    "$ROOT/scripts/setup-windows-client.sh"
  fi
  powershell.exe -NoProfile -ExecutionPolicy Bypass \
    -File "$(wslpath -w "$ROOT/scripts/run-client-windows.ps1")" "$idx"
}

cmd_test() {
  local port="${1:-}"
  if [[ -z "$port" && -f "$PORT_FILE" ]]; then
    port="$(cat "$PORT_FILE")"
  fi
  port="${port:-8090}"
  local base="http://localhost:${port}/laspoly"
  local curl_cmd=(curl -fsS)
  if [[ -f "$WIN_PID_FILE" ]]; then
    curl_cmd=(curl.exe -fsS)
  fi
  echo "Testing $base ..."
  "${curl_cmd[@]}" "$base/games" | grep -q '^\[' && echo "  GET /games OK"
  local reg
  reg="$("${curl_cmd[@]}" -X POST "$base/users/register" \
    -H 'Content-Type: application/json' \
    -d '{"name":"smoke","id":-1,"locale":"en"}')"
  echo "$reg" | grep -q '"id":' && echo "  POST /users/register OK"
  "${curl_cmd[@]}" -X POST "$base/games/add" \
    -H 'Content-Type: application/json' \
    -d "[\"SmokeGame\", $reg]" >/dev/null
  echo "  POST /games/add OK"
  "${curl_cmd[@]}" "$base/games" | grep -q SmokeGame && echo "  game in list OK"
  echo "Smoke test passed on port $port."
}

cmd_status() {
  if [[ -f "$WIN_PID_FILE" ]]; then
    echo "Server: Windows pid $(cat "$WIN_PID_FILE") port $(cat "$PORT_FILE" 2>/dev/null || echo 8090)"
    cmd_test "$(cat "$PORT_FILE" 2>/dev/null || echo 8090)" || true
  elif [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Server: running pid $(cat "$PID_FILE") port $(cat "$PORT_FILE")"
    cmd_test "$(cat "$PORT_FILE")" || true
  else
    echo "Server: not running (use ./scripts/local.sh server)"
  fi
  if [[ -n "${DISPLAY:-}" ]]; then
    echo "Display: $DISPLAY (GUI client should work)"
  else
    echo "Display: not set — need WSLg for ./scripts/local.sh client"
  fi
}

case "${1:-}" in
  build) cmd_build ;;
  server) cmd_server ;;
  server-stop) cmd_server_stop ;;
  client) shift; cmd_client "${1:-}" ;;
  client2) shift; cmd_client2 "${1:-}" ;;
  win-client) shift; cmd_win_client "${1:-}" ;;
  win-server) shift; cmd_win_server "${1:-8090}" ;;
  win-server-stop) cmd_win_server_stop ;;
  win-play) cmd_win_play ;;
  test) shift; cmd_test "${1:-}" ;;
  status) cmd_status ;;
  -h|--help|help|"") usage ;;
  *) echo "Unknown command: $1" >&2; usage; exit 1 ;;
esac
