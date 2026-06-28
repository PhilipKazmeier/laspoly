import {
  createGame,
  applyCommand,
  currentPlayer,
  legalCommands,
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
    const player: LobbyPlayer = { id, nickname, isBot: false, connected: true };
    this.players.push(player);
    if (this.players.filter((p) => !p.isBot).length === 1) {
      this.host = id;
    }
    return id;
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
      this.players.push({ id, nickname: `Bot ${i + 1}`, isBot: true, connected: false });
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
    const cp = currentPlayer(this.state);
    if (cp.id !== playerId) throw new Error("Not your turn");
    const legal = legalCommands(this.state);
    if (!legal.includes(command.type)) throw new Error(`Command ${command.type} not legal`);

    const result = applyCommand(this.state, command);
    this.state = result.state;
    return result.events;
  }

  /** Drive bot turns until a human (or finished). Returns all collected events. */
  stepBots(): GameEvent[] {
    if (!this.started || !this.state) return [];
    const allEvents: GameEvent[] = [];

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
