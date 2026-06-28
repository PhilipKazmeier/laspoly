# LasPoly

HHN Software Engineering lab project — 3D JavaFX Monopoly-style board game with a Jersey REST/SSE backend.
Sources recovered from `LasPoly.jar` (CFR decompilation + Gradle build).

## Try it locally (WSLg / desktop)

**Terminal 1 — server**
```bash
cd /home/brian/dev/dev-bri/laspoly
./scripts/local.sh server
```

**Terminal 2 — client** (use the index it prints, usually `0` or `1`)
```bash
./scripts/local.sh client
```

**API only (no GUI)**
```bash
./scripts/local.sh build
./scripts/local.sh server
./scripts/local.sh test
./scripts/local.sh status
```

Stop server: `./scripts/local.sh server-stop`

### Server URLs (client arg = index)

| Index | URL |
|-------|-----|
| `0` | `http://localhost:8080/laspoly/` |
| `1` | `http://localhost:8090/laspoly/` |

```bash
./scripts/run.sh      # index 0 (8080)
./scripts/run.sh 1    # index 1 (8090)
```

Needs **Java 21+**, display (`DISPLAY` set — WSLg on Windows is fine). OpenJFX downloads on first client run.

## Build

```bash
./gradlew jar serverJar    # client + server fat jars in dist/
./gradlew war              # dist/laspoly.war for Tomcat
```

| Artifact | Purpose |
|----------|---------|
| `dist/LasPoly.jar` | JavaFX client |
| `dist/LasPoly-server.jar` | Embedded Grizzly server |
| `dist/laspoly.war` | Tomcat deploy at `/laspoly` |

## Server API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/users/register`, `/login`, `/logout`, `/changeData` | Users |
| GET | `/games` | Open games (JSON) |
| GET | `/games/listenToGames` | SSE lobby |
| GET | `/games/listenToGame/{id}` | SSE in-game |
| POST | `/games/add`, `/remove`, `/addUser`, `/removeUser`, `/start`, `/gameAction` | Lobby + play |

In-memory state only (`UserDaoCache`, `GameDaoCache`).

## Docker

**Production (Coolify)** — API + download site:

```bash
docker compose build
docker compose up -d
```

See `COOLIFY.md` for `laspoly.brianwirth.de` setup.

**API only (local):**

```bash
./gradlew serverJar
docker compose -f docker-compose.server.yml up --build
```

## Remote play with friends

Share https://laspoly.brianwirth.de — friends download **one launcher** (`run.bat` or `run.sh`). It fetches the jar, Java 21, and OpenJFX automatically. The client connects to production by default.

```bash
# local dev against localhost:
./scripts/run.sh 0
./scripts/run.sh 1
# production (also the jar default when launched with no args):
./scripts/run.sh 2
```

## GitLab

Repo: https://gitlab.com/webservices1431350/laspoly (`main` → Coolify auto-deploy). See `COOLIFY.md`.

## Notes

- **Play on Windows** — `./scripts/local.sh win-play` (server + 2 clients). Server must run on Windows; WSL server is not reachable from Windows clients.
- Debugger UI: `./scripts/run-debugger.sh`
