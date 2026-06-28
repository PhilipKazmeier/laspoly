import type { ClientMessage, ServerMessage } from "@laspoly/shared";

const WS_URL = `ws://${location.hostname}:8080`;

type Handler = (msg: ServerMessage) => void;

export class Net {
  private ws: WebSocket;
  private handlers: Handler[] = [];
  public playerId: string | null = null;

  constructor(url = WS_URL) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data as string) as ServerMessage;
      if (msg.t === "joined") this.playerId = msg.playerId;
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
