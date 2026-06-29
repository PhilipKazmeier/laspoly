import { Net, loadSession, clearSession } from "./net.js";
import { Board3D } from "./board3d.js";
import { UI } from "./ui.js";
import type { GameState, FormattedEvent } from "@laspoly/shared";

const JAIL_POS = 40;

/** Resolves after `ms` milliseconds — used as a safety timeout in Promise.race(). */
function timeout(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Serial animation queue
// ---------------------------------------------------------------------------
// The server emits a `state` message after every turn (the local player's, then
// each bot's, ~700 ms apart). Applying each immediately made tokens jump, dice
// overlap, and the buy prompt pop before the token landed.
//
// This queue processes exactly ONE state at a time. For each state it:
//   1. shows action-card / special-event toasts,
//   2. diffs against the last-rendered state to find the roll + movers,
//   3. plays the dice animation to completion, then each mover's token
//      animation to completion, ONE player at a time (bots never overlap),
//   4. applies the HUD/board visuals, and only THEN shows the buy prompt.
//
// Backlog guard: if states pile up (slow client / many bots), keep only the
// latest pending state so we never fall far behind; the latest mover's
// animation still plays. Reconnect/resume snaps straight to the newest state.
// ---------------------------------------------------------------------------

interface QueueEntry {
  state: GameState;
  events: FormattedEvent[];
}

class StateQueue {
  private queue: QueueEntry[] = [];
  private processing = false;
  private lastProcessed: GameState | null = null;

  constructor(
    private board: Board3D,
    private ui: UI,
    private net: Net,
  ) {}

  enqueue(state: GameState, events: FormattedEvent[]) {
    // Backlog guard: collapse to (latest-pending, new) so we stay close to live.
    if (this.queue.length > 3) {
      const last = this.queue[this.queue.length - 1]!;
      this.queue = [last, { state, events }];
    } else {
      this.queue.push({ state, events });
    }
    if (!this.processing) void this.processNext();
  }

  /** Reconnect/resume: skip the queue and snap instantly to the given state. */
  snapImmediate(state: GameState, events: FormattedEvent[]) {
    this.queue = [];
    this.processing = false;
    this.lastProcessed = state;
    this.board.snapToState(state, this.net.playerId);
    this.ui.updateGame(state, events, this.net.playerId);
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0) { this.processing = false; return; }
    this.processing = true;
    const entry = this.queue.shift()!;
    try {
      await this.processEntry(entry);
    } catch {
      // Never let one bad frame wedge the queue; fall back to applying visuals.
      this.board.applyVisuals(entry.state, this.net.playerId);
      this.ui.updateGame(entry.state, entry.events, this.net.playerId);
      this.lastProcessed = entry.state;
    }
    void this.processNext();
  }

  private async processEntry({ state, events }: QueueEntry): Promise<void> {
    const prev = this.lastProcessed;
    const myId = this.net.playerId;

    // 1. Toasts / popups (UI only — no animation wait).
    this.board.handleEvents(events);
    for (const ev of events) {
      if (ev.key.startsWith("actionCard")) {
        if (ev.playerId && myId && ev.playerId === myId) this.ui.showActionCard(ev.text);
        break;
      }
    }
    for (const ev of events) {
      if (ev.key.startsWith("specialEvent_")) {
        this.ui.showSpecialEventToast(ev.text);
        break;
      }
    }

    // Bring the cup back when it's a fresh turn awaiting a roll.
    this.board.prepareCupForTurn(state, prev);

    // 2. Diff against the last-rendered state: detect the roll and the movers.
    let rolledD1 = 0, rolledD2 = 0;
    const movers: Array<{ id: string; from: number; to: number }> = [];

    if (prev) {
      for (const p of state.players) {
        const pp = prev.players.find((pl) => pl.id === p.id);
        if (!pp) continue;
        if (p.lastRoll[0] > 0 && (pp.lastRoll[0] !== p.lastRoll[0] || pp.lastRoll[1] !== p.lastRoll[1])) {
          rolledD1 = p.lastRoll[0];
          rolledD2 = p.lastRoll[1];
        }
        const prevPos = pp.inJail ? JAIL_POS : pp.position;
        const newPos = p.inJail ? JAIL_POS : p.position;
        if (prevPos !== newPos && p.alive) {
          movers.push({ id: p.id, from: prevPos, to: newPos });
        }
      }
    }

    // 3. Dice FIRST (cup lift → shake → settle with the rolled value face-up).
    //    Safety timeout: 4 s max so the queue never stalls even in headless envs.
    if (rolledD1 > 0) {
      await Promise.race([
        this.board.playDiceAnimationAsync(rolledD1, rolledD2),
        timeout(4_000),
      ]);
    }

    // 4. Movers ONE AT A TIME so bots animate sequentially, never simultaneously.
    //    Safety timeout: 15 s per mover (12 tiles × 120 ms + margin).
    for (const { id, from, to } of movers) {
      this.board.ensureTokenExists(id, state, myId);
      await Promise.race([
        this.board.animateMoveAsync(id, from, to),
        timeout(15_000),
      ]);
    }

    // 5. Apply visuals (HUD, board, ownership, displays) only after movement.
    this.board.applyVisuals(state, myId);

    // 6. Buy prompt is gated here: ui.updateGame surfaces the buy panel when
    //    phase === "awaiting-buy", which now happens AFTER the token landed.
    this.ui.updateGame(state, events, myId);

    this.lastProcessed = state;
  }
}

const net = new Net();
const board3d = new Board3D(document.getElementById("renderCanvas") as HTMLCanvasElement);
const ui = new UI(document.getElementById("ui") as HTMLDivElement, net, board3d);
const stateQueue = new StateQueue(board3d, ui, net);

// Clicking the 3D dice cup sends a roll, exactly like the Roll button does.
board3d.setRollHandler(() => {
  net.send({ t: "command", command: { type: "ROLL_DICE" } });
});
// Tile clicks are exposed for the HTML property-card popup (owned by the UI agent).
board3d.setTileClickHandler((pos) => {
  ui.showDeedCard(pos);
});

// Track whether we are attempting a session resume (suppress initial lobby flash).
let resuming = false;

net.onMessage((msg) => {
  switch (msg.t) {
    case "rooms":
      if (!resuming) ui.showLobby(msg.rooms);
      break;
    case "joined":
      ui.onJoined(msg.roomId, msg.playerId);
      break;
    case "room":
      // Server sends the current room view whenever something changes (player
      // joins, figure pick, etc.). Show the room panel with the start button.
      if (!resuming) ui.showRoom(msg.room);
      break;
    case "resumed":
      // Keep `resuming` true so the first post-resume `state` snaps (no backlog
      // animation); it is cleared when that state arrives below.
      ui.onJoined(msg.roomId, msg.playerId);
      break;
    case "state":
      if (resuming) {
        resuming = false;
        stateQueue.snapImmediate(msg.state, msg.events);
      } else {
        stateQueue.enqueue(msg.state, msg.events);
      }
      break;
    case "chat":
      ui.addChat(msg.from, msg.text);
      break;
    case "error":
      if (resuming) {
        // Resume failed (room gone or bad token) — clear session and show lobby.
        resuming = false;
        clearSession();
        ui.showLobby([]);
        net.send({ t: "listRooms" });
      } else {
        ui.showError(msg.message);
      }
      break;
    case "gameOver":
      clearSession();
      ui.showGameOver(msg.winnerName);
      break;
  }
});

// Attempt session resume on startup.
const session = loadSession();
if (session) {
  resuming = true;
  net.send({ t: "resume", roomId: session.roomId, playerId: session.playerId, token: session.token });
}

// Expose clearSession for UI (leave room).
(window as Record<string, unknown>)["_clearSession"] = clearSession;
