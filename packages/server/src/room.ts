import { randomBytes } from "node:crypto";
import {
  createGame,
  applyCommand,
  applySurrender,
  currentPlayer,
  legalCommandsFor,
  botDecide,
  formatEvent,
  type GameState,
  type GameEvent,
  type Command,
  type Locale,
  type GameSettings,
} from "@laspoly/shared";
import { FIGURE_COLORS, FIGURE_COUNT, DICE_SKIN_COUNT, CUSTOM_FIGURE_INDEX } from "@laspoly/shared";
import type { FormattedEvent, RoomView, RoomSummary } from "@laspoly/shared";

// ---------------------------------------------------------------------------
// Turn timer auto-action helper (pure, exported for testing)
// ---------------------------------------------------------------------------

/**
 * Pick a sensible auto-action for the given player when their turn timer expires.
 * Pure function — no side effects. Returns null if no action is needed/possible.
 */
export function pickAutoAction(state: GameState, playerId: string): Command | null {
  if (state.phase === "finished") return null;
  const legal = legalCommandsFor(state, playerId);
  if (legal.length === 0) return null;
  // At the casino: roll (the only option)
  if (legal.includes("ROLL_CASINO")) return { type: "ROLL_CASINO" };
  // Awaiting-buy: decline so turn advances
  if (legal.includes("DECLINE_PROPERTY")) return { type: "DECLINE_PROPERTY" };
  // Turn-end: confirm to pass turn
  if (legal.includes("END_TURN")) return { type: "END_TURN" };
  // Awaiting-roll or in jail: just roll
  if (legal.includes("ROLL_DICE")) return { type: "ROLL_DICE" };
  return null;
}

export interface LobbyPlayer {
  id: string;
  nickname: string;
  isBot: boolean;
  connected: boolean;
  token: string; // session resume token
  color: string;
  figureIndex: number;
  ready: boolean; // humans must mark ready before game can start
  diceSkin: number;
  /** uploaded standee image (validated data URL), if any */
  customImage?: string;
}

let _nextRoomId = 1;
let _nextPlayerId = 1;

/** Hard cap for uploaded token images (data-URL characters ≈ bytes × 4/3). */
export const MAX_TOKEN_IMAGE_CHARS = 200_000;

/**
 * Validate an uploaded token image. Returns an error string or null when OK.
 * Only PNG/JPEG data URLs are accepted — SVG is explicitly forbidden (it is
 * script-capable if ever rendered in the DOM) — and the base64 payload's
 * magic bytes must match the declared type (cheap mislabel/bomb guard).
 */
export function validateTokenImage(image: unknown): string | null {
  if (typeof image !== "string" || image.length === 0) return "image must be a non-empty string";
  if (image.length > MAX_TOKEN_IMAGE_CHARS) return `image too large (max ${MAX_TOKEN_IMAGE_CHARS} chars)`;
  const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if (!m) return "image must be a PNG or JPEG data URL";
  let head: Buffer;
  try {
    head = Buffer.from(m[2]!.slice(0, 16), "base64");
  } catch {
    return "invalid base64 payload";
  }
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isJpeg = head[0] === 0xff && head[1] === 0xd8;
  if (m[1] === "png" && !isPng) return "payload is not a PNG";
  if (m[1] === "jpeg" && !isJpeg) return "payload is not a JPEG";
  return null;
}

export class GameRoom {
  readonly id: string;
  readonly name: string;
  readonly boardId: string;
  botCount: number;
  host: string; // playerId
  players: LobbyPlayer[] = [];
  started = false;
  state: GameState | null = null;
  settings: GameSettings = {};

  /**
   * Optional room password. Plaintext compare is deliberate and acceptable
   * here: rooms are ephemeral in-memory objects, the password is casual
   * gate-keeping among friends, and the random resume token remains the real
   * credential. It must never be logged or included in any outgoing message.
   */
  password: string | null = null;

  constructor(name: string, boardId: string, botCount: number, password: string | null = null) {
    this.id = String(_nextRoomId++);
    this.name = name;
    this.boardId = boardId;
    this.botCount = botCount;
    this.password = password;
  }

  /** Returns the first color not already taken by any player (human or bot). */
  private _nextFreeColor(): string {
    const taken = new Set(this.players.map((p) => p.color));
    for (const c of FIGURE_COLORS) {
      if (!taken.has(c)) return c;
    }
    return FIGURE_COLORS[this.players.length % FIGURE_COLORS.length]!;
  }

  /** Returns the first figureIndex not already taken by any player (human or bot). */
  private _nextFreeFigureIndex(): number {
    const taken = new Set(this.players.map((p) => p.figureIndex));
    for (let i = 0; i < FIGURE_COUNT; i++) {
      if (!taken.has(i)) return i;
    }
    return this.players.length % FIGURE_COUNT;
  }

  addHuman(nickname: string): string {
    const id = `h${_nextPlayerId++}`;
    const token = randomBytes(16).toString("hex");
    const color = this._nextFreeColor();
    const figureIndex = this._nextFreeFigureIndex();
    // Default humans to ready so a host can start immediately (the ready-up UI,
    // when present, lets a player toggle this off). Avoids blocking the start flow.
    const player: LobbyPlayer = { id, nickname, isBot: false, connected: true, token, color, figureIndex, diceSkin: 0, ready: true };
    this.players.push(player);
    if (this.players.filter((p) => !p.isBot).length === 1) {
      this.host = id;
    }
    return id;
  }

  /** Set a human player's ready state. Returns error string or null on success. */
  setReady(playerId: string, ready: boolean): string | null {
    if (this.started) return "Game already started";
    const p = this.players.find((p) => p.id === playerId && !p.isBot);
    if (!p) return "Player not found";
    p.ready = ready;
    return null;
  }

  /** Whether the room can start: ≥2 participants and all humans ready. */
  canStart(): boolean {
    const humans = this.players.filter((p) => !p.isBot);
    const total = humans.length + this.botCount;
    if (total < 2) return false;
    return humans.every((p) => p.ready);
  }

  /** Update game settings (host only, lobby only). */
  updateSettings(settings: GameSettings): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Allows a human player to choose their colour and figure.
   * Returns an error string if validation fails, or null on success.
   */
  chooseFigure(playerId: string, color: string, figureIndex: number, diceSkin?: number): string | null {
    if (this.started) return "Game already started";
    if (!FIGURE_COLORS.includes(color as typeof FIGURE_COLORS[number])) {
      return `Invalid colour. Choose from: ${FIGURE_COLORS.join(", ")}`;
    }
    const isCustom = figureIndex === CUSTOM_FIGURE_INDEX;
    if (!isCustom && (!Number.isInteger(figureIndex) || figureIndex < 0 || figureIndex >= FIGURE_COUNT)) {
      return `Invalid figureIndex. Must be 0–${FIGURE_COUNT - 1}`;
    }
    const p = this.players.find((p) => p.id === playerId);
    if (!p) return "Player not found";
    if (isCustom && !p.customImage) return "Upload a picture before choosing the custom token";
    const others = this.players.filter((o) => !o.isBot && o.id !== playerId);
    if (others.some((o) => o.color === color)) return "Colour already taken";
    // Custom standees may repeat (each shows a different picture).
    if (!isCustom && others.some((o) => o.figureIndex === figureIndex)) return "Figure already taken";
    if (diceSkin !== undefined) {
      if (!Number.isInteger(diceSkin) || diceSkin < 0 || diceSkin >= DICE_SKIN_COUNT) {
        return `Invalid diceSkin. Must be 0\u2013${DICE_SKIN_COUNT - 1}`;
      }
      p.diceSkin = diceSkin; // cosmetic — deliberately NOT uniqueness-checked
    }
    p.color = color;
    p.figureIndex = figureIndex;
    return null;
  }

  /** Store a validated custom token image on a player (lobby only). */
  setCustomImage(playerId: string, image: string): string | null {
    if (this.started) return "Game already started";
    const p = this.players.find((pl) => pl.id === playerId);
    if (!p || p.isBot) return "Player not found";
    p.customImage = image;
    return null;
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

    // Add bot lobby entries (assign remaining colors/figures)
    for (let i = 0; i < botsNeeded; i++) {
      const id = `b${_nextPlayerId++}`;
      const color = this._nextFreeColor();
      const figureIndex = this._nextFreeFigureIndex();
      this.players.push({ id, nickname: `Bot ${i + 1}`, isBot: true, connected: false, token: "", color, figureIndex, diceSkin: 0, ready: true });
    }

    const allPlayers = this.players.map((p) => ({
      id: p.id,
      name: p.nickname,
      isBot: p.isBot,
      color: p.color,
      figureIndex: p.figureIndex,
      diceSkin: p.diceSkin,
    }));

    this.state = createGame({ boardId: this.boardId, seed, players: allPlayers, settings: this.settings });
    this.started = true;
    return this.state;
  }

  applyHumanCommand(playerId: string, command: Command): GameEvent[] {
    if (!this.started || !this.state) throw new Error("Game not started");
    if (this.state.phase === "finished") throw new Error("Game is finished");

    // SURRENDER may come from any alive player (not just current player)
    if (command.type === "SURRENDER") {
      const surrenderingPlayer = this.state.players.find((p) => p.id === playerId);
      if (!surrenderingPlayer?.alive) throw new Error("Player is not alive");
      const cp = currentPlayer(this.state);
      if (cp.id === playerId) {
        // Current player surrenders: use applyCommand (which surrenders currentPlayer)
        const result = applyCommand(this.state, command);
        this.state = result.state;
        return result.events;
      } else {
        // Non-current player surrenders: use applySurrender
        const result = applySurrender(this.state, playerId);
        this.state = result.state;
        return result.events;
      }
    }

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

  /**
   * Restart the game with the same lobby players, board, and settings.
   * Only valid after the game is finished. Resets state to a fresh game.
   */
  restart(newSeed: number): GameState {
    if (!this.started || !this.state) throw new Error("Game not yet started");
    if (this.state.phase !== "finished") throw new Error("Game is not finished yet");
    // Remove bots that were added by start(), keep only the humans
    this.players = this.players.filter((p) => !p.isBot);
    // Keep humans ready so a rematch can start immediately (ready-up UI may toggle).
    for (const p of this.players) p.ready = true;
    this.started = false;
    this.state = null;
    return this.start(newSeed);
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
      hasPassword: this.password !== null,
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
        color: p.color,
        figureIndex: p.figureIndex,
        diceSkin: p.diceSkin,
        ...(p.customImage ? { customImage: p.customImage } : {}),
        ready: p.isBot ? true : p.ready,
      })),
      started: this.started,
      settings: this.settings,
      canStart: this.canStart(),
    };
  }
}

export class RoomManager {
  private rooms = new Map<string, GameRoom>();

  create(name: string, boardId: string, botCount: number, password: string | null = null): GameRoom {
    const room = new GameRoom(name, boardId, botCount, password);
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
