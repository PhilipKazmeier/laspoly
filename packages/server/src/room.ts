import { randomBytes } from "node:crypto";
import {
  createGame,
  applyCommand,
  currentPlayer,
  legalCommandsFor,
  botDecide,
  formatEvent,
  type GameState,
  type GameEvent,
  type Command,
  type Locale,
} from "@laspoly/shared";
import type { FormattedEvent, RoomView, RoomSummary } from "@laspoly/shared";

const COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];

export interface LobbyPlayer {
  id: string;
  nickname: string;
  isBot: boolean;
  connected: boolean;
  token: string; // session resume token
}

let _nextRoomId = 1;
let _nextPlayerId = 1;

export class GameRoom {
  readonly id: string;
  readonly name: string;
  readonly boardId: string;
  botCount: number;
  host: string; // playerId
  players: LobbyPlayer[] = [];
  started = false;
  state: GameState | null = null;

  constructor(name: string, boardId: string, botCount: number) {
    this.id = String(_nextRoomId++);
    this.name = name;
    this.boardId = boardId;
    this.botCount = botCount;
  }

  addHuman(nickname: string): string {
    const id = `h${_nextPlayerId++}`;
    const token = randomBytes(16).toString("hex");
    const player: LobbyPlayer = { id, nickname, isBot: false, connected: true, token };
    this.players.push(player);
    if (this.players.filter((p) => !p.isBot).length === 1) {
      this.host = id;
    }
    return id;
  }

  /** Returns the token for the given human playerId, or null if not found. */
  getToken(playerId: string): string | null {
    const p = this.players.find((p) => p.id === playerId);
    return p?.token ?? null;
  }

  /**
   * Validates the session token and reconnects the player.
   * Returns the player's nickname on success, or null on failure.
   */
  resumeHuman(playerId: string, token: string): string | null {
    const p = this.players.find((pp) => pp.id === playerId && !pp.isBot);
    if (!p || p.token !== token) return null;
    p.connected = true;
    return p.nickname;
  }

  removeHuman(playerId: string): void {
    const p = this.players.find((p) => p.id === playerId);
    if (!p) return;
    if (this.started) {
      // Keep seat as spectator / bot-driven, just mark disconnected
      p.connected = false;
    } else {
      this.players = this.players.filter((p) => p.id !== playerId);
      // Reassign host if needed
      if (this.host === playerId) {
        const next = this.players.find((p) => !p.isBot);
        this.host = next?.id ?? "";
      }
    }
  }

  start(seed: number): GameState {
    if (this.started) throw new Error("Already started");
    const humanPlayers = this.players.filter((p) => !p.isBot);
    const totalNeeded = Math.max(2, humanPlayers.length + this.botCount);
    const total = Math.min(6, totalNeeded);
    const botsNeeded = total - humanPlayers.length;

    // Add bot lobby entries
    for (let i = 0; i < botsNeeded; i++) {
      const id = `b${_nextPlayerId++}`;
      this.players.push({ id, nickname: `Bot ${i + 1}`, isBot: true, connected: false, token: "" });
    }

    const allPlayers = this.players.map((p, idx) => ({
      id: p.id,
      name: p.nickname,
      isBot: p.isBot,
      color: COLORS[idx % COLORS.length]!,
    }));

    this.state = createGame({ boardId: this.boardId, seed, players: allPlayers });
    this.started = true;
    return this.state;
  }

  applyHumanCommand(playerId: string, command: Command): GameEvent[] {
    if (!this.started || !this.state) throw new Error("Game not started");
    if (this.state.phase === "finished") throw new Error("Game is finished");

    // RESPOND_SWAP may come from the swap target, not the current-turn player
    if (command.type === "RESPOND_SWAP") {
      const swap = this.state.pendingSwap;
      if (!swap) throw new Error("No pending swap offer");
      if (swap.toId !== playerId) throw new Error("Only the swap target can respond");
    } else {
      const cp = currentPlayer(this.state);
      if (cp.id !== playerId) throw new Error("Not your turn");
    }

    const legal = legalCommandsFor(this.state, playerId);
    if (!legal.includes(command.type)) throw new Error(`Command ${command.type} not legal`);

    const result = applyCommand(this.state, command);
    this.state = result.state;
    return result.events;
  }

  /**
   * If there is a pending swap addressed to a bot player, resolve it automatically.
   * Accept only if the bot receives at least as much crude value (property count + money)
   * as it gives. Returns events or empty array if not applicable.
   */
  stepBotSwapResponse(): GameEvent[] {
    if (!this.started || !this.state || !this.state.pendingSwap) return [];
    const swap = this.state.pendingSwap;
    const targetLobby = this.players.find((p) => p.id === swap.toId);
    if (!targetLobby?.isBot) return [];

    // Crude value: each property counts as 1 unit, money is money
    const receiveValue = swap.receive.props.length + swap.receive.money;
    const giveValue = swap.give.props.length + swap.give.money;
    const accept = receiveValue >= giveValue;

    const result = applyCommand(this.state, { type: "RESPOND_SWAP", accept });
    this.state = result.state;
    return result.events;
  }

  /** Drive bot turns until a human (or finished). Returns all collected events. */
  stepBots(): GameEvent[] {
    if (!this.started || !this.state) return [];
    const allEvents: GameEvent[] = [];

    // Resolve any pending bot swap response first
    const swapEvents = this.stepBotSwapResponse();
    allEvents.push(...swapEvents);

    while (this.state.phase !== "finished") {
      const cp = currentPlayer(this.state);
      // Human player: stop (whether connected or not, let server decide)
      if (!cp.isBot) break;
      const cmd = botDecide(this.state);
      const result = applyCommand(this.state, cmd);
      this.state = result.state;
      allEvents.push(...result.events);
    }

    return allEvents;
  }

  /** Apply exactly one bot command for the current player (must be a bot). */
  stepOneBot(): GameEvent[] {
    if (!this.started || !this.state) return [];
    if (this.state.phase === "finished") return [];
    const cp = currentPlayer(this.state);
    if (!cp.isBot) return [];
    const cmd = botDecide(this.state);
    const result = applyCommand(this.state, cmd);
    this.state = result.state;
    return result.events;
  }

  /** Returns true if the current player is a bot (or a disconnected human treated as bot). */
  currentIsBot(): boolean {
    if (!this.state || this.state.phase === "finished") return false;
    const cp = currentPlayer(this.state);
    const lobby = this.players.find((p) => p.id === cp.id);
    return cp.isBot || (lobby !== undefined && !lobby.connected);
  }

  formatEvents(events: GameEvent[], locale: Locale = "de"): FormattedEvent[] {
    return events.map((e) => ({
      key: e.key,
      text: formatEvent(e, locale),
      playerId: e.playerId,
    }));
  }

  toSummary(): RoomSummary {
    return {
      id: this.id,
      name: this.name,
      boardId: this.boardId,
      playerCount: this.players.filter((p) => !p.isBot).length,
      started: this.started,
    };
  }

  toView(): RoomView {
    return {
      id: this.id,
      name: this.name,
      boardId: this.boardId,
      botCount: this.botCount,
      host: this.host,
      players: this.players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        isBot: p.isBot,
      })),
      started: this.started,
    };
  }
}

export class RoomManager {
  private rooms = new Map<string, GameRoom>();

  create(name: string, boardId: string, botCount: number): GameRoom {
    const room = new GameRoom(name, boardId, botCount);
    this.rooms.set(room.id, room);
    return room;
  }

  get(id: string): GameRoom | undefined {
    return this.rooms.get(id);
  }

  delete(id: string): void {
    this.rooms.delete(id);
  }

  list(): GameRoom[] {
    return Array.from(this.rooms.values());
  }
}
