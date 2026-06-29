# LasPoly Web — Deployment Guide

Single Docker container: serves the Babylon.js client and WebSocket game server on one port.

## Quick start

```sh
docker build -f Dockerfile.web -t laspoly-web .
docker run -d --init -p 8080:8080 --restart unless-stopped laspoly-web
```

Open **http://localhost:8080/** in a browser.  
WebSocket connects to `ws://<host>:8080` (same origin, no extra config needed).

## Docker Compose

```sh
docker compose -f docker-compose.web.yml up -d
```

## Environment variables

| Variable           | Default | Description |
|--------------------|---------|-------------|
| `PORT`             | `8080`  | HTTP/WS listen port |
| `ALLOWED_ORIGINS`  | *(unset)* | Comma-separated allowed WebSocket origins. **Unset = allow all.** Set in production. |

Copy `.env.example` to `.env` and adjust as needed. Example for production:

```sh
PORT=8080
ALLOWED_ORIGINS=https://laspoly.example.com
```

## Health check

```sh
curl http://localhost:8080/health
# → {"status":"ok","version":"0.1.0"}
```

The container exposes `GET /health` (and `/healthz`) returning HTTP 200 + JSON. Docker's built-in `HEALTHCHECK` polls this every 15 s; check status with:

```sh
docker inspect --format='{{.State.Health.Status}}' <container>
```

## Graceful shutdown

The server handles `SIGTERM` and `SIGINT`: closes WS connections and the HTTP listener, then exits 0. Always pass `--init` (or use `init: true` in Compose) so Docker routes signals correctly to the Node process rather than PID 1 being the shell.

## Self-test suite

```sh
npm test            # 201 unit tests (Vitest) — engine, server, i18n
npm run test:e2e    # Playwright browser e2e tests (requires a running dev server)
```

## Coolify / PaaS deployment

The web version deploys as a single Docker container on any PaaS that supports Docker (Coolify, Render, Railway, Fly.io, etc.).

| Setting          | Value |
|------------------|-------|
| Port             | `8080` |
| Health check URL | `/health` |
| Restart policy   | `unless-stopped` |
| Build pack       | Dockerfile (`Dockerfile.web`) |

Coolify-specific steps:
1. Point the service at this repo, select `Dockerfile.web` as the Dockerfile.
2. Set port `8080` as the exposed port.
3. Set `ALLOWED_ORIGINS` to your public domain in the Coolify environment vars.
4. Enable the health check on path `/health` (port 8080).
5. Push `main` to trigger a deploy.

Game state is **in-memory** — container restart clears lobbies.

## Notes

- The runtime image runs as a non-root user (`laspoly`, uid 1001) for security.
- `NODE_ENV=production` is set in the image.
- `old-java/` (the original JavaFX game) is excluded from the Docker build via `.dockerignore`.
