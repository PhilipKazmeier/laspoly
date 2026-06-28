#!/bin/sh
set -eu

java -Djava.awt.headless=true -jar /app/server.jar &
server_pid=$!

for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:8080/laspoly/games" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "LasPoly server exited during startup" >&2
    exit 1
  fi
  sleep 1
done

trap 'kill "$server_pid" 2>/dev/null || true' INT TERM

exec nginx -g 'daemon off;'
