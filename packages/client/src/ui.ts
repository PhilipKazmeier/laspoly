import {
  VERSION,
  listBoards,
  getBoard,
  mortgageValue,
  tilePrice,
  canBuild,
  canSellBuilding,
  canMortgage,
  canUnmortgage,
  canSellProperty,
  ownedPropsOf,
  canTravelFrom,
} from "@laspoly/shared";
import type { RoomSummary, RoomView, GameState, FormattedEvent, StreetTile } from "@laspoly/shared";
import type { Net } from "./net.js";
import { clearSession } from "./net.js";

const css = `
  .panel {
    background: rgba(10, 10, 30, 0.85);
    border: 1px solid #444;
    border-radius: 8px;
    padding: 16px;
    color: #eee;
  }
  button {
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    margin: 4px 2px;
  }
  button:hover { background: #1d4ed8; }
  button:disabled { background: #555; cursor: default; }
  input, select {
    background: #1e1e3a;
    color: #eee;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 14px;
    margin: 4px 0;
    width: 100%;
  }
  label { font-size: 13px; color: #aaa; display: block; margin-top: 8px; }
  #lobby { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 360px; }
  #roomPanel { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 360px; }
  #roomList { margin-top: 12px; max-height: 200px; overflow-y: auto; }
  .room-item { padding: 8px; border: 1px solid #444; border-radius: 4px; margin: 4px 0; cursor: pointer; }
  .room-item:hover { background: rgba(255,255,255,0.05); }
  #playerList {
    position: absolute; top: 16px; left: 16px;
    width: 220px;
    max-height: 60vh;
    overflow-y: auto;
  }
  .player-row { padding: 8px 10px; margin: 4px 0; border-radius: 6px; border: 1px solid #333; font-size: 13px; }
  .player-row.current-player { border-color: #facc15; background: rgba(250,204,21,0.1); }
  .player-row.dead { opacity: 0.4; }
  #eventLogPanel {
    position: absolute; bottom: 16px; left: 16px;
    width: 300px;
  }
  #eventLog {
    height: 150px; overflow-y: auto;
    background: rgba(0,0,0,0.5);
    border-radius: 4px;
    padding: 8px;
    font-size: 12px;
    line-height: 1.5;
  }
  .event-line { margin: 2px 0; }
  #chatRow { display: flex; gap: 4px; margin-top: 6px; }
  #chatInput { flex: 1; }
  #chatSendBtn { width: auto; }
  #actionPanel {
    position: absolute; bottom: 16px; right: 16px;
    text-align: right;
  }
  #gameHud {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
  }
  #gameHud > * { pointer-events: auto; }
  #gameOverBanner {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.75);
    align-items: center; justify-content: center;
    flex-direction: column; gap: 16px;
  }
  #gameOverBanner h1 { font-size: 2.5rem; color: #facc15; }
  #spectatorBanner {
    position: absolute; top: 60px; left: 50%; transform: translateX(-50%);
    background: rgba(100,0,0,0.7); padding: 8px 20px; border-radius: 8px;
    font-size: 14px;
  }
  #versionBadge {
    position: absolute; bottom: 4px; right: 8px;
    font-size: 11px; color: #555;
  }
  #errorBanner {
    position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
    background: rgba(180,0,0,0.85); padding: 8px 20px; border-radius: 6px;
    font-size: 13px; max-width: 400px; text-align: center;
  }
  #myPropsPanel {
    position: absolute; top: 16px; right: 16px;
    width: 280px;
    max-height: 70vh;
    overflow-y: auto;
  }
  .prop-row { padding: 8px; border: 1px solid #333; border-radius: 4px; margin: 4px 0; font-size: 12px; }
  .prop-row .prop-name { font-weight: bold; color: #eee; }
  .prop-row .prop-detail { color: #aaa; font-size: 11px; margin: 2px 0; }
  .prop-btn { font-size: 11px; padding: 3px 8px; margin: 2px 1px; }
  .prop-btn.danger { background: #991b1b; }
  .prop-btn.danger:hover { background: #7f1d1d; }
  #travelPanel {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 260px;
  }
  #tradePanel {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 340px;
    max-height: 80vh;
    overflow-y: auto;
  }
  #incomingSwapPanel {
    position: absolute; bottom: 80px; right: 16px;
    width: 300px;
  }
  .swap-section { margin: 8px 0; padding: 6px; background: rgba(255,255,255,0.05); border-radius: 4px; }
  .swap-label { font-size: 12px; color: #aaa; margin-bottom: 4px; }
  .swap-check-row { display: flex; align-items: center; gap: 6px; margin: 3px 0; font-size: 12px; }
`;

function show(el: HTMLElement, displayValue = "block") {
  el.style.display = displayValue;
}

function hide(el: HTMLElement) {
  el.style.display = "none";
}

export class UI {
  private root: HTMLDivElement;
  private net: Net;

  // Lobby elements
  private lobby!: HTMLDivElement;
  private nicknameInput!: HTMLInputElement;
  private boardIdSelect!: HTMLSelectElement;
  private botCountSelect!: HTMLSelectElement;
  private createRoomBtn!: HTMLButtonElement;
  private roomList!: HTMLDivElement;

  // Room panel
  private roomPanel!: HTMLDivElement;
  private roomInfo!: HTMLDivElement;
  private startGameBtn!: HTMLButtonElement;
  private currentHostId: string | null = null;

  // Game HUD
  private gameHud!: HTMLDivElement;
  private playerList!: HTMLDivElement;
  private eventLog!: HTMLDivElement;
  private rollBtn!: HTMLButtonElement;
  private buyBtn!: HTMLButtonElement;
  private declineBtn!: HTMLButtonElement;
  private ransomBtn!: HTMLButtonElement;
  private chatInput!: HTMLInputElement;
  private gameOverBanner!: HTMLDivElement;
  private spectatorBanner!: HTMLDivElement;
  private errorBanner!: HTMLDivElement;
  private wasMyTurn = false;
  private myName: string | null = null;
  private myPropsPanel!: HTMLDivElement;
  private travelPanel!: HTMLDivElement;
  private tradePanel!: HTMLDivElement;
  private incomingSwapPanel!: HTMLDivElement;

  constructor(root: HTMLDivElement, net: Net) {
    this.root = root;
    this.net = net;
    this.injectStyles();
    this.buildLobby();
    this.buildRoomPanel();
    this.buildGameHud();
    this.buildGameOverBanner();
    this.buildMyPropsPanel();
    this.buildTravelPanel();
    this.buildTradePanel();
    this.buildIncomingSwapPanel();
    this.buildVersion();
    this.buildError();
  }

  private injectStyles() {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  private buildLobby() {
    const lobby = document.createElement("div");
    lobby.id = "lobby";
    lobby.className = "panel";
    lobby.innerHTML = `
      <h2 style="margin-bottom:12px;color:#facc15;">LasPoly</h2>
      <label>Nickname</label>
      <input id="nickname" type="text" placeholder="Your name" value="Player" />
      <label>Board</label>
      <select id="boardId"></select>
      <label>Bot count</label>
      <select id="botCount">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3" selected>3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
      <button id="createRoom" style="margin-top:16px;width:100%;">Create Room</button>
      <div id="roomList"></div>
    `;
    this.root.appendChild(lobby);
    this.lobby = lobby;

    this.nicknameInput = document.getElementById("nickname") as HTMLInputElement;
    this.boardIdSelect = document.getElementById("boardId") as HTMLSelectElement;
    this.botCountSelect = document.getElementById("botCount") as HTMLSelectElement;
    this.createRoomBtn = document.getElementById("createRoom") as HTMLButtonElement;
    this.roomList = document.getElementById("roomList") as HTMLDivElement;

    // Populate boards
    for (const b of listBoards()) {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.name;
      this.boardIdSelect.appendChild(opt);
    }

    this.createRoomBtn.addEventListener("click", () => {
      const nickname = this.nicknameInput.value.trim() || "Player";
      this.myName = nickname;
      const boardId = this.boardIdSelect.value || listBoards()[0]?.id || "vegas";
      const botCount = parseInt(this.botCountSelect.value, 10);
      const safeBotCount = Number.isNaN(botCount) ? 3 : Math.max(0, Math.min(5, botCount));
      this.net.send({
        t: "createRoom",
        name: `${nickname}'s Room`,
        nickname,
        boardId,
        botCount: safeBotCount,
      });
    });
  }

  private buildRoomPanel() {
    const panel = document.createElement("div");
    panel.id = "roomPanel";
    panel.className = "panel";
    hide(panel);
    panel.innerHTML = `
      <h2 style="margin-bottom:12px;color:#facc15;">Room</h2>
      <div id="roomInfo" style="margin-bottom:12px;font-size:13px;color:#ccc;"></div>
      <button id="startGame" style="width:100%;">Start Game</button>
      <button id="leaveRoom" style="width:100%;background:#6b7280;margin-top:4px;">Leave Room</button>
    `;
    this.root.appendChild(panel);
    this.roomPanel = panel;
    this.roomInfo = document.getElementById("roomInfo") as HTMLDivElement;
    this.startGameBtn = document.getElementById("startGame") as HTMLButtonElement;

    this.startGameBtn.addEventListener("click", () => {
      this.net.send({ t: "startGame" });
    });

    const leaveBtn = document.getElementById("leaveRoom") as HTMLButtonElement;
    leaveBtn.addEventListener("click", () => {
      clearSession();
      this.net.send({ t: "leaveRoom" });
      this.showLobbyPanel();
    });
  }

  private buildGameHud() {
    const hud = document.createElement("div");
    hud.id = "gameHud";
    hide(hud);
    this.root.appendChild(hud);
    this.gameHud = hud;

    // Player list
    const playerListPanel = document.createElement("div");
    playerListPanel.id = "playerList";
    playerListPanel.className = "panel";
    hud.appendChild(playerListPanel);
    this.playerList = playerListPanel;

    // Event log
    const logPanel = document.createElement("div");
    logPanel.id = "eventLogPanel";
    logPanel.className = "panel";
    logPanel.innerHTML = `
      <div style="font-size:12px;color:#aaa;margin-bottom:4px;">Ereignisse</div>
      <div id="eventLog"></div>
      <div id="chatRow">
        <input id="chatInput" type="text" placeholder="Chat..." />
        <button id="chatSendBtn">Send</button>
      </div>
    `;
    hud.appendChild(logPanel);
    this.eventLog = document.getElementById("eventLog") as HTMLDivElement;
    this.chatInput = document.getElementById("chatInput") as HTMLInputElement;

    const chatSendBtn = document.getElementById("chatSendBtn") as HTMLButtonElement;
    chatSendBtn.addEventListener("click", () => this.sendChat());
    this.chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.sendChat();
    });

    // Action panel
    const actionPanel = document.createElement("div");
    actionPanel.id = "actionPanel";
    actionPanel.className = "panel";
    actionPanel.innerHTML = `
      <button id="rollBtn">Würfeln</button>
      <button id="buyBtn">Kaufen</button>
      <button id="declineBtn">Ablehnen</button>
      <button id="ransomBtn">Freikaufen</button>
    `;
    hud.appendChild(actionPanel);

    this.rollBtn = document.getElementById("rollBtn") as HTMLButtonElement;
    this.buyBtn = document.getElementById("buyBtn") as HTMLButtonElement;
    this.declineBtn = document.getElementById("declineBtn") as HTMLButtonElement;
    this.ransomBtn = document.getElementById("ransomBtn") as HTMLButtonElement;

    // Hide action buttons initially
    hide(this.rollBtn);
    hide(this.buyBtn);
    hide(this.declineBtn);
    hide(this.ransomBtn);

    this.rollBtn.addEventListener("click", () =>
      this.net.send({ t: "command", command: { type: "ROLL_DICE" } })
    );
    this.buyBtn.addEventListener("click", () =>
      this.net.send({ t: "command", command: { type: "BUY_PROPERTY" } })
    );
    this.declineBtn.addEventListener("click", () =>
      this.net.send({ t: "command", command: { type: "DECLINE_PROPERTY" } })
    );
    this.ransomBtn.addEventListener("click", () =>
      this.net.send({ t: "command", command: { type: "PAY_RANSOM" } })
    );

    // Spectator banner
    const spectatorBanner = document.createElement("div");
    spectatorBanner.id = "spectatorBanner";
    spectatorBanner.textContent = "Du bist Zuschauer";
    hide(spectatorBanner);
    this.root.appendChild(spectatorBanner);
    this.spectatorBanner = spectatorBanner;
  }

  private buildMyPropsPanel() {
    const panel = document.createElement("div");
    panel.id = "myPropsPanel";
    panel.className = "panel";
    hide(panel);
    this.gameHud.appendChild(panel);
    this.myPropsPanel = panel;
  }

  private buildTravelPanel() {
    const panel = document.createElement("div");
    panel.id = "travelPanel";
    panel.className = "panel";
    hide(panel);
    this.gameHud.appendChild(panel);
    this.travelPanel = panel;
  }

  private buildTradePanel() {
    const panel = document.createElement("div");
    panel.id = "tradePanel";
    panel.className = "panel";
    hide(panel);
    this.gameHud.appendChild(panel);
    this.tradePanel = panel;
  }

  private buildIncomingSwapPanel() {
    const panel = document.createElement("div");
    panel.id = "incomingSwapPanel";
    panel.className = "panel";
    hide(panel);
    this.gameHud.appendChild(panel);
    this.incomingSwapPanel = panel;
  }

  private buildGameOverBanner() {
    const banner = document.createElement("div");
    banner.id = "gameOverBanner";
    banner.innerHTML = `
      <h1>Spiel vorbei!</h1>
      <div id="gameOverWinner" style="font-size:1.5rem;color:#fff;"></div>
      <button id="gameOverRestart" style="margin-top:16px;">Zurück zur Lobby</button>
    `;
    hide(banner);
    this.root.appendChild(banner);
    this.gameOverBanner = banner;

    const restartBtn = document.getElementById("gameOverRestart") as HTMLButtonElement;
    restartBtn.addEventListener("click", () => {
      clearSession();
      hide(this.gameOverBanner);
      this.net.send({ t: "listRooms" });
    });
  }

  private buildVersion() {
    const badge = document.createElement("div");
    badge.id = "versionBadge";
    badge.textContent = `v${VERSION}`;
    this.root.appendChild(badge);
  }

  private buildError() {
    const banner = document.createElement("div");
    banner.id = "errorBanner";
    hide(banner);
    this.root.appendChild(banner);
    this.errorBanner = banner;
  }

  private sendChat() {
    const text = this.chatInput.value.trim();
    if (text) {
      this.net.send({ t: "chat", text });
      this.chatInput.value = "";
    }
  }

  private appendEventLine(text: string) {
    const line = document.createElement("div");
    line.className = "event-line";
    line.textContent = text;
    this.eventLog.appendChild(line);
    this.eventLog.scrollTop = this.eventLog.scrollHeight;
  }

  private showLobbyPanel() {
    show(this.lobby);
    hide(this.roomPanel);
    hide(this.gameHud);
    hide(this.spectatorBanner);
    this.wasMyTurn = false;
    this.net.send({ t: "listRooms" });
  }

  showLobby(rooms: RoomSummary[]) {
    show(this.lobby);
    hide(this.roomPanel);
    hide(this.gameHud);
    hide(this.spectatorBanner);

    this.roomList.innerHTML = "";
    if (rooms.length > 0) {
      const header = document.createElement("div");
      header.style.cssText = "margin-top:12px;font-size:12px;color:#aaa;";
      header.textContent = "Offene Räume:";
      this.roomList.appendChild(header);

      for (const room of rooms) {
        if (room.started) continue;
        const item = document.createElement("div");
        item.className = "room-item";
        item.innerHTML = `<strong>${room.name}</strong> <span style="color:#aaa;font-size:12px;">(${room.playerCount} Spieler)</span>`;
        item.addEventListener("click", () => {
          const nickname = this.nicknameInput.value.trim() || "Player";
          this.net.send({ t: "joinRoom", roomId: room.id, nickname });
        });
        this.roomList.appendChild(item);
      }
    }
  }

  onJoined(_roomId: string, _playerId: string) {
    hide(this.lobby);
    show(this.roomPanel);
    this.roomInfo.textContent = "Warte auf Spielstart...";
    hide(this.startGameBtn);
  }

  showRoom(room: RoomView) {
    this.currentHostId = room.host;
    hide(this.lobby);
    show(this.roomPanel);
    hide(this.gameHud);

    const playerNames = room.players.map(p => p.nickname + (p.isBot ? " (Bot)" : "")).join(", ");
    this.roomInfo.innerHTML = `
      <div><strong>${room.name}</strong></div>
      <div style="margin-top:4px;">Spieler: ${playerNames}</div>
      <div style="margin-top:4px;color:#aaa;">Board: ${room.boardId} | Bots: ${room.botCount}</div>
    `;

    // Show start button only if we're the host
    if (this.net.playerId === room.host) {
      show(this.startGameBtn, "block");
      const humanCount = room.players.filter(p => !p.isBot).length;
      const totalPlayers = humanCount + room.botCount;
      if (totalPlayers < 2) {
        this.startGameBtn.disabled = true;
        this.startGameBtn.title = "Mindestens 2 Spieler nötig";
      } else {
        this.startGameBtn.disabled = false;
        this.startGameBtn.title = "";
      }
    } else {
      hide(this.startGameBtn);
    }
  }

  updateGame(state: GameState, events: FormattedEvent[], myId: string | null) {
    hide(this.lobby);
    hide(this.roomPanel);
    show(this.gameHud, "block");

    const currentPlayer = state.players[state.currentPlayerIndex];
    const isMyTurn = myId !== null && currentPlayer?.id === myId;
    const me = myId ? state.players.find(p => p.id === myId) : null;
    const amAlive = me?.alive ?? false;

    // Update player list
    this.playerList.innerHTML = "";
    for (let i = 0; i < state.players.length; i++) {
      const p = state.players[i];
      if (!p) continue;
      const isCurrent = i === state.currentPlayerIndex;
      const row = document.createElement("div");
      row.className = "player-row" + (isCurrent ? " current-player" : "") + (!p.alive ? " dead" : "");

      const dot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`;
      const rollStr = p.lastRoll[0] > 0 ? ` [${p.lastRoll[0]}+${p.lastRoll[1]}]` : "";
      const jail = p.inJail ? " (Knast)" : "";
      row.innerHTML = `${dot}<strong>${p.name}</strong>${p.isBot ? " (Bot)" : ""}${jail}${rollStr}<br><span style="color:#aaa;font-size:11px;">LPD ${p.money} | Pos ${p.position}</span>`;
      this.playerList.appendChild(row);
    }

    // Append new events to log
    for (const ev of events) {
      this.appendEventLine(ev.text);
    }

    // Emit a local "ist an der Reihe" notification when our turn begins
    if (isMyTurn && !this.wasMyTurn && amAlive) {
      const name = me?.name ?? this.myName ?? "Du";
      this.appendEventLine(`${name} ist an der Reihe.`);
    }
    this.wasMyTurn = isMyTurn && amAlive;

    // Show/hide action buttons
    const showRoll = isMyTurn && amAlive && state.phase === "awaiting-roll";
    const showBuy = isMyTurn && amAlive && state.phase === "awaiting-buy";
    const showRansom = isMyTurn && amAlive && state.phase === "awaiting-roll" && (me?.inJail ?? false);

    if (showRoll) { show(this.rollBtn, "inline-block"); this.rollBtn.disabled = false; }
    else { hide(this.rollBtn); this.rollBtn.disabled = true; }

    if (showBuy) { show(this.buyBtn, "inline-block"); this.buyBtn.disabled = false; }
    else { hide(this.buyBtn); this.buyBtn.disabled = true; }

    if (showBuy) { show(this.declineBtn, "inline-block"); this.declineBtn.disabled = false; }
    else { hide(this.declineBtn); this.declineBtn.disabled = true; }

    if (showRansom) { show(this.ransomBtn, "inline-block"); this.ransomBtn.disabled = false; }
    else { hide(this.ransomBtn); this.ransomBtn.disabled = true; }

    // Spectator banner
    if (myId && !amAlive && state.phase !== "finished") {
      show(this.spectatorBanner, "block");
    } else {
      hide(this.spectatorBanner);
    }

    // Incoming swap panel (visible regardless of whose turn it is)
    if (myId) {
      this.refreshIncomingSwapPanel(state, myId);
    } else {
      hide(this.incomingSwapPanel);
    }

    // My-properties panel + travel (only during my awaiting-roll turn, not in jail)
    const showMgmt = isMyTurn && amAlive && state.phase === "awaiting-roll" && !(me?.inJail ?? false);
    if (showMgmt && myId) {
      this.refreshMyPropsPanel(state, myId);

      // Travel panel: show if player is at a station
      const travelDests = canTravelFrom(state, myId);
      if (travelDests.length > 0) {
        this.refreshTravelPanel(state, myId);
        show(this.travelPanel, "block");
      } else {
        hide(this.travelPanel);
      }
    } else {
      hide(this.myPropsPanel);
      hide(this.travelPanel);
      if (!isMyTurn) hide(this.tradePanel);
    }
  }

  addChat(from: string, text: string) {
    const line = document.createElement("div");
    line.className = "event-line";
    line.innerHTML = `<span style="color:#60a5fa;">${from}:</span> ${text}`;
    this.eventLog.appendChild(line);
    this.eventLog.scrollTop = this.eventLog.scrollHeight;
  }

  showError(msg: string) {
    this.errorBanner.textContent = msg;
    show(this.errorBanner, "block");
    setTimeout(() => hide(this.errorBanner), 4000);
  }

  showGameOver(winnerName: string) {
    const winnerEl = document.getElementById("gameOverWinner");
    if (winnerEl) winnerEl.textContent = `Gewinner: ${winnerName}`;
    show(this.gameOverBanner, "flex");
  }

  private groupCssColor(group: string): string {
    const map: Record<string, string> = {
      brown: "#8B4513", deeppink: "#FF1493", turquoise: "#40E0D0",
      violet: "#EE82EE", mistyrose: "#FFE4E1", orange: "#FFA500",
      lightgreen: "#90EE90", red: "#FF0000", yellow: "#FFFF00",
      darkviolet: "#9400D3", darkgreen: "#006400", royalblue: "#4169E1",
      station: "#888888", attraction: "#FFD700",
    };
    return map[group] ?? "#666";
  }

  private refreshMyPropsPanel(state: GameState, myId: string) {
    const panel = this.myPropsPanel;
    panel.innerHTML = "";

    const board = getBoard(state.boardId);
    const props = ownedPropsOf(state, myId).sort((a, b) => a - b);

    if (props.length === 0) {
      hide(panel);
      return;
    }

    // Header with trade button
    const header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;";
    header.innerHTML = `<span style="font-size:13px;color:#facc15;font-weight:bold;">Meine Grundstücke</span>`;
    const tradeBtn = document.createElement("button");
    tradeBtn.className = "prop-btn";
    tradeBtn.textContent = "Tauschen";
    tradeBtn.addEventListener("click", () => {
      const panelVisible = this.tradePanel.style.display !== "none";
      if (panelVisible) {
        hide(this.tradePanel);
      } else {
        this.refreshTradePanel(state, myId);
        show(this.tradePanel, "block");
      }
    });
    header.appendChild(tradeBtn);
    panel.appendChild(header);

    for (const pos of props) {
      const tile = board.tiles[pos];
      if (!tile) continue;
      const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
      const isMortgaged = !!state.mortgaged[pos];

      const row = document.createElement("div");
      row.className = "prop-row";

      const tileGroup = (tile as { group?: string }).group;
      const groupColor = tileGroup
        ? `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${this.groupCssColor(tileGroup)};margin-right:4px;"></span>`
        : "";

      let buildingStr = "";
      if (b.hotel) buildingStr = "[Hotel]";
      else if (b.factory) buildingStr = "[Fabrik]";
      else if (b.houses > 0) buildingStr = `[${b.houses} Haus${b.houses > 1 ? "häuser" : ""}]`;
      else buildingStr = "—";

      const mortgageStr = isMortgaged ? " <span style='color:#f87171;'>[Hypothek]</span>" : "";

      row.innerHTML = `
        <div class="prop-name">${groupColor}${tile.name}${mortgageStr}</div>
        <div class="prop-detail">Gebäude: ${buildingStr}</div>
      `;

      // Buttons
      const btnRow = document.createElement("div");
      btnRow.style.marginTop = "4px";

      // BUILD buttons (only for streets with whole-group ownership)
      if (tile.type === "street") {
        const st = tile as StreetTile;
        if (canBuild(state, pos, "house")) {
          const btn = document.createElement("button");
          btn.className = "prop-btn";
          btn.textContent = `Haus (${st.houseCost} LPD)`;
          btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "house" } }));
          btnRow.appendChild(btn);
        }
        if (canBuild(state, pos, "hotel")) {
          const btn = document.createElement("button");
          btn.className = "prop-btn";
          btn.textContent = `Hotel (${st.hotelCost} LPD)`;
          btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "hotel" } }));
          btnRow.appendChild(btn);
        }
        if (canBuild(state, pos, "factory")) {
          const btn = document.createElement("button");
          btn.className = "prop-btn";
          btn.textContent = `Fabrik (${st.factoryCost} LPD)`;
          btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "factory" } }));
          btnRow.appendChild(btn);
        }
        if (canSellBuilding(state, pos)) {
          const btn = document.createElement("button");
          btn.className = "prop-btn danger";
          btn.textContent = "Gebäude verk.";
          btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "SELL_BUILDING", pos } }));
          btnRow.appendChild(btn);
        }
      }

      if (canMortgage(state, pos)) {
        const mv = mortgageValue(board, tile);
        const btn = document.createElement("button");
        btn.className = "prop-btn";
        btn.textContent = `Hypothek (+${mv})`;
        btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "MORTGAGE", pos } }));
        btnRow.appendChild(btn);
      }
      if (canUnmortgage(state, pos)) {
        const mv = mortgageValue(board, tile);
        const cost = Math.floor(mv * board.rules.mortgageUnmortgageMultiplier);
        const btn = document.createElement("button");
        btn.className = "prop-btn";
        btn.textContent = `Ablösen (-${cost})`;
        btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "UNMORTGAGE", pos } }));
        btnRow.appendChild(btn);
      }
      if (canSellProperty(state, pos)) {
        const refund = Math.floor(tilePrice(board, tile) / 2);
        const btn = document.createElement("button");
        btn.className = "prop-btn danger";
        btn.textContent = `Verkaufen (+${refund})`;
        btn.addEventListener("click", () => this.net.send({ t: "command", command: { type: "SELL_PROPERTY", pos } }));
        btnRow.appendChild(btn);
      }

      if (btnRow.children.length > 0) row.appendChild(btnRow);
      panel.appendChild(row);
    }

    show(panel, "block");
  }

  private refreshTravelPanel(state: GameState, myId: string) {
    const panel = this.travelPanel;
    panel.innerHTML = "";

    const dests = canTravelFrom(state, myId);
    if (dests.length === 0) { hide(panel); return; }

    const board = getBoard(state.boardId);
    const stationPositions = [5, 15, 25, 35];

    const title = document.createElement("div");
    title.style.cssText = "font-size:13px;color:#facc15;font-weight:bold;margin-bottom:8px;";
    title.textContent = "Reisen nach…";
    panel.appendChild(title);

    for (const dest of dests) {
      const tile = board.tiles[dest];
      if (!tile) continue;
      const destOwner = state.ownership[dest];
      let ticketCost = 0;
      if (destOwner && destOwner !== myId) {
        const count = stationPositions.filter((p) => state.ownership[p] === destOwner).length;
        ticketCost = board.rules.station.travel[Math.min(count - 1, 2)] ?? 0;
      }

      const btn = document.createElement("button");
      btn.style.cssText = "display:block;width:100%;margin:4px 0;text-align:left;";
      btn.textContent = ticketCost > 0
        ? `${tile.name} (${ticketCost} LPD Ticket)`
        : `${tile.name} (kostenlos)`;
      btn.addEventListener("click", () => {
        this.net.send({ t: "command", command: { type: "TRAVEL", toPos: dest } });
        hide(panel);
      });
      panel.appendChild(btn);
    }

    const closeBtn = document.createElement("button");
    closeBtn.style.cssText = "display:block;width:100%;margin-top:8px;background:#555;";
    closeBtn.textContent = "Schließen";
    closeBtn.addEventListener("click", () => hide(panel));
    panel.appendChild(closeBtn);
  }

  private refreshTradePanel(state: GameState, myId: string) {
    const panel = this.tradePanel;
    panel.innerHTML = "";

    const board = getBoard(state.boardId);
    const alivePlayers = state.players.filter((p) => p.alive && p.id !== myId);

    const title = document.createElement("div");
    title.style.cssText = "font-size:13px;color:#facc15;font-weight:bold;margin-bottom:10px;";
    title.textContent = "Tauschangebot erstellen";
    panel.appendChild(title);

    // Target player selector
    const targetLabel = document.createElement("label");
    targetLabel.textContent = "Anbieten an:";
    panel.appendChild(targetLabel);

    const targetSelect = document.createElement("select");
    for (const p of alivePlayers) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      targetSelect.appendChild(opt);
    }
    panel.appendChild(targetSelect);

    // My props to give (unbuilt, unmortgaged only)
    const myProps = ownedPropsOf(state, myId).filter((pos) => {
      const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
      return !(b.houses > 0 || b.hotel || b.factory) && !state.mortgaged[pos];
    });

    const giveSection = document.createElement("div");
    giveSection.className = "swap-section";
    giveSection.innerHTML = `<div class="swap-label">Ich gebe (Grundstücke):</div>`;

    const giveChecks = new Map<number, HTMLInputElement>();
    for (const pos of myProps) {
      const tile = board.tiles[pos];
      if (!tile) continue;
      const row = document.createElement("div");
      row.className = "swap-check-row";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      const lbl = document.createElement("label");
      lbl.textContent = tile.name;
      row.appendChild(cb);
      row.appendChild(lbl);
      giveSection.appendChild(row);
      giveChecks.set(pos, cb);
    }

    const giveMoneyRow = document.createElement("div");
    giveMoneyRow.className = "swap-check-row";
    const giveMoneyInput = document.createElement("input");
    giveMoneyInput.type = "number";
    giveMoneyInput.min = "0";
    giveMoneyInput.value = "0";
    giveMoneyInput.style.cssText = "width:80px;display:inline;margin-left:4px;";
    giveMoneyInput.id = "giveMoneyInput";
    const giveMoneyLbl = document.createElement("label");
    giveMoneyLbl.textContent = "Geld geben:";
    giveMoneyRow.appendChild(giveMoneyLbl);
    giveMoneyRow.appendChild(giveMoneyInput);
    const giveMoneyUnit = document.createElement("span");
    giveMoneyUnit.textContent = " LPD";
    giveMoneyRow.appendChild(giveMoneyUnit);
    giveSection.appendChild(giveMoneyRow);
    panel.appendChild(giveSection);

    // Target props to receive
    const receiveSection = document.createElement("div");
    receiveSection.className = "swap-section";
    panel.appendChild(receiveSection);

    const receiveMoneySection = document.createElement("div");
    receiveMoneySection.className = "swap-section";
    const receiveMoneyInput = document.createElement("input");
    receiveMoneyInput.type = "number";
    receiveMoneyInput.min = "0";
    receiveMoneyInput.value = "0";
    receiveMoneyInput.style.cssText = "width:80px;display:inline;margin-left:4px;";
    receiveMoneyInput.id = "receiveMoneyInput";
    const recvLbl = document.createElement("label");
    recvLbl.textContent = "Geld erhalten:";
    const recvUnit = document.createElement("span");
    recvUnit.textContent = " LPD";
    receiveMoneySection.innerHTML = `<div class="swap-label">Ich erhalte (Geld):</div>`;
    const recvMoneyRow = document.createElement("div");
    recvMoneyRow.className = "swap-check-row";
    recvMoneyRow.appendChild(recvLbl);
    recvMoneyRow.appendChild(receiveMoneyInput);
    recvMoneyRow.appendChild(recvUnit);
    receiveMoneySection.appendChild(recvMoneyRow);
    panel.appendChild(receiveMoneySection);

    const receiveChecks = new Map<number, HTMLInputElement>();

    const rebuildReceiveSection = () => {
      const tId = targetSelect.value;
      const targetName = targetSelect.options[targetSelect.selectedIndex]?.text ?? "?";
      receiveSection.innerHTML = `<div class="swap-label">Ich erhalte (Grundstücke von ${targetName}):</div>`;
      receiveChecks.clear();
      const theirProps = ownedPropsOf(state, tId).filter((pos) => {
        const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
        return !(b.houses > 0 || b.hotel || b.factory) && !state.mortgaged[pos];
      });
      for (const pos of theirProps) {
        const tile = board.tiles[pos];
        if (!tile) continue;
        const row = document.createElement("div");
        row.className = "swap-check-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        const lbl = document.createElement("label");
        lbl.textContent = tile.name;
        row.appendChild(cb);
        row.appendChild(lbl);
        receiveSection.appendChild(row);
        receiveChecks.set(pos, cb);
      }
    };

    rebuildReceiveSection();
    targetSelect.addEventListener("change", rebuildReceiveSection);

    // Offer + cancel buttons
    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:8px;margin-top:12px;";

    const offerBtn = document.createElement("button");
    offerBtn.textContent = "Anbieten";
    offerBtn.addEventListener("click", () => {
      const toId = targetSelect.value;
      const giveProps = [...giveChecks.entries()].filter(([, cb]) => cb.checked).map(([pos]) => pos);
      const recvProps = [...receiveChecks.entries()].filter(([, cb]) => cb.checked).map(([pos]) => pos);
      const giveMoneyVal = parseInt(giveMoneyInput.value, 10) || 0;
      const recvMoneyVal = parseInt(receiveMoneyInput.value, 10) || 0;
      this.net.send({
        t: "command",
        command: {
          type: "PROPOSE_SWAP",
          toId,
          give: { props: giveProps, money: giveMoneyVal },
          receive: { props: recvProps, money: recvMoneyVal },
        },
      });
      hide(panel);
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.style.cssText = "background:#555;";
    cancelBtn.textContent = "Abbrechen";
    cancelBtn.addEventListener("click", () => hide(panel));

    btnRow.appendChild(offerBtn);
    btnRow.appendChild(cancelBtn);
    panel.appendChild(btnRow);
  }

  private refreshIncomingSwapPanel(state: GameState, myId: string) {
    const panel = this.incomingSwapPanel;
    const swap = state.pendingSwap;

    if (!swap || swap.toId !== myId) {
      hide(panel);
      return;
    }

    panel.innerHTML = "";
    const board = getBoard(state.boardId);
    const from = state.players.find((p) => p.id === swap.fromId);

    const title = document.createElement("div");
    title.style.cssText = "font-size:13px;color:#facc15;font-weight:bold;margin-bottom:8px;";
    title.textContent = `Tauschangebot von ${from?.name ?? "?"}`;
    panel.appendChild(title);

    const giveNames = swap.give.props.map((pos) => board.tiles[pos]?.name ?? `Pos ${pos}`).join(", ") || "—";
    const recvNames = swap.receive.props.map((pos) => board.tiles[pos]?.name ?? `Pos ${pos}`).join(", ") || "—";

    const info = document.createElement("div");
    info.style.cssText = "font-size:12px;color:#ccc;margin-bottom:10px;";
    info.innerHTML = `
      <div><strong>Du gibst:</strong> ${recvNames} + ${swap.receive.money} LPD</div>
      <div><strong>Du erhältst:</strong> ${giveNames} + ${swap.give.money} LPD</div>
    `;
    panel.appendChild(info);

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:8px;";

    const acceptBtn = document.createElement("button");
    acceptBtn.textContent = "Annehmen";
    acceptBtn.addEventListener("click", () => {
      this.net.send({ t: "command", command: { type: "RESPOND_SWAP", accept: true } });
      hide(panel);
    });

    const declineBtn = document.createElement("button");
    declineBtn.style.background = "#991b1b";
    declineBtn.textContent = "Ablehnen";
    declineBtn.addEventListener("click", () => {
      this.net.send({ t: "command", command: { type: "RESPOND_SWAP", accept: false } });
      hide(panel);
    });

    btnRow.appendChild(acceptBtn);
    btnRow.appendChild(declineBtn);
    panel.appendChild(btnRow);

    show(panel, "block");
  }
}
