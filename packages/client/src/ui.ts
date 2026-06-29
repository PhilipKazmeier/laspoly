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
import { FIGURE_COLORS, FIGURE_COUNT } from "@laspoly/shared";
import type { RoomSummary, RoomView, GameState, FormattedEvent, StreetTile } from "@laspoly/shared";
import type { Net } from "./net.js";
import type { Board3D } from "./board3d.js";
import { clearSession } from "./net.js";
import { audio } from "./audio.js";

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
    position: absolute; top: 64px; left: 16px;
    width: 220px;
    max-height: calc(60vh - 48px);
    overflow-y: auto;
  }
  .player-row { padding: 8px 10px; margin: 4px 0; border-radius: 6px; border: 1px solid #333; font-size: 13px; }
  .player-row.current-player { border-color: #facc15; background: rgba(250,204,21,0.1); }
  .player-row.dead { opacity: 0.4; }
  .chip-stack { display:flex; align-items:center; gap:2px; flex-wrap:wrap; margin-top:2px; }
  .chip-img { width:16px; height:16px; object-fit:contain; image-rendering:pixelated; }
  .chip-count { font-size:10px; color:#aaa; margin-left:1px; }
  .deed-strip { display:flex; flex-wrap:wrap; gap:2px; margin-top:3px; }
  .deed-chip {
    width:12px; height:16px; border-radius:2px;
    display:inline-block; cursor:default;
    border:1px solid rgba(255,255,255,0.15);
  }
  .deed-more { font-size:10px; color:#888; align-self:center; margin-left:2px; }
  #actionCardPopup {
    position: absolute; top: calc(50% + 24px); left: 50%; transform: translate(-50%, -50%);
    width: 320px;
    background: #1a1a2e; border: 2px solid #f97316; border-radius: 10px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.7);
    z-index: 100;
  }
  #actionCardPopup .ac-header {
    background: #f97316; color: #fff; font-weight: bold; font-size: 15px;
    padding: 10px 16px; border-radius: 8px 8px 0 0;
    text-align: center;
  }
  #actionCardPopup .ac-body {
    padding: 16px; color: #eee; font-size: 14px; line-height: 1.5;
    text-align: center;
  }
  #actionCardPopup .ac-footer {
    padding: 0 16px 14px; text-align: center;
  }
  #buyOfferPanel {
    position: absolute; bottom: 100px; right: 16px;
    width: 260px;
    background: rgba(10,10,30,0.95); border: 2px solid #facc15;
    border-radius: 10px; padding: 0;
    color: #eee; overflow: hidden;
  }
  #buyOfferPanel .buy-header {
    background: #facc15; color: #1a1a2e;
    font-weight: bold; font-size: 13px;
    padding: 8px 14px;
  }
  #buyOfferPanel .buy-body { padding: 10px 14px; }
  #buyOfferPanel h3 { color: #facc15; margin: 0 0 6px; font-size: 14px; display: none; }
  #buyOfferPanel .buy-detail { font-size: 12px; color: #ccc; margin: 3px 0; }
  #buyOfferPanel .buy-btns { display:flex; gap:8px; margin-top:10px; }
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
    position: absolute; top: 56px; left: 50%; transform: translateX(-50%);
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
  #specialEventBanner {
    position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
    background: rgba(20, 10, 40, 0.88);
    border: 1px solid #a855f7;
    border-radius: 8px;
    padding: 6px 18px;
    font-size: 13px;
    color: #e9d5ff;
    pointer-events: none;
    white-space: nowrap;
    max-width: 480px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  #myPropsPanel {
    position: absolute; top: 64px; right: 16px;
    width: 280px;
    max-height: calc(70vh - 48px);
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
  #gameHeader {
    position: absolute; top: 0; left: 0; width: 100%; height: 48px;
    background: linear-gradient(to bottom, #c2410c, #ea580c);
    border-bottom: 2px solid #f97316;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 12px;
    box-sizing: border-box;
    z-index: 50;
    pointer-events: none;
    font-family: 'Segoe UI', Arial, sans-serif;
  }
  #gameHeader > * { pointer-events: auto; }
  #headerLeft { display: flex; flex-direction: column; gap: 1px; min-width: 160px; }
  #headerLeft .room-label { font-size: 13px; font-weight: bold; color: #fff; line-height: 1.2; }
  #headerLeft .board-label { font-size: 11px; color: rgba(255,255,255,0.75); line-height: 1.2; }
  #headerCenter { flex: 1; text-align: center; padding: 0 8px; }
  #headerTurnStatus {
    font-size: 15px; font-weight: bold; color: #fff;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    line-height: 1.2;
  }
  #headerRound { font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 1px; }
  #headerEvent { font-size: 11px; color: #fde68a; margin-top: 1px; }
  #headerRight { display: flex; align-items: center; gap: 6px; min-width: 200px; justify-content: flex-end; }
  .hdr-btn {
    background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.3);
    color: #fff; border-radius: 5px; padding: 4px 8px;
    font-size: 12px; cursor: pointer; white-space: nowrap;
    font-family: 'Segoe UI', Arial, sans-serif;
  }
  .hdr-btn:hover { background: rgba(0,0,0,0.45); }
  #headerVersion { font-size: 10px; color: rgba(255,255,255,0.5); margin-left: 4px; }
  #turnToast {
    position: absolute; bottom: 140px; right: 16px;
    background: rgba(15, 15, 35, 0.92);
    border: 1px solid #f97316;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    color: #fff;
    max-width: 240px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 60;
  }
  #turnToast.visible { opacity: 1; }
  #helpOverlay {
    position: absolute; top: 56px; left: 50%; transform: translateX(-50%);
    width: 320px;
    background: rgba(10,10,30,0.95); border: 1px solid #f97316;
    border-radius: 8px; padding: 16px;
    color: #eee; font-size: 13px; line-height: 1.6;
    z-index: 80;
  }
  #helpOverlay h3 { color: #f97316; margin: 0 0 10px; font-size: 14px; }
  #helpOverlay ul { margin: 0; padding-left: 18px; }
  #helpOverlay li { margin: 4px 0; }
  #settingsOverlay {
    position: absolute; top: 56px; right: 12px;
    width: 200px;
    background: rgba(10,10,30,0.95); border: 1px solid #444;
    border-radius: 8px; padding: 12px;
    color: #eee; font-size: 13px;
    z-index: 80;
  }
  #settingsOverlay label { color: #aaa; font-size: 12px; margin-top: 6px; }
  #deedCardPopup {
    position: absolute; top: 64px; left: 50%; transform: translateX(-50%);
    width: 300px;
    background: #1a1a2e; border: 2px solid #facc15; border-radius: 10px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.7);
    z-index: 90;
    overflow: hidden;
  }
  #deedCardPopup .dc-color-bar {
    height: 8px; width: 100%;
  }
  #deedCardPopup .dc-header {
    padding: 10px 16px 6px; font-weight: bold; font-size: 15px; color: #facc15;
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  #deedCardPopup .dc-close {
    background: none; border: none; color: #aaa; font-size: 18px;
    cursor: pointer; padding: 0 0 0 8px; line-height: 1;
  }
  #deedCardPopup .dc-close:hover { color: #fff; }
  #deedCardPopup .dc-body {
    padding: 8px 16px 14px; color: #eee; font-size: 12px; line-height: 1.6;
  }
  #deedCardPopup .dc-row { display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding: 2px 0; }
  #deedCardPopup .dc-row:last-child { border-bottom: none; }
  #deedCardPopup .dc-label { color: #aaa; }
  #deedCardPopup .dc-value { color: #fff; text-align: right; }
  #deedCardPopup .dc-owner { margin-top: 8px; font-size: 12px; color: #60a5fa; }
  #deedCardPopup .dc-status { font-size: 11px; color: #f87171; margin-top: 2px; }
  #specialEventToast {
    position: absolute; top: 56px; left: 50%; transform: translateX(-50%);
    background: rgba(88, 28, 135, 0.95);
    border: 1px solid #a855f7;
    border-radius: 10px;
    padding: 10px 16px 10px 16px;
    font-size: 13px;
    color: #e9d5ff;
    max-width: 500px;
    text-align: center;
    line-height: 1.5;
    z-index: 85;
    display: flex; align-items: flex-start; gap: 10px;
  }
  #specialEventToast .set-text { flex: 1; }
  #specialEventToast .set-close {
    background: none; border: none; color: #c4b5fd; font-size: 16px;
    cursor: pointer; padding: 0; line-height: 1; flex-shrink: 0;
  }
  #specialEventToast .set-close:hover { color: #fff; }
  #paymentToast {
    position: absolute; bottom: 185px; right: 16px;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: bold;
    color: #fff;
    max-width: 280px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 65;
    line-height: 1.4;
  }
  #paymentToast.visible { opacity: 1; }
  #paymentToast.paying { background: rgba(153,27,27,0.92); border: 1px solid #ef4444; }
  #paymentToast.receiving { background: rgba(20,83,45,0.92); border: 1px solid #22c55e; }
  #roomLinkRow { margin-top: 10px; display: flex; gap: 6px; align-items: center; }
  #roomLinkRow input { flex:1; font-size:12px; color:#aaa; background:#111; border:1px solid #444; border-radius:4px; padding:4px 8px; }
  #figurePicker { margin-top: 12px; }
  #figurePicker .fp-title { font-size: 12px; color: #aaa; margin-bottom: 6px; }
  .fp-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
  .fp-swatch {
    width: 28px; height: 28px; border-radius: 5px; border: 2px solid transparent;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: #fff; font-weight: bold;
  }
  .fp-swatch.selected { border-color: #facc15; }
  .fp-swatch.taken { opacity: 0.35; cursor: default; }
  .fp-swatch:hover:not(.taken) { border-color: rgba(255,255,255,0.5); }
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
  private board3d: Board3D;
  private currentView: 'standard' | 'top' = 'standard';
  private currentRoom: { name: string; boardId: string } | null = null;

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
  private ransomBtn!: HTMLButtonElement;
  private endTurnBtn!: HTMLButtonElement;
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
  private actionCardPopup!: HTMLDivElement;
  private actionCardTimer: ReturnType<typeof setTimeout> | null = null;
  private buyOfferPanel!: HTMLDivElement;
  private specialEventBanner!: HTMLDivElement;
  private gameHeader!: HTMLDivElement;
  private headerTurnStatus!: HTMLDivElement;
  private headerRound!: HTMLDivElement;
  private headerEvent!: HTMLDivElement;
  private headerViewBtn!: HTMLButtonElement;
  private turnToast!: HTMLDivElement;
  private turnToastTimer: ReturnType<typeof setTimeout> | null = null;
  private lastState: GameState | null = null;
  private deedCardPopup!: HTMLDivElement;
  private helpOverlay!: HTMLDivElement;
  private settingsOverlay!: HTMLDivElement;
  private specialEventToast!: HTMLDivElement;
  private specialEventToastTimer: ReturnType<typeof setTimeout> | null = null;
  private myColor: string = "red";
  private myFigureIndex: number = 0;
  // Payment toast (feature #4)
  private paymentToast!: HTMLDivElement;
  private paymentToastTimer: ReturnType<typeof setTimeout> | null = null;
  // Mute button ref (feature #1)
  private muteBtn!: HTMLButtonElement;
  // Current room id for share link (feature #6)
  private currentRoomId: string | null = null;

  constructor(root: HTMLDivElement, net: Net, board3d: Board3D) {
    this.root = root;
    this.net = net;
    this.board3d = board3d;
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
    this.buildActionCardPopup();
    this.buildBuyOfferPanel();
    this.buildDeedCardPopup();
    this.buildSpecialEventToast();
    this.buildPaymentToast();
    this.setupKeyboardShortcuts();
    this.checkRoomFromUrl();
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
      <div id="roomLinkRow">
        <input id="roomLinkInput" type="text" readonly placeholder="Raum-Link…" />
        <button id="roomLinkCopyBtn" style="flex-shrink:0;white-space:nowrap;">Link kopieren</button>
      </div>
      <div id="figurePicker"></div>
      <button id="startGame" style="width:100%;margin-top:8px;">Start Game</button>
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

    // Room link copy button (feature #6)
    const copyBtn = document.getElementById("roomLinkCopyBtn") as HTMLButtonElement;
    copyBtn.addEventListener("click", () => {
      const input = document.getElementById("roomLinkInput") as HTMLInputElement;
      if (input.value) {
        navigator.clipboard.writeText(input.value).then(() => {
          copyBtn.textContent = "Kopiert!";
          setTimeout(() => { copyBtn.textContent = "Link kopieren"; }, 2000);
        }).catch(() => {
          input.select();
        });
      }
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
      <button id="ransomBtn">Freikaufen</button>
      <button id="endTurnBtn" style="background:#16a34a;font-size:15px;font-weight:bold;padding:10px 20px;display:none;">✓ Zug beenden</button>
    `;
    hud.appendChild(actionPanel);

    this.rollBtn = document.getElementById("rollBtn") as HTMLButtonElement;
    this.ransomBtn = document.getElementById("ransomBtn") as HTMLButtonElement;
    this.endTurnBtn = document.getElementById("endTurnBtn") as HTMLButtonElement;

    // Hide action buttons initially
    hide(this.rollBtn);
    hide(this.ransomBtn);
    hide(this.endTurnBtn);

    this.rollBtn.addEventListener("click", () => {
      // Hide immediately so it cannot be double-clicked; re-enabled when
      // it's genuinely the player's next roll (set in updateGame).
      hide(this.rollBtn);
      this.rollBtn.disabled = true;
      this.net.send({ t: "command", command: { type: "ROLL_DICE" } });
    });
    this.ransomBtn.addEventListener("click", () =>
      this.net.send({ t: "command", command: { type: "PAY_RANSOM" } })
    );
    this.endTurnBtn.addEventListener("click", () => {
      hide(this.endTurnBtn);
      this.endTurnBtn.disabled = true;
      this.net.send({ t: "command", command: { type: "END_TURN" } });
    });

    // Spectator banner
    const spectatorBanner = document.createElement("div");
    spectatorBanner.id = "spectatorBanner";
    spectatorBanner.textContent = "Du bist Zuschauer";
    hide(spectatorBanner);
    this.root.appendChild(spectatorBanner);
    this.spectatorBanner = spectatorBanner;

    // Special event banner
    const eventBanner = document.createElement('div');
    eventBanner.id = 'specialEventBanner';
    hide(eventBanner);
    hud.appendChild(eventBanner);
    this.specialEventBanner = eventBanner;

    this.buildGameHeader();
    this.buildTurnToast();
  }

  private buildGameHeader() {
    const hdr = document.createElement("div");
    hdr.id = "gameHeader";

    // Left: room name + board name
    const left = document.createElement("div");
    left.id = "headerLeft";
    left.innerHTML = `
      <div class="room-label" id="headerRoomLabel">LasPoly</div>
      <div class="board-label" id="headerBoardLabel">—</div>
    `;
    hdr.appendChild(left);

    // Center: turn status + round + event
    const center = document.createElement("div");
    center.id = "headerCenter";
    center.innerHTML = `
      <div id="headerTurnStatus"></div>
      <div id="headerRound"></div>
      <div id="headerEvent"></div>
    `;
    hdr.appendChild(center);
    this.headerTurnStatus = center.querySelector("#headerTurnStatus") as HTMLDivElement;
    this.headerRound = center.querySelector("#headerRound") as HTMLDivElement;
    this.headerEvent = center.querySelector("#headerEvent") as HTMLDivElement;

    // Right: view toggle, settings, help, leave, version
    const right = document.createElement("div");
    right.id = "headerRight";

    const viewBtn = document.createElement("button");
    viewBtn.className = "hdr-btn";
    viewBtn.id = "headerViewBtn";
    viewBtn.textContent = "🗺 Standard-Ansicht";
    viewBtn.addEventListener("click", () => {
      if (this.currentView === "standard") {
        this.currentView = "top";
        viewBtn.textContent = "🗺 Vogel-Ansicht";
        this.board3d.setView("top");
      } else {
        this.currentView = "standard";
        viewBtn.textContent = "🗺 Standard-Ansicht";
        this.board3d.setView("standard");
      }
    });
    this.headerViewBtn = viewBtn;
    right.appendChild(viewBtn);

    // Mute toggle button (feature #1)
    const muteBtn = document.createElement("button");
    muteBtn.className = "hdr-btn";
    muteBtn.id = "muteBtn";
    muteBtn.title = "Ton an/aus (S)";
    muteBtn.textContent = audio.isMuted ? "🔇" : "🔊";
    muteBtn.addEventListener("click", () => {
      const nowMuted = audio.toggleMute();
      muteBtn.textContent = nowMuted ? "🔇" : "🔊";
    });
    right.appendChild(muteBtn);
    this.muteBtn = muteBtn;

    const settingsBtn = document.createElement("button");
    settingsBtn.className = "hdr-btn";
    settingsBtn.textContent = "⚙";
    settingsBtn.title = "Einstellungen";
    settingsBtn.addEventListener("click", () => {
      const visible = this.settingsOverlay.style.display !== "none";
      if (visible) hide(this.settingsOverlay);
      else show(this.settingsOverlay, "block");
      hide(this.helpOverlay);
    });
    right.appendChild(settingsBtn);

    const helpBtn = document.createElement("button");
    helpBtn.className = "hdr-btn";
    helpBtn.textContent = "?";
    helpBtn.title = "Hilfe";
    helpBtn.addEventListener("click", () => {
      const visible = this.helpOverlay.style.display !== "none";
      if (visible) hide(this.helpOverlay);
      else show(this.helpOverlay, "block");
      hide(this.settingsOverlay);
    });
    right.appendChild(helpBtn);

    const leaveBtn = document.createElement("button");
    leaveBtn.className = "hdr-btn";
    leaveBtn.textContent = "✕ Verlassen";
    leaveBtn.style.background = "rgba(153,27,27,0.6)";
    leaveBtn.addEventListener("click", () => {
      clearSession();
      this.net.send({ t: "leaveRoom" });
      this.showLobbyPanel();
    });
    right.appendChild(leaveBtn);

    const ver = document.createElement("span");
    ver.id = "headerVersion";
    ver.textContent = `v${VERSION}`;
    right.appendChild(ver);

    hdr.appendChild(right);
    this.gameHud.appendChild(hdr);
    this.gameHeader = hdr;

    // Help overlay (non-modal, toggled)
    const help = document.createElement("div");
    help.id = "helpOverlay";
    help.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;color:#f97316;font-size:14px;">Spielregeln &amp; Steuerung</h3>
        <button id="helpCloseBtn" style="background:none;border:none;color:#aaa;font-size:20px;cursor:pointer;padding:0;line-height:1;">×</button>
      </div>
      <ul style="margin:0;padding-left:18px;">
        <li><strong>Würfeln:</strong> Klick auf „Würfeln"</li>
        <li><strong>Kaufen:</strong> Kaufangebot erscheint rechts – „Kaufen" oder „Ablehnen"</li>
        <li><strong>Bauen:</strong> Dein Grundstück → Haus/Hotel/Fabrik-Taste</li>
        <li><strong>Tauschen:</strong> „Tauschen" in der Grundstücksliste</li>
        <li><strong>Reisen:</strong> Von einem Bahnhof aus „Reisen nach…"</li>
        <li><strong>Ansicht:</strong> Schaltfläche oben rechts wechselt zwischen Schräg- und Vogelperspektive</li>
        <li><strong>Chat:</strong> Eingabefeld unten links</li>
        <li><strong>Grundstück:</strong> Klick auf ein Feld zeigt Grundbuchdaten</li>
      </ul>
    `;
    hide(help);
    this.gameHud.appendChild(help);
    this.helpOverlay = help;
    help.querySelector("#helpCloseBtn")!.addEventListener("click", () => hide(help));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hide(this.helpOverlay);
        hide(this.settingsOverlay);
      }
    });

    // Settings overlay (non-modal, toggled)
    const settings = document.createElement("div");
    settings.id = "settingsOverlay";
    settings.innerHTML = `
      <div style="font-size:13px;color:#facc15;font-weight:bold;margin-bottom:8px;">Einstellungen</div>
      <label>Sprache / Locale</label>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <button id="localeDEBtn" class="hdr-btn" style="font-size:12px;background:rgba(255,255,255,0.25);">🇩🇪 DE</button>
        <button id="localeENBtn" class="hdr-btn" style="font-size:12px;">🇬🇧 EN</button>
      </div>
      <div style="margin-top:8px;font-size:11px;color:#888;">Hinweis: Lokale Anzeigesprache – Spielereignisse kommen vom Server.</div>
    `;
    hide(settings);
    this.gameHud.appendChild(settings);
    this.settingsOverlay = settings;

    // Wire locale buttons — send setLocale to server + persist
    const LOCALE_KEY = "laspoly_locale";
    const applyLocale = (locale: "de" | "en") => {
      localStorage.setItem(LOCALE_KEY, locale);
      this.net.send({ t: "setLocale", locale });
      (settings.querySelector("#localeDEBtn") as HTMLElement).style.background =
        locale === "de" ? "rgba(255,255,255,0.35)" : "";
      (settings.querySelector("#localeENBtn") as HTMLElement).style.background =
        locale === "en" ? "rgba(255,255,255,0.35)" : "";
    };
    const savedLocale = (localStorage.getItem(LOCALE_KEY) ?? "de") as "de" | "en";
    // Defer applyLocale to after WS is open (constructor runs before connection)
    setTimeout(() => applyLocale(savedLocale), 0);
    settings.querySelector("#localeDEBtn")!.addEventListener("click", () => applyLocale("de"));
    settings.querySelector("#localeENBtn")!.addEventListener("click", () => applyLocale("en"));
  }

  private buildTurnToast() {
    const toast = document.createElement("div");
    toast.id = "turnToast";
    this.gameHud.appendChild(toast);
    this.turnToast = toast;
  }

  private showToast(text: string) {
    this.turnToast.textContent = text;
    this.turnToast.classList.add("visible");
    if (this.turnToastTimer) clearTimeout(this.turnToastTimer);
    this.turnToastTimer = setTimeout(() => {
      this.turnToast.classList.remove("visible");
      this.turnToastTimer = null;
    }, 3000);
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
      this.showLobbyPanel();
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

  private buildActionCardPopup() {
    const popup = document.createElement("div");
    popup.id = "actionCardPopup";
    popup.innerHTML = `
      <div class="ac-header">🃏 Aktionskarte</div>
      <div class="ac-body" id="actionCardText"></div>
      <div class="ac-footer">
        <button id="actionCardConfirmBtn" style="background:#f97316;">Bestätigen</button>
      </div>
    `;
    hide(popup);
    this.root.appendChild(popup);
    this.actionCardPopup = popup;

    const confirmBtn = document.getElementById("actionCardConfirmBtn") as HTMLButtonElement;
    confirmBtn.addEventListener("click", () => this.dismissActionCard());
  }

  showActionCard(text: string) {
    const textEl = document.getElementById("actionCardText");
    if (textEl) textEl.textContent = text;
    show(this.actionCardPopup, "block");
    // No auto-dismiss: the local player must click Confirm (✓) to dismiss.
    // Any pre-existing timer (from a prior card) is cancelled.
    if (this.actionCardTimer) { clearTimeout(this.actionCardTimer); this.actionCardTimer = null; }
  }

  private dismissActionCard() {
    hide(this.actionCardPopup);
    if (this.actionCardTimer) { clearTimeout(this.actionCardTimer); this.actionCardTimer = null; }
  }

  private buildBuyOfferPanel() {
    const panel = document.createElement("div");
    panel.id = "buyOfferPanel";
    panel.innerHTML = `
      <div class="buy-header">Kaufangebot</div>
      <div class="buy-body">
        <div class="buy-detail buy-tile-name" id="buyTileName" style="font-weight:bold;color:#facc15;margin-bottom:6px;font-size:13px;">—</div>
        <div class="buy-detail" id="buyPrice">Preis: —</div>
        <div class="buy-detail" id="buyBalance">Dein Kapital: —</div>
        <div class="buy-btns">
          <button id="buyOfferBuyBtn" style="background:#16a34a;flex:1;">Kaufen</button>
          <button id="buyOfferDeclineBtn" style="background:#991b1b;flex:1;">Ablehnen</button>
        </div>
      </div>
    `;
    hide(panel);
    this.gameHud.appendChild(panel);
    this.buyOfferPanel = panel;

    (document.getElementById("buyOfferBuyBtn") as HTMLButtonElement).addEventListener("click", () =>
      this.net.send({ t: "command", command: { type: "BUY_PROPERTY" } })
    );
    (document.getElementById("buyOfferDeclineBtn") as HTMLButtonElement).addEventListener("click", () =>
      this.net.send({ t: "command", command: { type: "DECLINE_PROPERTY" } })
    );
  }

  private buildDeedCardPopup() {
    const el = document.createElement("div");
    el.id = "deedCardPopup";
    hide(el);
    this.root.appendChild(el);
    this.deedCardPopup = el;
  }

  showDeedCard(pos: number) {
    const state = this.lastState;
    const panel = this.deedCardPopup;
    panel.innerHTML = "";

    if (!state) { hide(panel); return; }

    const board = getBoard(state.boardId);
    const tile = board.tiles[pos];
    if (!tile) { hide(panel); return; }

    // Colour bar
    const group = (tile as { group?: string }).group;
    const barColor = group ? this.groupCssColor(group) : "#444";
    const bar = document.createElement("div");
    bar.className = "dc-color-bar";
    bar.style.background = barColor;
    panel.appendChild(bar);

    // Header row: name + close
    const hdr = document.createElement("div");
    hdr.className = "dc-header";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = tile.name;
    const closeBtn = document.createElement("button");
    closeBtn.className = "dc-close";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => hide(panel));
    hdr.appendChild(nameSpan);
    hdr.appendChild(closeBtn);
    panel.appendChild(hdr);

    // Body
    const body = document.createElement("div");
    body.className = "dc-body";

    const row = (label: string, value: string) => {
      const r = document.createElement("div");
      r.className = "dc-row";
      r.innerHTML = `<span class="dc-label">${label}</span><span class="dc-value">${value}</span>`;
      body.appendChild(r);
    };

    if (tile.type === "street") {
      const st = tile as StreetTile;
      row("Preis", `${st.price} LPD`);
      row("Hypothek", `${st.mortgage} LPD`);
      row("Grundmiete", `${st.rent[0]} LPD`);
      row("1 Haus", `${st.rent[1]} LPD`);
      row("2 Häuser", `${st.rent[2]} LPD`);
      row("3 Häuser", `${st.rent[3]} LPD`);
      row("4 Häuser", `${st.rent[4]} LPD`);
      row("Hotel", `${st.rent[5]} LPD`);
      row("Fabrik", `${st.factoryRevenue} LPD`);
      row("Hauskosten", `${st.houseCost} LPD`);
      row("Hotelkosten", `${st.hotelCost} LPD`);
      row("Fabrikkosten", `${st.factoryCost} LPD`);
    } else if (tile.type === "station") {
      const r = board.rules.station;
      row("Preis", `${r.price} LPD`);
      row("Hypothek", `${r.mortgage} LPD`);
      row("Miete (1 Bhf)", `${r.rent[0] ?? 0} LPD`);
      row("Miete (2 Bhf)", `${r.rent[1] ?? 0} LPD`);
      row("Miete (3 Bhf)", `${r.rent[2] ?? 0} LPD`);
      row("Miete (4 Bhf)", `${r.rent[3] ?? 0} LPD`);
    } else if (tile.type === "attraction") {
      const a = board.rules.attraction;
      row("Preis", `${a.price} LPD`);
      row("Hypothek", `${a.mortgage} LPD`);
      row("Miete (1 Attr.)", `Würfel × ${a.factorOne}`);
      row("Miete (2 Attr.)", `Würfel × ${a.factorBoth}`);
    }

    // Owner + buildings
    const ownerId = state.ownership[pos];
    if (ownerId) {
      const owner = state.players.find(p => p.id === ownerId);
      const ownerDiv = document.createElement("div");
      ownerDiv.className = "dc-owner";
      ownerDiv.textContent = `Eigentümer: ${owner?.name ?? "?"}`;
      body.appendChild(ownerDiv);

      const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
      let buildStr = "";
      if (b.hotel) buildStr = "Hotel";
      else if (b.factory) buildStr = "Fabrik";
      else if (b.houses > 0) buildStr = `${b.houses} Haus${b.houses > 1 ? "häuser" : ""}`;
      if (buildStr) {
        const bDiv = document.createElement("div");
        bDiv.className = "dc-status";
        bDiv.textContent = `Gebäude: ${buildStr}`;
        body.appendChild(bDiv);
      }

      if (state.mortgaged[pos]) {
        const mDiv = document.createElement("div");
        mDiv.className = "dc-status";
        mDiv.textContent = "Hypothek aktiv";
        body.appendChild(mDiv);
      }
    } else {
      const unownedDiv = document.createElement("div");
      unownedDiv.className = "dc-owner";
      unownedDiv.textContent = "Nicht im Besitz";
      body.appendChild(unownedDiv);
    }

    panel.appendChild(body);
    show(panel, "block");
  }

  private buildSpecialEventToast() {
    const el = document.createElement("div");
    el.id = "specialEventToast";
    el.innerHTML = `<span class="set-text"></span><button class="set-close">×</button>`;
    hide(el);
    this.root.appendChild(el);
    this.specialEventToast = el;
    el.querySelector(".set-close")!.addEventListener("click", () => {
      hide(el);
      if (this.specialEventToastTimer) { clearTimeout(this.specialEventToastTimer); this.specialEventToastTimer = null; }
    });
  }

  showSpecialEventToast(text: string) {
    const el = this.specialEventToast;
    const textEl = el.querySelector(".set-text");
    if (textEl) textEl.textContent = text;
    show(el, "flex");
    if (this.specialEventToastTimer) clearTimeout(this.specialEventToastTimer);
    this.specialEventToastTimer = setTimeout(() => {
      hide(el);
      this.specialEventToastTimer = null;
    }, 6000);
  }

  // -------------------------------------------------------------------------
  // Feature #4: Payment toast
  // -------------------------------------------------------------------------
  private buildPaymentToast() {
    const el = document.createElement("div");
    el.id = "paymentToast";
    hide(el);
    this.gameHud.appendChild(el);
    this.paymentToast = el;
  }

  showPaymentToast(text: string, type: "paying" | "receiving") {
    const el = this.paymentToast;
    el.textContent = type === "paying" ? `↑ ${text}` : `↓ ${text}`;
    el.className = `visible ${type}`;
    el.style.display = "block";
    if (this.paymentToastTimer) clearTimeout(this.paymentToastTimer);
    this.paymentToastTimer = setTimeout(() => {
      el.classList.remove("visible");
      this.paymentToastTimer = null;
    }, 3500);
  }

  // -------------------------------------------------------------------------
  // Feature #2: Keyboard shortcuts
  // -------------------------------------------------------------------------
  private setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      const targetEl = e.target as HTMLElement | null;
      const tag = targetEl?.tagName?.toLowerCase() ?? "";
      const isTyping = tag === "input" || tag === "textarea" || tag === "select";

      // Escape: close topmost open overlay
      if (e.key === "Escape") {
        if (this.deedCardPopup.style.display !== "none") { hide(this.deedCardPopup); return; }
        if (this.helpOverlay.style.display !== "none") { hide(this.helpOverlay); return; }
        if (this.settingsOverlay.style.display !== "none") { hide(this.settingsOverlay); return; }
        if (this.actionCardPopup.style.display !== "none") { this.dismissActionCard(); return; }
        return;
      }

      if (isTyping) return;

      // Space: roll dice (when roll button visible/enabled)
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (this.rollBtn && this.rollBtn.style.display !== "none" && !this.rollBtn.disabled) {
          this.rollBtn.click();
        }
        return;
      }

      // Enter: confirm primary action (buy offer)
      if (e.key === "Enter") {
        if (this.buyOfferPanel.style.display !== "none") {
          const buyBtn = document.getElementById("buyOfferBuyBtn") as HTMLButtonElement | null;
          if (buyBtn && !buyBtn.disabled) { buyBtn.click(); return; }
        }
        if (this.actionCardPopup.style.display !== "none") {
          const confirmBtn = document.getElementById("actionCardConfirmBtn") as HTMLButtonElement | null;
          if (confirmBtn) { confirmBtn.click(); return; }
        }
        return;
      }

      // S: toggle mute
      if (e.key === "s" || e.key === "S") {
        if (this.muteBtn) this.muteBtn.click();
        return;
      }
    });
  }

  // -------------------------------------------------------------------------
  // Feature #6: Auto-join from URL ?room=<id>
  // -------------------------------------------------------------------------
  private checkRoomFromUrl() {
    const params = new URLSearchParams(location.search);
    const roomId = params.get("room");
    if (!roomId) return;
    // Defer until WebSocket is connected
    const tryJoin = () => {
      const nickname = (document.getElementById("nickname") as HTMLInputElement | null)?.value.trim() || "Player";
      this.net.send({ t: "joinRoom", roomId, nickname });
    };
    setTimeout(tryJoin, 800);
  }

  private buildFigurePicker(container: HTMLElement, room: RoomView) {
    container.innerHTML = "";
    const title = document.createElement("div");
    title.className = "fp-title";
    title.textContent = "Farbe & Figur wählen:";
    container.appendChild(title);

    const takenMap = new Map<string, string>();
    for (const p of room.players) {
      if (p.id !== this.net.playerId && p.color !== undefined && p.figureIndex !== undefined) {
        takenMap.set(`${p.color}:${p.figureIndex}`, p.nickname);
      }
    }

    const colorHex: Record<string, string> = {
      red: "#ef4444", blue: "#3b82f6", green: "#22c55e",
      yellow: "#eab308", purple: "#a855f7", orange: "#f97316",
    };

    for (const color of FIGURE_COLORS) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:6px;margin-bottom:4px;";
      const dot = document.createElement("span");
      dot.style.cssText = `display:inline-block;width:12px;height:12px;border-radius:50%;background:${colorHex[color] ?? color};flex-shrink:0;`;
      row.appendChild(dot);

      const grid = document.createElement("div");
      grid.className = "fp-grid";
      for (let fi = 0; fi < FIGURE_COUNT; fi++) {
        const key = `${color}:${fi}`;
        const isTaken = takenMap.has(key);
        const isSelected = this.myColor === color && this.myFigureIndex === fi;
        const sw = document.createElement("div");
        sw.className = "fp-swatch" + (isSelected ? " selected" : "") + (isTaken ? " taken" : "");
        sw.style.background = colorHex[color] ?? color;
        sw.textContent = String(fi + 1);
        sw.title = isTaken ? `${takenMap.get(key)} hat das` : `${color} #${fi + 1}`;
        if (!isTaken) {
          sw.addEventListener("click", () => {
            this.myColor = color;
            this.myFigureIndex = fi;
            this.net.send({ t: "chooseFigure", color, figureIndex: fi });
            this.buildFigurePicker(container, room);
          });
        }
        grid.appendChild(sw);
      }
      row.appendChild(grid);
      container.appendChild(row);
    }

    const others = room.players.filter(p => p.id !== this.net.playerId && !p.isBot && p.color !== undefined);
    if (others.length > 0) {
      const othDiv = document.createElement("div");
      othDiv.style.cssText = "font-size:11px;color:#888;margin-top:4px;";
      othDiv.textContent = others.map(p => `${p.nickname}: ${p.color ?? "?"} #${(p.figureIndex ?? 0) + 1}`).join(", ");
      container.appendChild(othDiv);
    }
  }

  private renderChipStack(money: number): string {
    const denoms = [100, 10, 1];
    const imgs = ["/assets/laspolydollar100.png", "/assets/laspolydollar10.png", "/assets/laspolydollar1.png"];
    const MAX_ICONS = 5;
    let parts: string[] = [];
    let remaining = money;
    for (let i = 0; i < denoms.length; i++) {
      const d = denoms[i]!;
      const img = imgs[i]!;
      const count = Math.floor(remaining / d);
      remaining -= count * d;
      if (count <= 0) continue;
      const show = Math.min(count, MAX_ICONS);
      let icons = "";
      for (let j = 0; j < show; j++) {
        icons += `<img class="chip-img" src="${img}" alt="${d}LPD" />`;
      }
      if (count > MAX_ICONS) icons += `<span class="chip-count">×${count}</span>`;
      parts.push(icons);
    }
    if (parts.length === 0) parts = [`<span class="chip-count">0</span>`];
    return `<div class="chip-stack">${parts.join("")}</div>`;
  }

  private renderDeedStrip(state: GameState, playerId: string): string {
    const board = getBoard(state.boardId);
    const ownedPositions = Object.entries(state.ownership)
      .filter(([, ownerId]) => ownerId === playerId)
      .map(([pos]) => Number(pos))
      .sort((a, b) => a - b);
    if (ownedPositions.length === 0) return "";
    const MAX_SHOW = 20;
    const show = ownedPositions.slice(0, MAX_SHOW);
    const extra = ownedPositions.length - show.length;
    let chips = show.map((pos) => {
      const tile = board.tiles[pos];
      const group = (tile as { group?: string }).group ?? "station";
      const color = this.groupCssColor(group);
      const name = tile?.name ?? `Pos ${pos}`;
      return `<span class="deed-chip" style="background:${color};" title="${name}"></span>`;
    }).join("");
    if (extra > 0) chips += `<span class="deed-more">+${extra}</span>`;
    return `<div class="deed-strip">${chips}</div>`;
  }

  private sendChat() {
    const text = this.chatInput.value.trim();
    if (text) {
      this.net.send({ t: "chat", text });
      this.chatInput.value = "";
    }
  }

  appendEventLine(text: string) {
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
    if (this.helpOverlay) hide(this.helpOverlay);
    if (this.settingsOverlay) hide(this.settingsOverlay);
    if (this.deedCardPopup) hide(this.deedCardPopup);
    if (this.specialEventToast) hide(this.specialEventToast);
    this.lastState = null;
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

  onJoined(roomId: string, _playerId: string) {
    this.currentRoomId = roomId;
    hide(this.lobby);
    show(this.roomPanel);
    this.roomInfo.textContent = "Warte auf Spielstart...";
    hide(this.startGameBtn);
    // Update room link (feature #6)
    this.updateRoomLink(roomId);
  }

  private updateRoomLink(roomId: string) {
    const input = document.getElementById("roomLinkInput") as HTMLInputElement | null;
    if (input) {
      input.value = `${location.origin}/?room=${roomId}`;
    }
  }

  showRoom(room: RoomView) {
    this.currentHostId = room.host;
    this.currentRoom = { name: room.name, boardId: room.boardId };
    if (this.currentRoomId) this.updateRoomLink(this.currentRoomId);
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

    // Figure/colour picker
    const pickerContainer = document.getElementById("figurePicker");
    if (pickerContainer) this.buildFigurePicker(pickerContainer, room);
  }

  updateGame(state: GameState, events: FormattedEvent[], myId: string | null) {
    this.lastState = state;
    hide(this.lobby);
    hide(this.roomPanel);
    show(this.gameHud, "block");

    const currentPlayer = state.players[state.currentPlayerIndex];
    const isMyTurn = myId !== null && currentPlayer?.id === myId;
    const me = myId ? state.players.find(p => p.id === myId) : null;
    const amAlive = me?.alive ?? false;

    // Update header bar
    if (this.gameHeader) {
      const roomLabel = document.getElementById("headerRoomLabel");
      const boardLabel = document.getElementById("headerBoardLabel");
      if (roomLabel && this.currentRoom) roomLabel.textContent = this.currentRoom.name;
      if (boardLabel) boardLabel.textContent = state.boardId;

      const turnText = isMyTurn && amAlive
        ? (state.phase === "turn-end" ? "Zug beenden" : "Du bist am Zug")
        : `${currentPlayer?.name ?? "?"} ist am Zug`;
      this.headerTurnStatus.textContent = turnText;
      this.headerRound.textContent = `Runde ${state.round}`;

      // Special event label in header
      if (state.activeEvent) {
        const eventLabels: Record<string, string> = {
          circus: '🎪 Zirkus in der Stadt',
          boom: '📈 Wirtschaftsboom',
          recession: '📉 Rezession',
          jackpot: '🎰 Casino-Jackpot-Nacht',
          buildingSale: '🏗️ Bau-Rabatt',
          quietDay: '😴 Ruhiger Tag',
        };
        this.headerEvent.textContent = eventLabels[state.activeEvent.id] ?? state.activeEvent.id;
      } else {
        this.headerEvent.textContent = '';
      }
    }

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
      row.innerHTML = `${dot}<strong>${p.name}</strong>${p.isBot ? " (Bot)" : ""}${jail}${rollStr}${this.renderChipStack(p.money)}${this.renderDeedStrip(state, p.id)}<span style="color:#aaa;font-size:11px;">LPD ${p.money} | Pos ${p.position}</span>`;
      this.playerList.appendChild(row);
    }

    // Append new events to log
    for (const ev of events) {
      this.appendEventLine(ev.text);
    }

    // Feature #4: Payment toast
    if (myId) {
      for (const ev of events) {
        if (ev.key === "rentPaid" && ev.playerId === myId) {
          this.showPaymentToast(ev.text, "paying");
          break;
        }
        if (ev.key === "factoryRevenue" && ev.playerId === myId) {
          this.showPaymentToast(ev.text, "receiving");
          break;
        }
      }
    }

    // Emit a local "ist an der Reihe" notification when our turn begins
    if (isMyTurn && !this.wasMyTurn && amAlive) {
      const name = me?.name ?? this.myName ?? "Du";
      this.appendEventLine(`${name} ist an der Reihe.`);
      this.showToast("Du bist am Zug");
    } else if (!isMyTurn && this.wasMyTurn) {
      // Our turn just ended — show whose turn it is now
      if (currentPlayer) {
        this.showToast(`${currentPlayer.name} ist am Zug`);
      }
    }
    this.wasMyTurn = isMyTurn && amAlive;

    // Show/hide action buttons
    const showRoll = isMyTurn && amAlive && state.phase === "awaiting-roll";
    const showBuy = isMyTurn && amAlive && state.phase === "awaiting-buy";
    const showRansom = isMyTurn && amAlive && state.phase === "awaiting-roll" && (me?.inJail ?? false);
    const showEndTurn = isMyTurn && amAlive && state.phase === "turn-end";

    if (showRoll) { show(this.rollBtn, "inline-block"); this.rollBtn.disabled = false; }
    else { hide(this.rollBtn); this.rollBtn.disabled = true; }

    if (showRansom) { show(this.ransomBtn, "inline-block"); this.ransomBtn.disabled = false; }
    else { hide(this.ransomBtn); this.ransomBtn.disabled = true; }

    if (showEndTurn) { show(this.endTurnBtn, "inline-block"); this.endTurnBtn.disabled = false; }
    else { hide(this.endTurnBtn); this.endTurnBtn.disabled = true; }

    // Buy offer panel (tile name / price / balance)
    if (showBuy && myId && state.pendingPurchase !== null) {
      const board = getBoard(state.boardId);
      const tile = board.tiles[state.pendingPurchase];
      const price = tile ? tilePrice(board, tile) : 0;
      const tileNameEl = document.getElementById("buyTileName");
      const priceEl = document.getElementById("buyPrice");
      const balanceEl = document.getElementById("buyBalance");
      if (tileNameEl) tileNameEl.textContent = tile?.name ?? "—";
      if (priceEl) priceEl.textContent = `Preis: ${price} LPD`;
      if (balanceEl) balanceEl.textContent = `Dein Kapital: ${me?.money ?? 0} LPD`;
      show(this.buyOfferPanel, "block");
    } else {
      hide(this.buyOfferPanel);
    }

    // Spectator banner
    if (myId && !amAlive && state.phase !== "finished") {
      show(this.spectatorBanner, "block");
    } else {
      hide(this.spectatorBanner);
    }

    // Special event banner (replaced by header center display)
    hide(this.specialEventBanner);

    // Incoming swap panel (visible regardless of whose turn it is)
    if (myId) {
      this.refreshIncomingSwapPanel(state, myId);
    } else {
      hide(this.incomingSwapPanel);
    }

    // My-properties panel + travel (during awaiting-roll OR turn-end, not in jail)
    const showMgmt = isMyTurn && amAlive && (state.phase === "awaiting-roll" || state.phase === "turn-end") && !(me?.inJail ?? false);
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

    const me = state.players.find(p => p.id === myId);
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
      row.style.cursor = "pointer";
      row.addEventListener("click", () => this.showDeedCard(pos));

      // Buttons
      const btnRow = document.createElement("div");
      btnRow.style.marginTop = "4px";
      const myMoney = me?.money ?? 0;

      // Feature #5: grey out buttons the player cannot afford
      const makeBtn = (label: string, cost: number | null, cls: string, onClick: () => void): HTMLButtonElement => {
        const btn = document.createElement("button");
        btn.className = cls;
        btn.textContent = label;
        const unaffordable = cost !== null && cost > myMoney;
        if (unaffordable) {
          btn.disabled = true;
          btn.style.opacity = "0.45";
          btn.title = `Benötigt ${cost} LPD (du hast ${myMoney} LPD)`;
        } else {
          btn.addEventListener("click", onClick);
        }
        return btn;
      };

      // BUILD buttons (only for streets with whole-group ownership)
      if (tile.type === "street") {
        const st = tile as StreetTile;
        if (canBuild(state, pos, "house")) {
          btnRow.appendChild(makeBtn(
            `Haus (${st.houseCost} LPD)`, st.houseCost, "prop-btn",
            () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "house" } })
          ));
        }
        if (canBuild(state, pos, "hotel")) {
          btnRow.appendChild(makeBtn(
            `Hotel (${st.hotelCost} LPD)`, st.hotelCost, "prop-btn",
            () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "hotel" } })
          ));
        }
        if (canBuild(state, pos, "factory")) {
          btnRow.appendChild(makeBtn(
            `Fabrik (${st.factoryCost} LPD)`, st.factoryCost, "prop-btn",
            () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "factory" } })
          ));
        }
        if (canSellBuilding(state, pos)) {
          btnRow.appendChild(makeBtn(
            "Gebäude verk.", null, "prop-btn danger",
            () => this.net.send({ t: "command", command: { type: "SELL_BUILDING", pos } })
          ));
        }
      }

      if (canMortgage(state, pos)) {
        const mv = mortgageValue(board, tile);
        btnRow.appendChild(makeBtn(
          `Hypothek (+${mv})`, null, "prop-btn",
          () => this.net.send({ t: "command", command: { type: "MORTGAGE", pos } })
        ));
      }
      if (canUnmortgage(state, pos)) {
        const mv = mortgageValue(board, tile);
        const cost = Math.floor(mv * board.rules.mortgageUnmortgageMultiplier);
        btnRow.appendChild(makeBtn(
          `Ablösen (-${cost})`, cost, "prop-btn",
          () => this.net.send({ t: "command", command: { type: "UNMORTGAGE", pos } })
        ));
      }
      if (canSellProperty(state, pos)) {
        const refund = Math.floor(tilePrice(board, tile) / 2);
        btnRow.appendChild(makeBtn(
          `Verkaufen (+${refund})`, null, "prop-btn danger",
          () => this.net.send({ t: "command", command: { type: "SELL_PROPERTY", pos } })
        ));
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
