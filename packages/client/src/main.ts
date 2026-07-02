import { Net, loadSession, clearSession } from "./net.js";
import { Board3D } from "./board3d.js";
import { UI } from "./ui.js";
import { audio } from "./audio.js";
import { applyThemeClass } from "./theme.js";
import { getBoard } from "@laspoly/shared";
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

  /** Phase of the most-recently-rendered state (for context-aware cup clicks). */
  get phase(): string | null {
    return this.lastProcessed?.phase ?? null;
  }

  /** Reset the queue for a new game (rematch). */
  reset() {
    this.queue = [];
    this.processing = false;
    this.lastProcessed = null;
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

    // 1. Board-side event hooks (no animation wait needed here).
    this.board.handleEvents(events);

    // Special-event toasts can appear right away (not tied to movement).
    for (const ev of events) {
      if (ev.key.startsWith("specialEvent_")) {
        this.ui.showSpecialEventToast(ev.text);
        break;
      }
    }

    // Bring the cup back when it's a fresh turn awaiting a roll.
    this.board.prepareCupForTurn(state, prev);

    // Buy-out-of-jail: the freed player reappears on the P field (pos 10) with no
    // walk animation — snap, and don't treat it as a mover (bug 8b).
    const ransomPlayers = new Set(
      events.filter((e) => e.key === "paidRansom" && e.playerId).map((e) => e.playerId),
    );
    for (const pid of ransomPlayers) {
      const p = state.players.find((pl) => pl.id === pid);
      if (p) this.board.snapPlayerToTile(p.id, p.position, state, myId);
    }

    // 2. Diff against the last-rendered state: detect the roll and the movers.
    let rolledD1 = 0, rolledD2 = 0;
    const movers: Array<{ id: string; from: number; to: number }> = [];

    if (prev) {
      for (const p of state.players) {
        const pp = prev.players.find((pl) => pl.id === p.id);
        if (!pp) continue;
        if (ransomPlayers.has(p.id)) continue;
        // Detect a new roll: either die changed AND at least one die is > 0.
        if (
          p.lastRoll[0] > 0 &&
          (pp.lastRoll[0] !== p.lastRoll[0] || pp.lastRoll[1] !== p.lastRoll[1])
        ) {
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

    // (a) Dice FIRST (cup lift → shake → settle with the rolled value face-up).
    //    Safety timeout: 4 s max so the queue never stalls even in headless envs.
    if (rolledD1 > 0) {
      audio.play("dice");
      await Promise.race([
        this.board.playDiceAnimationAsync(rolledD1, rolledD2),
        timeout(4_000),
      ]);
    }

    // Position of the "Go To Jail" field on this board (for the jail walk below).
    const goToJailPos =
      getBoard(state.boardId).tiles.find((t) => t.type === "gotojail")?.pos ?? null;

    // (b) Movers ONE AT A TIME so bots animate sequentially, never simultaneously.
    //    Safety timeout: 15 s per mover (12 tiles × 120 ms + margin).
    for (const { id, from, to } of movers) {
      this.board.ensureTokenExists(id, state, myId);

      // Jail via the Go-To-Jail field: if this move ends in jail AND the player's
      // roll lands them exactly on that field, walk the roll onto the field first,
      // then slide from there into the cage (two steps) instead of teleporting
      // straight into the cage. Other jail entries (3 doubles, action card) still
      // do a single slide.
      const landedOnJailField =
        to === JAIL_POS &&
        goToJailPos !== null &&
        rolledD1 > 0 &&
        (from + rolledD1 + rolledD2) % 40 === goToJailPos;

      if (landedOnJailField) {
        await Promise.race([
          this.board.animateMoveAsync(id, from, goToJailPos!),
          timeout(15_000),
        ]);
        await timeout(250); // brief beat on the field before being hauled off
        await Promise.race([
          this.board.animateMoveAsync(id, goToJailPos!, to),
          timeout(15_000),
        ]);
      } else {
        await Promise.race([
          this.board.animateMoveAsync(id, from, to),
          timeout(15_000),
        ]);
      }
    }

    // (b2) 3D card draw for ANY player's action card — the card flies from the
    //      deck and flips to its title after the mover lands, before visuals.
    //      (The HTML popup below stays local-player-only.)
    const anyCardEv = events.find((ev) => ev.key === "actionCard");
    if (anyCardEv) {
      const title =
        anyCardEv.text.split(": ").slice(1).join(": ").replace(/\.\s*$/, "") || anyCardEv.text;
      await Promise.race([this.board.animateCardDrawAsync(title), timeout(3_000)]);
    }

    // (c) After animation: apply visuals, show action-card popup, update HUD.
    //     Everything in this block is strictly after dice + movement.

    // Apply visuals (HUD, board, ownership, displays).
    this.board.applyVisuals(state, myId);

    // Active-player highlight.
    const activePlayer = state.players[state.currentPlayerIndex];
    this.board.setActivePlayer(activePlayer?.id ?? null);

    // Sound effects for events.
    for (const ev of events) {
      if (ev.key === "bought") { audio.play("buy"); break; }
    }
    for (const ev of events) {
      if (ev.key === "rentPaid" || ev.key === "factoryRevenue") { audio.play("rent"); break; }
    }
    for (const ev of events) {
      if (ev.key === "wentToJail" || ev.key === "tripleDoubles") { audio.play("jail"); break; }
    }
    for (const ev of events) {
      if (ev.key === "built") { audio.play("build"); break; }
    }

    // Action-card popup: only for the LOCAL player's card, shown HERE (after animation).
    // Other players' cards go to the log only (via ui.updateGame below).
    // The draw event ("… zieht Aktionskarte: <name>.") gives the card title; the
    // follow-up effect event (actionCardPay/Collect/Move/…) gives what must be done.
    let cardTitle: string | null = null;
    let cardEffect = "";
    for (const ev of events) {
      if (!ev.playerId || ev.playerId !== myId) continue;
      if (ev.key === "actionCard") {
        // "… zieht Aktionskarte: Zaubershow." → "Zaubershow"
        cardTitle = ev.text.split(": ").slice(1).join(": ").replace(/\.\s*$/, "") || ev.text;
      } else if (ev.key.startsWith("actionCard")) {
        cardEffect = ev.text;
      }
    }
    if (cardTitle) {
      // Effect events read "<card>: <player> …"; strip the duplicate card prefix.
      if (cardEffect.startsWith(`${cardTitle}: `)) cardEffect = cardEffect.slice(cardTitle.length + 2);
      this.ui.showActionCard(cardTitle, cardEffect);
    }

    // ui.updateGame: surfaces buy panel (phase=awaiting-buy), "Zug beenden" button
    // (phase=turn-end), and all HUD updates — now strictly after animation.
    this.ui.updateGame(state, events, myId);

    this.lastProcessed = state;
  }
}

// Apply the saved DOM theme before any UI is built (avoids a flash of the wrong
// theme). The 3D board reads the theme itself at construction.
applyThemeClass();

const net = new Net();
const board3d = new Board3D(document.getElementById("renderCanvas") as HTMLCanvasElement);
const ui = new UI(document.getElementById("ui") as HTMLDivElement, net, board3d);
const stateQueue = new StateQueue(board3d, ui, net);

// Clicking the 3D dice cup sends a roll. At the casino it sends the casino roll
// instead of a normal movement roll (bug 2-8).
board3d.setRollHandler(() => {
  const type = stateQueue.phase === "awaiting-casino" ? "ROLL_CASINO" : "ROLL_DICE";
  net.send({ t: "command", command: { type } });
});
// Tile clicks are exposed for the HTML property-card popup (owned by the UI agent).
board3d.setTileClickHandler((pos) => {
  ui.showDeedCard(pos);
});

// Track whether we are attempting a session resume (suppress initial lobby flash).
let resuming = false;

// Start lobby BGM as soon as the app loads.
audio.startBgm("lobby");

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
      // Also handles post-rematch reset (game-over banner → room waiting panel).
      if (!resuming) {
        // If game-over banner is showing, a new game was requested: hide it and show room.
        const govBanner = document.getElementById("gameOverBanner");
        if (govBanner && govBanner.style.display !== "none") {
          govBanner.style.display = "none";
          // Clear state queue so the new game starts fresh.
          stateQueue.reset();
          audio.startBgm("lobby");
        }
        ui.showRoom(msg.room);
      }
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
      // Switch to game BGM on first state (game started)
      audio.startBgm("game");
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
      audio.play("gameover");
      audio.stopBgm();
      ui.showGameOver(msg.winnerName);
      break;
    case "turnTimer":
      ui.showTurnTimer(msg.playerId, msg.secondsLeft);
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
