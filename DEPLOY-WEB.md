# LasPoly Web Deployment

Single Docker container — serves the Babylon.js client and WebSocket game server on one port.

## Build and run

```sh
docker build -f Dockerfile.web -t laspoly-web .
docker run -d -p 8080:8080 --restart unless-stopped laspoly-web
```

Or with Compose:

```sh
docker compose -f docker-compose.web.yml up -d
```

Open **http://localhost:8080/** in a browser.

WebSocket connects to `ws://<host>:8080` (same port, no extra config needed).
