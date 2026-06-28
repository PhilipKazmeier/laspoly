import type { ClientMessage, ServerMessage } from "@laspoly/shared";

const WS_URL = `ws://${location.hostname}:8080`;

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
