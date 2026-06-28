# Coolify deployment — LasPoly

Hosts the **multiplayer backend** and download site at https://laspoly.brianwirth.de. Friends download one launcher (`run.ps1` / `run.sh`); it pulls the jar, Java 21, and JavaFX automatically.

## Live

| Item | Value |
|------|--------|
| URL | https://laspoly.brianwirth.de |
| GitLab | `git@gitlab.com:webservices1431350/laspoly.git` (branch `main`) |
| Coolify project UUID | `vrurf956olw1b3r9roj37tuh` |
| Coolify app UUID | `iuhy9vnox497c2f5094bzs2u` |
| Webhook secret | `laspoly_deploy_secret` (GitLab hook + Coolify `manual_webhook_secret_gitlab`) |

## Auto-deploy

Push to **`main`** → GitLab webhook → Coolify build/deploy.

Webhook URL: `https://coolify.brianwirth.de/webhooks/source/gitlab/events/manual`  
Branch filter: `main`

## Stack

- **Build pack:** Docker Compose (`docker-compose.yml`)
- **Java** — `LasPoly-server.jar` (Jersey REST + SSE)
- **nginx** — landing page, `/download/LasPoly.jar`, proxies `/laspoly/` (SSE-safe)
- Multi-stage Docker build runs `./gradlew jar serverJar` inside the image

No Coolify env vars required (in-memory state).

## Public URLs

Site is **not indexed** (`robots.txt`, `noindex`). The **landing page and downloads** are gated by Traefik basic auth (`laspoly` / share password with friends). The **`/laspoly/` game API is not auth-gated** so the Java client and SSE lobby updates work without browser credentials.

| URL | Purpose |
|-----|---------|
| https://laspoly.brianwirth.de/ | Landing + download (browser login prompt) |
| https://laspoly.brianwirth.de/download/LasPoly.jar | Client jar (auth required) |
| https://laspoly.brianwirth.de/laspoly/games | API (JSON lobby list, no auth) |

Launchers send basic auth when downloading from the site. The Java client still sends credentials too (harmless if the API route is open).

## Local smoke test

```bash
docker compose build
docker compose up
# optional port map: add ports: ["8088:80"] under laspoly
curl -s localhost:8088/laspoly/games
```

## Friends — how to play

1. Open https://laspoly.brianwirth.de
2. Download **one file**: `run.bat` (Windows) or `run.sh` (Mac/Linux)
3. Run it — jar, Java 21, and JavaFX are fetched automatically
4. Register, join the same lobby, host starts the game

Local dev server override: `./scripts/run.sh 0` or `1`

## Notes

- Game state is **in-memory** — container restart clears lobbies.
- JavaFX client runs on each player's desktop; only the backend is hosted.
- Redeploy: push `main`, or `curl -X POST "$COOLIFY_BASE/api/v1/deploy" -H "Authorization: Bearer $COOLIFY_API_KEY" -d '{"uuid":"iuhy9vnox497c2f5094bzs2u"}'`
