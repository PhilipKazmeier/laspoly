import type { ClientMessage, ServerMessage } from "@laspoly/shared";

// Connect to the SAME origin (host + port) the page was served from, so when the
// server is mapped to any port (e.g. Docker -p 8081:8080) the WebSocket follows it.
// `wss:` is used automatically on HTTPS pages (avoids mixed-content blocking).
// VITE_WS_URL overrides this for the split-port dev/e2e setup (vite preview :4173
// while the game server runs on :8080).
const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ||
  `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}`;

/** HTTP base of the game server (follows WS_URL — needed for split-port dev). */
export const API_BASE = WS_URL.replace(/^ws/, "http");

type Handler = (msg: ServerMessage) => void;

export interface SavedSession {
  roomId: string;
  playerId: string;
  token: string;
}

const SESSION_KEY = "laspoly_session";

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSession;
  } catch {
    return null;
  }
}

export function saveSession(s: SavedSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export class Net {
  private ws: WebSocket;
  private handlers: Handler[] = [];
  public playerId: string | null = null;

  constructor(url = WS_URL) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data as string) as ServerMessage;
      if (msg.t === "joined") {
        this.playerId = msg.playerId;
        saveSession({ roomId: msg.roomId, playerId: msg.playerId, token: msg.token });
      }
      if (msg.t === "resumed") {
        this.playerId = msg.playerId;
      }
      for (const h of this.handlers) h(msg);
    };
  }

  onMessage(h: Handler) { this.handlers.push(h); }

  send(msg: ClientMessage) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.ws.addEventListener("open", () => this.ws.send(JSON.stringify(msg)), { once: true });
    }
  }

  get ready(): Promise<void> {
    return new Promise(r => {
      if (this.ws.readyState === WebSocket.OPEN) r();
      else this.ws.addEventListener("open", () => r(), { once: true });
    });
  }
}
