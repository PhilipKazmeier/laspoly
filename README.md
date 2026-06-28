# LasPoly (Web)

Modern browser rebuild of the LasPoly 3D Monopoly-style board game — Node/TypeScript +
Babylon.js, authoritative WebSocket server, AI bots, Docker-deployable.

```
packages/shared   pure deterministic rule engine, board data, i18n, wire protocol
packages/server   authoritative ws + http game server (rooms, lobby, bots, spectators)
packages/client    Vite + Babylon.js 3D client
old-java/          the original decompiled JavaFX game (reference only, not built)
```

## Develop

```bash
npm install
npm test            # engine + server + i18n unit tests
npm run dev         # server (:8080) + client dev server
```

## Deploy

Single container, playable in the browser — see [DEPLOY-WEB.md](DEPLOY-WEB.md).

```bash
docker build -f Dockerfile.web -t laspoly-web .
docker run -d -p 8080:8080 --restart unless-stopped laspoly-web
```
