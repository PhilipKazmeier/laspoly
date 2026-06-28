import { VERSION, listBoards } from "@laspoly/shared";
import type { RoomSummary, RoomView, GameState, FormattedEvent } from "@laspoly/shared";
import type { Net } from "./net.js";

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

  constructor(root: HTMLDivElement, net: Net) {
    this.root = root;
    this.net = net;
    this.injectStyles();
    this.buildLobby();
    this.buildRoomPanel();
    this.buildGameHud();
    this.buildGameOverBanner();
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
      const botCount = parseInt(this.botCountSelect.value, 10) || 3;
      this.net.send({
        t: "createRoom",
        name: `${nickname}'s Room`,
        nickname,
        boardId,
        botCount,
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
      this.startGameBtn.disabled = false;
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
}
