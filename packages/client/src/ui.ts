import {
  VERSION,
  listBoards,
  getBoard,
  mortgageValue,
  tilePrice,
  canBuild,
  buildBlockReason,
  canSellBuilding,
  canMortgage,
  canUnmortgage,
  canSellProperty,
  ownedPropsOf,
  canTravelFrom,
  netWorth,
} from "@laspoly/shared";
import { FIGURE_COLORS, FIGURE_COUNT } from "@laspoly/shared";
import type { RoomSummary, RoomView, GameState, FormattedEvent, StreetTile, GameSettings } from "@laspoly/shared";
import type { Net } from "./net.js";
import type { Board3D } from "./board3d.js";
import { clearSession } from "./net.js";
import { audio } from "./audio.js";
import { FigurePreview } from "./figurePreview.js";
import { getTheme, setTheme, type Theme } from "./theme.js";
import { getQuality, setQuality, type Quality } from "./quality.js";

const css = `
  /* ── Neon-Vegas glass design system ─────────────────────────────── */
  :root {
    --bg-0: #0a0913;
    --glass: rgba(22, 19, 38, 0.72);
    --glass-strong: rgba(15, 13, 26, 0.9);
    --glass-light: rgba(255, 255, 255, 0.05);
    --hairline: rgba(255, 255, 255, 0.10);
    --hairline-soft: rgba(255, 255, 255, 0.06);
    --text: #f3f1fb;
    --text-dim: #a39fc0;
    --text-mute: #6f6b8a;
    --gold: #fbbf24;
    --gold-deep: #f59e0b;
    --violet: #7c3aed;
    --magenta: #d946ef;
    --success: #34d399;
    --success-deep: #059669;
    --danger: #f43f5e;
    --danger-deep: #9f1239;
    --info: #60a5fa;
    --muted: rgba(255, 255, 255, 0.08);
    --radius-lg: 16px;
    --radius: 12px;
    --radius-sm: 8px;
    --shadow: 0 10px 36px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.35);
    --shadow-pop: 0 16px 48px rgba(0, 0, 0, 0.6);
    --glow-gold: 0 0 20px rgba(251, 191, 36, 0.35);
    --glow-magenta: 0 0 22px rgba(217, 70, 239, 0.4);
    --top-hi: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    --blur: blur(16px) saturate(140%);
    --font: 'Segoe UI', system-ui, -apple-system, 'Inter', Roboto, sans-serif;
    --ease: 0.18s cubic-bezier(.4, 0, .2, 1);
  }
  .panel {
    background: var(--glass);
    backdrop-filter: var(--blur);
    -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--hairline);
    border-radius: var(--radius-lg);
    padding: 18px;
    color: var(--text);
    box-shadow: var(--shadow), var(--top-hi);
  }
  button {
    background: linear-gradient(135deg, var(--violet), var(--magenta));
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    padding: 9px 16px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.2px;
    margin: 4px 2px;
    font-family: var(--font);
    box-shadow: 0 2px 10px rgba(124, 58, 237, 0.3);
    transition: transform var(--ease), box-shadow var(--ease), filter var(--ease);
  }
  button:hover { transform: translateY(-1px); filter: brightness(1.07); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4), var(--glow-magenta); }
  button:active { transform: translateY(0); filter: brightness(0.97); }
  button:disabled { background: var(--muted); color: var(--text-mute); cursor: default; box-shadow: none; transform: none; filter: none; }
  input, select {
    background: rgba(10, 9, 18, 0.6);
    color: var(--text);
    border: 1px solid var(--hairline);
    border-radius: var(--radius-sm);
    padding: 9px 12px;
    font-size: 14px;
    margin: 4px 0;
    width: 100%;
    box-sizing: border-box; /* include padding in width:100% (fixes lobby h-scrollbar, bug 2-2) */
    font-family: var(--font);
    transition: border-color var(--ease), box-shadow var(--ease);
  }
  input:focus, select:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.18); }
  input::placeholder { color: var(--text-mute); }
  label { font-size: 13px; color: var(--text-dim); display: block; margin-top: 8px; }
  #lobby {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 360px;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    overflow-x: hidden; /* dialog content fits 360px; never show a h-scrollbar (bug) */
    box-sizing: border-box;
  }
  #roomPanel {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 360px;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    overflow-x: hidden; /* dialog content fits 360px; never show a h-scrollbar (bug) */
    box-sizing: border-box;
  }
  #roomList { margin-top: 12px; max-height: 200px; overflow-y: auto; }
  .room-item { padding: 10px 12px; border: 1px solid var(--hairline-soft); border-radius: var(--radius-sm); margin: 6px 0; cursor: pointer; background: var(--glass-light); transition: background var(--ease), border-color var(--ease), transform var(--ease); }
  .room-item:hover { background: rgba(255,255,255,0.08); border-color: var(--hairline); transform: translateX(2px); }
  #playerList {
    position: absolute; top: 80px; left: 16px;
    width: 220px;
    max-height: calc(60vh - 48px);
    overflow-y: auto;
  }
  .player-row { padding: 8px 10px; margin: 5px 0; border-radius: var(--radius-sm); border: 1px solid var(--hairline-soft); font-size: 13px; background: var(--glass-light); transition: background var(--ease), border-color var(--ease); }
  .player-row.current-player { border-color: var(--gold); background: rgba(251,204,21,0.12); box-shadow: var(--glow-gold); }
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
  @keyframes cardPopIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  #actionCardPopup {
    position: absolute; top: calc(50% + 24px); left: 50%; transform: translate(-50%, -50%);
    width: 320px;
    background: var(--glass-strong); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--hairline); border-radius: var(--radius-lg);
    box-shadow: var(--shadow-pop), var(--top-hi);
    overflow: hidden;
    z-index: 100;
    animation: cardPopIn 0.25s ease-out;
  }
  #actionCardPopup .ac-header {
    background: linear-gradient(135deg, var(--gold-deep), var(--gold)); color: #2a1c02; font-weight: 700; font-size: 15px;
    padding: 12px 16px;
    text-align: center;
  }
  #actionCardPopup .ac-body {
    padding: 16px; color: var(--text); font-size: 14px; line-height: 1.5;
    text-align: center;
  }
  #actionCardPopup .ac-footer {
    padding: 0 16px 14px; text-align: center;
  }
  #buyOfferPanel {
    position: absolute; bottom: 100px; right: 16px;
    width: 260px;
    background: var(--glass-strong); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--gold);
    border-radius: var(--radius); padding: 0;
    color: var(--text); overflow: hidden;
    box-shadow: var(--shadow), var(--glow-gold);
  }
  #buyOfferPanel .buy-header {
    background: linear-gradient(135deg, var(--gold), var(--gold-deep)); color: #2a1c02;
    font-weight: 700; font-size: 13px;
    padding: 9px 14px;
  }
  #buyOfferPanel .buy-body { padding: 12px 14px; }
  #buyOfferPanel h3 { color: var(--gold); margin: 0 0 6px; font-size: 14px; display: none; }
  #buyOfferPanel .buy-detail { font-size: 12px; color: var(--text-dim); margin: 3px 0; }
  #buyOfferPanel .buy-btns { display:flex; gap:8px; margin-top:10px; }
  #eventLogPanel {
    position: absolute; bottom: 16px; left: 16px;
    width: 300px;
  }
  #eventLog {
    height: 150px; overflow-y: auto;
    background: rgba(0,0,0,0.35);
    border: 1px solid var(--hairline-soft);
    border-radius: var(--radius-sm);
    padding: 8px;
    font-size: 12px;
    line-height: 1.5;
  }
  .event-line { margin: 2px 0; color: var(--text-dim); }
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
    background: radial-gradient(ellipse at center, rgba(40,20,60,0.7), rgba(0,0,0,0.85));
    backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
    align-items: center; justify-content: center;
    flex-direction: column; gap: 16px;
  }
  #gameOverBanner h1 { font-size: 2.75rem; color: var(--gold); text-shadow: var(--glow-gold), 0 2px 12px rgba(0,0,0,0.6); letter-spacing: 1px; }
  #spectatorBanner {
    position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
    background: rgba(159,18,57,0.55); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border: 1px solid rgba(244,63,94,0.4);
    padding: 8px 20px; border-radius: var(--radius-sm);
    font-size: 14px; box-shadow: var(--shadow);
  }
  #versionBadge {
    position: absolute; bottom: 4px; right: 8px;
    font-size: 11px; color: var(--text-mute);
  }
  #errorBanner {
    position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
    background: rgba(159,18,57,0.92); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border: 1px solid rgba(244,63,94,0.5);
    padding: 9px 20px; border-radius: var(--radius-sm);
    font-size: 13px; max-width: 400px; text-align: center; box-shadow: var(--shadow);
  }
  #specialEventBanner {
    position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
    background: rgba(20, 10, 40, 0.7); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--magenta);
    border-radius: var(--radius-sm);
    padding: 7px 18px;
    font-size: 13px;
    color: #f0d5ff;
    box-shadow: var(--glow-magenta);
    pointer-events: none;
    white-space: nowrap;
    max-width: 480px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  #myPropsPanel {
    position: absolute; top: 80px; right: 16px;
    width: 280px;
    max-height: calc(70vh - 48px);
    overflow-y: auto;
  }
  .prop-row { padding: 9px 10px; border: 1px solid var(--hairline-soft); border-radius: var(--radius-sm); margin: 5px 0; font-size: 12px; background: var(--glass-light); }
  .prop-row .prop-name { font-weight: 600; color: var(--text); }
  .prop-row .prop-detail { color: var(--text-dim); font-size: 11px; margin: 2px 0; }
  .prop-btn { font-size: 11px; padding: 4px 9px; margin: 2px 1px; }
  .prop-btn.danger { background: linear-gradient(135deg, var(--danger-deep), var(--danger)); box-shadow: 0 2px 8px rgba(244,63,94,0.25); }
  .prop-btn.danger:hover { box-shadow: 0 4px 14px rgba(244,63,94,0.4), 0 0 16px rgba(244,63,94,0.3); }
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
  .swap-section { margin: 8px 0; padding: 8px; background: var(--glass-light); border: 1px solid var(--hairline-soft); border-radius: var(--radius-sm); }
  .swap-label { font-size: 12px; color: var(--text-dim); margin-bottom: 4px; }
  .swap-check-row { display: flex; align-items: center; gap: 6px; margin: 3px 0; font-size: 12px; }
  #gameHeader {
    position: absolute; top: 0; left: 0; width: 100%; min-height: 48px;
    background: linear-gradient(180deg, rgba(18,16,34,0.92), rgba(12,10,24,0.82));
    backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border-bottom: 1px solid var(--hairline);
    box-shadow: 0 2px 18px rgba(0,0,0,0.45), inset 0 -2px 0 rgba(251,191,36,0.55);
    display: flex; align-items: center; justify-content: space-between;
    padding: 4px 12px;
    box-sizing: border-box;
    z-index: 50;
    pointer-events: none;
    font-family: var(--font);
  }
  #gameHeader > * { pointer-events: auto; }
  #headerLeft { display: flex; flex-direction: column; gap: 1px; min-width: 160px; }
  #headerLeft .room-label { font-size: 13px; font-weight: 700; color: var(--gold); line-height: 1.2; letter-spacing: 0.3px; }
  #headerLeft .board-label { font-size: 11px; color: var(--text-dim); line-height: 1.2; }
  #headerCenter { flex: 1; text-align: center; padding: 0 8px; }
  #headerTurnStatus {
    font-size: 15px; font-weight: 700; color: var(--text);
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    line-height: 1.2;
  }
  #headerRound { font-size: 11px; color: var(--text-dim); margin-top: 1px; }
  #headerEvent { font-size: 11px; color: var(--gold); margin-top: 1px; }
  #headerRight { display: flex; align-items: center; gap: 6px; min-width: 200px; justify-content: flex-end; }
  .hdr-btn {
    background: var(--glass-light); border: 1px solid var(--hairline);
    color: var(--text); border-radius: var(--radius-sm); padding: 5px 9px;
    font-size: 12px; cursor: pointer; white-space: nowrap;
    font-family: var(--font);
    transition: background var(--ease), border-color var(--ease);
  }
  .hdr-btn:hover { background: rgba(255,255,255,0.14); border-color: var(--gold); }
  #headerVersion { font-size: 10px; color: var(--text-mute); margin-left: 4px; }
  #turnToast {
    position: absolute; bottom: 140px; right: 16px;
    background: var(--glass-strong); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--gold);
    border-radius: var(--radius-sm);
    padding: 9px 14px;
    font-size: 13px;
    color: var(--text);
    max-width: 240px;
    pointer-events: none;
    opacity: 0;
    box-shadow: var(--shadow), var(--glow-gold);
    transition: opacity 0.3s ease;
    z-index: 60;
  }
  #turnToast.visible { opacity: 1; }
  #helpOverlay {
    position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
    width: 320px;
    background: var(--glass-strong); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--hairline);
    border-radius: var(--radius-lg); padding: 18px;
    color: var(--text); font-size: 13px; line-height: 1.6;
    box-shadow: var(--shadow-pop), var(--top-hi);
    z-index: 80;
  }
  #helpOverlay h3 { color: var(--gold); margin: 0 0 10px; font-size: 14px; }
  #helpOverlay ul { margin: 0; padding-left: 18px; }
  #helpOverlay li { margin: 4px 0; color: var(--text-dim); }
  #settingsOverlay {
    position: absolute; top: 80px; right: 12px;
    width: 200px;
    background: var(--glass-strong); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--hairline);
    border-radius: var(--radius-lg); padding: 14px;
    color: var(--text); font-size: 13px;
    box-shadow: var(--shadow-pop), var(--top-hi);
    z-index: 80;
  }
  #settingsOverlay label { color: var(--text-dim); font-size: 12px; margin-top: 6px; }
  #deedCardPopup {
    position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
    width: 300px;
    background: var(--glass-strong); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--gold); border-radius: var(--radius-lg);
    box-shadow: var(--shadow-pop), var(--glow-gold);
    z-index: 90;
    overflow: hidden;
  }
  #deedCardPopup .dc-color-bar {
    height: 8px; width: 100%;
  }
  #deedCardPopup .dc-header {
    padding: 12px 16px 6px; font-weight: 700; font-size: 15px; color: var(--gold);
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  #deedCardPopup .dc-close {
    background: none; border: none; color: var(--text-dim); font-size: 18px;
    cursor: pointer; padding: 0 0 0 8px; line-height: 1; box-shadow: none;
  }
  #deedCardPopup .dc-close:hover { color: #fff; transform: none; filter: none; box-shadow: none; }
  #deedCardPopup .dc-body {
    padding: 8px 16px 14px; color: var(--text); font-size: 12px; line-height: 1.6;
  }
  #deedCardPopup .dc-row { display: flex; justify-content: space-between; border-bottom: 1px solid var(--hairline-soft); padding: 3px 0; }
  #deedCardPopup .dc-row:last-child { border-bottom: none; }
  #deedCardPopup .dc-label { color: var(--text-dim); }
  #deedCardPopup .dc-value { color: var(--text); text-align: right; }
  #deedCardPopup .dc-owner { margin-top: 8px; font-size: 12px; color: var(--info); }
  #deedCardPopup .dc-status { font-size: 11px; color: var(--danger); margin-top: 2px; }
  #specialEventToast {
    position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
    background: rgba(67, 20, 110, 0.78); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--magenta);
    border-radius: var(--radius);
    padding: 11px 16px;
    font-size: 13px;
    color: #f0d5ff;
    max-width: 500px;
    text-align: center;
    line-height: 1.5;
    box-shadow: var(--shadow), var(--glow-magenta);
    z-index: 85;
    display: flex; align-items: flex-start; gap: 10px;
  }
  #specialEventToast .set-text { flex: 1; }
  #specialEventToast .set-close {
    background: none; border: none; color: #c4b5fd; font-size: 16px;
    cursor: pointer; padding: 0; line-height: 1; flex-shrink: 0; box-shadow: none;
  }
  #specialEventToast .set-close:hover { color: #fff; transform: none; filter: none; box-shadow: none; }
  #paymentToasts {
    position: absolute; bottom: 185px; right: 16px;
    display: flex; flex-direction: column-reverse; gap: 6px;
    pointer-events: none;
    z-index: 65;
  }
  .payment-toast {
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: bold;
    color: #fff;
    max-width: 280px;
    opacity: 0;
    transition: opacity 0.3s ease;
    line-height: 1.4;
  }
  .payment-toast.visible { opacity: 1; }
  .payment-toast.paying { background: rgba(153,27,27,0.92); border: 1px solid #ef4444; }
  .payment-toast.receiving { background: rgba(20,83,45,0.92); border: 1px solid #22c55e; }
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
  .fp-swatch.selected { border-color: var(--gold); box-shadow: var(--glow-gold); }
  .fp-swatch.taken { opacity: 0.35; cursor: default; }
  .fp-swatch:hover:not(.taken) { border-color: rgba(255,255,255,0.5); }
  #turnTimer {
    display: inline-block;
    font-size: 13px;
    font-weight: bold;
    color: rgba(255,255,255,0.85);
    background: rgba(0,0,0,0.35);
    border-radius: 4px;
    padding: 1px 7px;
    margin-left: 6px;
    vertical-align: middle;
    min-width: 36px;
    text-align: center;
  }
  #turnTimer.urgent {
    color: #f87171;
    animation: timerPulse 0.6s ease-in-out infinite alternate;
  }
  @keyframes timerPulse {
    from { opacity: 1; }
    to   { opacity: 0.45; }
  }
  /* Player inspector (feature 1) */
  #playerInspector {
    position: absolute; top: 80px; left: 250px;
    width: 280px;
    max-height: calc(70vh - 48px);
    overflow-y: auto;
    z-index: 70;
  }
  #playerInspector .pi-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 8px;
  }
  #playerInspector .pi-title { font-size: 13px; color: var(--gold); font-weight: 700; }
  #playerInspector .pi-close {
    background: none; border: none; color: var(--text-dim); font-size: 18px;
    cursor: pointer; padding: 0; line-height: 1; box-shadow: none;
  }
  #playerInspector .pi-close:hover { color: #fff; transform: none; filter: none; box-shadow: none; }
  #playerInspector .pi-stat { font-size: 12px; color: var(--text-dim); margin: 2px 0; }
  #playerInspector .pi-worth { font-size: 13px; color: var(--success); font-weight: 700; margin: 4px 0; }
  #playerInspector .pi-group { margin-top: 8px; }
  #playerInspector .pi-group-title { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  #playerInspector .pi-prop { font-size: 11px; color: var(--text); padding: 2px 0; border-bottom: 1px solid var(--hairline-soft); }
  /* Net worth rank badge */
  .nw-rank { font-size: 10px; font-weight: 700; color: #2a1c02; background: var(--gold); border-radius: 4px; padding: 0 5px; margin-left: 4px; }
  .nw-worth { font-size: 10px; color: var(--success); margin-left: 4px; }
  /* Player row clickable hint */
  .player-row { cursor: pointer; }
  .player-row:hover { background: rgba(255,255,255,0.04); }
  /* Surrender button */
  #surrenderBtn {
    background: rgba(159,18,57,0.55); border: 1px solid rgba(244,63,94,0.5);
    color: #fff; border-radius: var(--radius-sm); padding: 5px 9px;
    font-size: 12px; cursor: pointer; white-space: nowrap;
    font-family: var(--font); box-shadow: none;
    transition: background var(--ease), box-shadow var(--ease);
  }
  #surrenderBtn:hover { background: rgba(159,18,57,0.85); box-shadow: 0 0 14px rgba(244,63,94,0.35); transform: none; filter: none; }
  /* Room ready UI (feature 3) */
  .rp-player-row { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 3px 0; }
  .rp-ready-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .rp-ready-dot.ready { background: var(--success); box-shadow: 0 0 8px rgba(52,211,153,0.6); }
  .rp-ready-dot.not-ready { background: var(--text-mute); }
  /* Room settings (feature 6) */
  #roomSettingsPanel { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--hairline-soft); }
  #roomSettingsPanel .rs-title { font-size: 12px; color: var(--gold); font-weight: 700; margin-bottom: 6px; }
  #roomSettingsPanel label { font-size: 11px; color: var(--text-dim); margin-top: 6px; display: block; }
  #roomSettingsPanel select { font-size: 12px; padding: 5px 8px; margin-top: 2px; }
  #roomSettingsPanel .rs-readonly { font-size: 11px; color: var(--text-mute); margin-top: 4px; }
  /* Confirm overlay (non-modal, inline) */
  .confirm-overlay {
    background: var(--glass-strong); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    border: 1px solid var(--danger);
    border-radius: var(--radius); padding: 14px 16px; font-size: 13px; color: var(--text);
    box-shadow: var(--shadow-pop);
    position: absolute; z-index: 200;
  }
  .confirm-overlay .co-btns { display: flex; gap: 8px; margin-top: 10px; }
  .confirm-overlay .co-msg { margin-bottom: 6px; }

  /* ── Classic theme (original look) ──────────────────────────────────
     Overriding the tokens reverts the token-driven rules (glass, radii,
     shadows, blur, accents); the block below only re-adds the few bits that
     the neon rules hardcode (button/header/popup gradients). */
  body.theme-classic {
    --glass: rgba(10, 10, 30, 0.85);
    --glass-strong: #1a1a2e;
    --glass-light: rgba(255, 255, 255, 0.03);
    --hairline: #444;
    --hairline-soft: #333;
    --text: #eee;
    --text-dim: #aaa;
    --text-mute: #888;
    --gold: #facc15;
    --gold-deep: #eab308;
    --success: #22c55e;
    --danger: #ef4444;
    --muted: #555;
    --radius-lg: 8px;
    --radius: 8px;
    --radius-sm: 4px;
    --shadow: none;
    --shadow-pop: 0 4px 24px rgba(0, 0, 0, 0.7);
    --glow-gold: none;
    --glow-magenta: none;
    --top-hi: none;
    --blur: none;
    --font: 'Segoe UI', Arial, sans-serif;
    background: #1a1a2e;
  }
  body.theme-classic button {
    background: #2563eb; font-weight: normal; letter-spacing: normal;
    box-shadow: none;
  }
  body.theme-classic button:hover { background: #1d4ed8; transform: none; filter: none; box-shadow: none; }
  body.theme-classic button:active { transform: none; filter: none; }
  body.theme-classic input:focus, body.theme-classic select:focus { box-shadow: none; }
  body.theme-classic #gameHeader {
    background: linear-gradient(to bottom, #c2410c, #ea580c);
    border-bottom: 2px solid #f97316;
    box-shadow: none;
  }
  body.theme-classic #headerLeft .room-label { color: #fff; }
  body.theme-classic #actionCardPopup .ac-header { background: #f97316; color: #fff; }
  body.theme-classic #buyOfferPanel .buy-header { background: #facc15; color: #1a1a2e; }
  body.theme-classic .prop-btn.danger { background: #991b1b; box-shadow: none; }
  body.theme-classic .prop-btn.danger:hover { background: #7f1d1d; box-shadow: none; }
  body.theme-classic #gameOverBanner { background: rgba(0, 0, 0, 0.75); backdrop-filter: none; -webkit-backdrop-filter: none; }
  body.theme-classic #gameOverBanner h1 { text-shadow: none; }
  body.theme-classic #specialEventToast { background: rgba(88, 28, 135, 0.95); }
  body.theme-classic #surrenderBtn:hover { box-shadow: none; }
`;

// ---------------------------------------------------------------------------
// i18n — client-side string table (DE + EN)
// ---------------------------------------------------------------------------
type Locale = "de" | "en";

const STRINGS: Record<Locale, Record<string, string>> = {
  de: {
    // Lobby
    "lobby.title": "LasPoly",
    "lobby.nickname": "Nickname",
    "lobby.board": "Board",
    "lobby.botCount": "Bot-Anzahl",
    "lobby.createRoom": "Raum erstellen",
    "lobby.openRooms": "Offene Räume:",
    "lobby.players": "Spieler",
    // Room panel
    "room.title": "Raum",
    "room.waiting": "Warte auf Spielstart...",
    "room.board": "Board",
    "room.bots": "Bots",
    "room.players": "Spieler",
    "room.copyLink": "Link kopieren",
    "room.linkCopied": "Kopiert!",
    "room.figureTitle": "Fahrzeug wählen:",
    "room.colorAssigned": "Deine Farbe:",
    "room.startGame": "Spiel starten",
    "room.leaveRoom": "Raum verlassen",
    "room.others": "",
    // Game HUD
    "game.events": "Ereignisse",
    "game.chat": "Chat...",
    "game.send": "Senden",
    "game.roll": "Würfeln",
    "game.casinoRoll": "Im Casino würfeln",
    "game.ransom": "Freikaufen",
    "game.endTurn": "✓ Zug beenden",
    "game.spectator": "Du bist Zuschauer",
    // Header
    "header.standardView": "🗺 Standard-Ansicht",
    "header.topView": "🗺 Vogel-Ansicht",
    "header.settings": "Einstellungen",
    "header.settingsTitle": "⚙",
    "header.help": "?",
    "header.helpTitle": "Hilfe",
    "header.leave": "✕ Verlassen",
    // Help overlay
    "help.title": "Spielregeln & Steuerung",
    "help.roll": 'Würfeln: Klick auf "Würfeln"',
    "help.buy": 'Kaufen: Kaufangebot erscheint rechts - "Kaufen" oder "Ablehnen"',
    "help.build": "Bauen: Dein Grundstück - Haus/Hotel/Fabrik-Taste",
    "help.trade": 'Tauschen: "Tauschen" in der Grundstücksliste',
    "help.travel": 'Reisen: Von einem Bahnhof aus "Reisen nach..."',
    "help.view": "Ansicht: Schaltfläche oben rechts wechselt zwischen Schräg- und Vogelperspektive",
    "help.chat": "Chat: Eingabefeld unten links",
    "help.deed": "Grundstück: Klick auf ein Feld zeigt Grundbuchdaten",
    // Settings
    "settings.title": "Einstellungen",
    "settings.locale": "Sprache / Locale",
    "settings.localeNote": "Hinweis: Lokale Anzeigesprache – Spielereignisse kommen vom Server.",
    "settings.theme": "Design",
    "settings.themeNeon": "Neon-Vegas",
    "settings.themeClassic": "Klassisch",
    "settings.quality": "Grafik",
    "settings.qualityHigh": "Hoch",
    "settings.qualityLow": "Niedrig",
    "buildBlock.buildLimitUsed": "Baulimit für diesen Zug erreicht — nächste Runde wieder möglich.",
    "buildBlock.needFourOnAll": "Alle Straßen der Gruppe brauchen erst 4 Häuser.",
    "buildBlock.singleStreetNoHotel": "Auf Einzelstraßen-Gruppen kann kein Hotel gebaut werden (Balance-Regel).",
    "buildBlock.evenBuild": "Gleichmäßig bauen: erst die anderen Straßen der Gruppe aufstocken.",
    "buildBlock.mortgagedInGroup": "Eine Straße der Gruppe ist mit Hypothek belastet.",
    "deed.unbuildable": "⛔ Nicht bebaubar (Hausregel)",
    "deed.skyscraper": "Wolkenkratzer",
    "prop.skyscraper": "Wolkenkratzer",
    // My properties panel
    "props.title": "Mein Eigentum",
    "props.trade": "Tauschen",
    "props.capital": "Kapital",
    "props.builds": "Bauten diese Runde",
    // Buy offer
    "buy.header": "Kaufangebot",
    "buy.price": "Preis:",
    "buy.balance": "Dein Kapital:",
    "buy.buy": "Kaufen",
    "buy.decline": "Ablehnen",
    // Action card
    "card.header": "🃏 Aktionskarte",
    "card.confirm": "Bestätigen",
    // Game over
    "gameover.title": "Spiel vorbei!",
    "gameover.winner": "Gewinner:",
    "gameover.back": "Zurück zur Lobby",
    // Travel
    "travel.title": "Reisen nach…",
    "travel.free": "kostenlos",
    "travel.ticket": "Ticket",
    "travel.close": "Schließen",
    // Trade
    "trade.title": "Tauschangebot erstellen",
    "trade.offerTo": "Anbieten an:",
    "trade.give": "Ich gebe (Grundstücke):",
    "trade.giveMoney": "Geld geben:",
    "trade.receive": "Ich erhalte (Grundstücke von",
    "trade.receiveMoney": "Ich erhalte (Geld):",
    "trade.receiveMoneyLabel": "Geld erhalten:",
    "trade.offer": "Anbieten",
    "trade.cancel": "Abbrechen",
    // Incoming swap
    "swap.from": "Tauschangebot von",
    "swap.give": "Du gibst:",
    "swap.receive": "Du erhältst:",
    "swap.accept": "Annehmen",
    "swap.decline": "Ablehnen",
    // Turn/round
    "turn.mine": "Du bist am Zug",
    "turn.end": "Zug beenden",
    "turn.other": "ist am Zug",
    "turn.round": "Runde",
    // Property buttons
    "prop.house": "Haus",
    "prop.hotel": "Hotel",
    "prop.factory": "Fabrik",
    "prop.sellBuilding": "Gebäude verk.",
    "prop.mortgage": "Hypothek",
    "prop.unmortgage": "Ablösen",
    "prop.sell": "Verkaufen",
    // Deed card
    "deed.price": "Preis",
    "deed.mortgage": "Hypothek",
    "deed.baseRent": "Grundmiete",
    "deed.house1": "1 Haus",
    "deed.house2": "2 Häuser",
    "deed.house3": "3 Häuser",
    "deed.house4": "4 Häuser",
    "deed.hotel": "Hotel",
    "deed.factory": "Fabrik",
    "deed.houseCost": "Hauskosten",
    "deed.hotelCost": "Hotelkosten",
    "deed.factoryCost": "Fabrikkosten",
    "deed.owner": "Eigentümer:",
    "deed.building": "Gebäude:",
    "deed.mortgaged": "Hypothek aktiv",
    "deed.unowned": "Nicht im Besitz",
    "deed.rentStation1": "Miete (1 Bhf)",
    "deed.rentStation2": "Miete (2 Bhf)",
    "deed.rentStation3": "Miete (3 Bhf)",
    "deed.rentStation4": "Miete (4 Bhf)",
    "deed.rentAttr1": "Miete (1 Attr.)",
    "deed.rentAttr2": "Miete (2 Attr.)",
    // Special events
    "event.circus": "🎪 Zirkus in der Stadt",
    "event.boom": "📈 Wirtschaftsboom",
    "event.recession": "📉 Rezession",
    "event.jackpot": "🎰 Casino-Jackpot-Nacht",
    "event.buildingSale": "🏗️ Bau-Rabatt",
    "event.quietDay": "😴 Ruhiger Tag",
    "event.streetParty": "🎉 Straßenfest",
    "event.powerOutage": "🔌 Stromausfall",
    "event.marketCrash": "📉 Marktcrash",
    "event.goldRush": "⛏️ Goldrausch",
    // Player list
    "player.jail": " (Knast)",
    // My properties panel
    "props.buildingSaleActive": "🏗️ Bau-Rabatt aktiv (50%)",
    // Tooltips
    "tooltip.minPlayers": "Mindestens 2 Spieler nötig",
    "tooltip.onlyYourTurn": "Nur in deinem Zug verfügbar",
    // Figure picker tooltip
    "figurePicker.colorTaken": "hat diese Farbe",
    // Turn toast
    "turn.mine.toast": "Du bist am Zug",
    "turn.atReihe": "ist an der Reihe.",
    // Deed building strings
    "deed.house": "Haus",
    "deed.houses": "Häuser",
    "deed.diceX": "Würfel ×",
    // Settings volume
    "settings.sfxVolume": "Soundeffekte",
    "settings.musicVolume": "Musik",
    // Player inspector (feature 1)
    "inspector.title": "Spieler-Details",
    "inspector.cash": "Kapital:",
    "inspector.netWorth": "Nettovermögen:",
    "inspector.properties": "Grundstücke:",
    "inspector.none": "Keine Grundstücke",
    "inspector.mortgaged": "(Hyp.)",
    // Net worth rank (feature 2)
    "rank.leader": "#1",
    // Room ready (feature 3)
    "room.readyToggle.ready": "Bereit",
    "room.readyToggle.notReady": "Nicht bereit",
    "room.readyStatus": "Bereit",
    "room.notReadyStatus": "Nicht bereit",
    // Surrender (feature 4)
    "game.surrender": "Aufgeben",
    "game.surrenderConfirm": "Wirklich aufgeben? Du scheidest aus dem Spiel aus.",
    "game.surrenderYes": "Aufgeben",
    "game.surrenderNo": "Abbrechen",
    // Leave confirm (feature 4)
    "game.leaveConfirm": "Spiel wirklich verlassen?",
    "game.leaveYes": "Verlassen",
    "game.leaveNo": "Bleiben",
    // Rematch (feature 5)
    "gameover.rematch": "Neues Spiel",
    "gameover.waitHost": "Warte auf Host…",
    // Game settings (feature 6)
    "settings.game.title": "Spieleinstellungen",
    "settings.game.startCap": "Startkapital",
    "settings.game.buildCost": "Gebäudekosten",
    "settings.game.botDiff": "Bot-Schwierigkeit",
    "settings.game.easy": "Einfach",
    "settings.game.normal": "Normal",
    "settings.game.hard": "Schwer",
    "settings.game.halfX": "0,5×",
    "settings.game.oneX": "1×",
    "settings.game.twoX": "2×",
    "settings.game.readonly": "Einstellungen (nur Host kann ändern)",
  },
  en: {
    // Lobby
    "lobby.title": "LasPoly",
    "lobby.nickname": "Nickname",
    "lobby.board": "Board",
    "lobby.botCount": "Bot count",
    "lobby.createRoom": "Create Room",
    "lobby.openRooms": "Open Rooms:",
    "lobby.players": "players",
    // Room panel
    "room.title": "Room",
    "room.waiting": "Waiting for game start...",
    "room.board": "Board",
    "room.bots": "Bots",
    "room.players": "Players",
    "room.copyLink": "Copy link",
    "room.linkCopied": "Copied!",
    "room.figureTitle": "Choose your vehicle:",
    "room.colorAssigned": "Your colour:",
    "room.startGame": "Start Game",
    "room.leaveRoom": "Leave Room",
    "room.others": "",
    // Game HUD
    "game.events": "Events",
    "game.chat": "Chat...",
    "game.send": "Send",
    "game.roll": "Roll",
    "game.casinoRoll": "Roll at casino",
    "game.ransom": "Pay Bail",
    "game.endTurn": "✓ End Turn",
    "game.spectator": "You are a spectator",
    // Header
    "header.standardView": "🗺 Standard View",
    "header.topView": "🗺 Top View",
    "header.settings": "Settings",
    "header.settingsTitle": "⚙",
    "header.help": "?",
    "header.helpTitle": "Help",
    "header.leave": "✕ Leave",
    // Help overlay
    "help.title": "Rules & Controls",
    "help.roll": "Roll: Click \"Roll\"",
    "help.buy": "Buy: Purchase offer appears on the right – \"Buy\" or \"Decline\"",
    "help.build": "Build: Your property → House/Hotel/Factory button",
    "help.trade": "Trade: \"Trade\" in the property list",
    "help.travel": "Travel: From a station \"Travel to…\"",
    "help.view": "View: Button top-right switches between angled and top-down perspective",
    "help.chat": "Chat: Input field bottom left",
    "help.deed": "Property: Click a tile to show deed information",
    // Settings
    "settings.title": "Settings",
    "settings.locale": "Language / Locale",
    "settings.localeNote": "Note: Local display language – game events come from the server.",
    "settings.theme": "Design",
    "settings.themeNeon": "Neon Vegas",
    "settings.themeClassic": "Classic",
    "settings.quality": "Graphics",
    "settings.qualityHigh": "High",
    "settings.qualityLow": "Low",
    "buildBlock.buildLimitUsed": "Build limit reached this turn — available again next turn.",
    "buildBlock.needFourOnAll": "All streets in the group need 4 houses first.",
    "buildBlock.singleStreetNoHotel": "Single-street groups cannot build a hotel (balance rule).",
    "buildBlock.evenBuild": "Build evenly: raise the other streets in the group first.",
    "buildBlock.mortgagedInGroup": "A street in this group is mortgaged.",
    "deed.unbuildable": "⛔ No building allowed (house rule)",
    "deed.skyscraper": "Skyscraper",
    "prop.skyscraper": "Skyscraper",
    // My properties panel
    "props.title": "My Properties",
    "props.trade": "Trade",
    "props.capital": "Capital",
    "props.builds": "Builds this turn",
    // Buy offer
    "buy.header": "Purchase Offer",
    "buy.price": "Price:",
    "buy.balance": "Your capital:",
    "buy.buy": "Buy",
    "buy.decline": "Decline",
    // Action card
    "card.header": "🃏 Action Card",
    "card.confirm": "Confirm",
    // Game over
    "gameover.title": "Game Over!",
    "gameover.winner": "Winner:",
    "gameover.back": "Back to Lobby",
    // Travel
    "travel.title": "Travel to…",
    "travel.free": "free",
    "travel.ticket": "ticket",
    "travel.close": "Close",
    // Trade
    "trade.title": "Create Trade Offer",
    "trade.offerTo": "Offer to:",
    "trade.give": "I give (properties):",
    "trade.giveMoney": "Give money:",
    "trade.receive": "I receive (properties from",
    "trade.receiveMoney": "I receive (money):",
    "trade.receiveMoneyLabel": "Receive money:",
    "trade.offer": "Offer",
    "trade.cancel": "Cancel",
    // Incoming swap
    "swap.from": "Trade offer from",
    "swap.give": "You give:",
    "swap.receive": "You receive:",
    "swap.accept": "Accept",
    "swap.decline": "Decline",
    // Turn/round
    "turn.mine": "Your turn",
    "turn.end": "End Turn",
    "turn.other": "is playing",
    "turn.round": "Round",
    // Property buttons
    "prop.house": "House",
    "prop.hotel": "Hotel",
    "prop.factory": "Factory",
    "prop.sellBuilding": "Sell building",
    "prop.mortgage": "Mortgage",
    "prop.unmortgage": "Unmortgage",
    "prop.sell": "Sell",
    // Deed card
    "deed.price": "Price",
    "deed.mortgage": "Mortgage",
    "deed.baseRent": "Base rent",
    "deed.house1": "1 House",
    "deed.house2": "2 Houses",
    "deed.house3": "3 Houses",
    "deed.house4": "4 Houses",
    "deed.hotel": "Hotel",
    "deed.factory": "Factory",
    "deed.houseCost": "House cost",
    "deed.hotelCost": "Hotel cost",
    "deed.factoryCost": "Factory cost",
    "deed.owner": "Owner:",
    "deed.building": "Building:",
    "deed.mortgaged": "Mortgage active",
    "deed.unowned": "Not owned",
    "deed.rentStation1": "Rent (1 stn)",
    "deed.rentStation2": "Rent (2 stn)",
    "deed.rentStation3": "Rent (3 stn)",
    "deed.rentStation4": "Rent (4 stn)",
    "deed.rentAttr1": "Rent (1 attr.)",
    "deed.rentAttr2": "Rent (2 attr.)",
    // Special events
    "event.circus": "🎪 Circus in Town",
    "event.boom": "📈 Economic Boom",
    "event.recession": "📉 Recession",
    "event.jackpot": "🎰 Casino Jackpot Night",
    "event.buildingSale": "🏗️ Building Sale",
    "event.quietDay": "😴 Quiet Day",
    "event.streetParty": "🎉 Street Party",
    "event.powerOutage": "🔌 Power Outage",
    "event.marketCrash": "📉 Market Crash",
    "event.goldRush": "⛏️ Gold Rush",
    // Player list
    "player.jail": " (Jail)",
    // My properties panel
    "props.buildingSaleActive": "🏗️ Building Sale active (50%)",
    // Tooltips
    "tooltip.minPlayers": "At least 2 players needed",
    "tooltip.onlyYourTurn": "Only available on your turn",
    // Figure picker tooltip
    "figurePicker.colorTaken": "has this colour",
    // Turn toast
    "turn.mine.toast": "Your turn",
    "turn.atReihe": "is playing now.",
    // Deed building strings
    "deed.house": "House",
    "deed.houses": "Houses",
    "deed.diceX": "Dice ×",
    // Settings volume
    "settings.sfxVolume": "Sound effects",
    "settings.musicVolume": "Music",
    // Player inspector (feature 1)
    "inspector.title": "Player Details",
    "inspector.cash": "Cash:",
    "inspector.netWorth": "Net worth:",
    "inspector.properties": "Properties:",
    "inspector.none": "No properties",
    "inspector.mortgaged": "(Mortg.)",
    // Net worth rank (feature 2)
    "rank.leader": "#1",
    // Room ready (feature 3)
    "room.readyToggle.ready": "Ready",
    "room.readyToggle.notReady": "Not Ready",
    "room.readyStatus": "Ready",
    "room.notReadyStatus": "Not ready",
    // Surrender (feature 4)
    "game.surrender": "Surrender",
    "game.surrenderConfirm": "Really surrender? You will be eliminated from the game.",
    "game.surrenderYes": "Surrender",
    "game.surrenderNo": "Cancel",
    // Leave confirm (feature 4)
    "game.leaveConfirm": "Really leave the game?",
    "game.leaveYes": "Leave",
    "game.leaveNo": "Stay",
    // Rematch (feature 5)
    "gameover.rematch": "New Game",
    "gameover.waitHost": "Waiting for host…",
    // Game settings (feature 6)
    "settings.game.title": "Game Settings",
    "settings.game.startCap": "Starting Capital",
    "settings.game.buildCost": "Building Costs",
    "settings.game.botDiff": "Bot Difficulty",
    "settings.game.easy": "Easy",
    "settings.game.normal": "Normal",
    "settings.game.hard": "Hard",
    "settings.game.halfX": "0.5×",
    "settings.game.oneX": "1×",
    "settings.game.twoX": "2×",
    "settings.game.readonly": "Settings (only host can change)",
  },
};

let _locale: Locale = (localStorage.getItem("laspoly_locale") as Locale | null) ?? "de";

function t(key: string): string {
  return STRINGS[_locale][key] ?? STRINGS["de"][key] ?? key;
}

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
  private casinoRollBtn!: HTMLButtonElement;
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
  private deedCardPos: number | null = null; // tile pos shown in the open deed card (bug 11)
  private helpOverlay!: HTMLDivElement;
  private settingsOverlay!: HTMLDivElement;
  private specialEventToast!: HTMLDivElement;
  private specialEventToastTimer: ReturnType<typeof setTimeout> | null = null;
  private myColor: string = "red";
  private myFigureIndex: number = 0;
  private figurePreview: FigurePreview | null = null;
  private currentLocale: Locale = _locale;
  // Payment toast (feature #4)
  private paymentToast!: HTMLDivElement;
  // Mute button ref (feature #1)
  private muteBtn!: HTMLButtonElement;
  // Current room id for share link (feature #6)
  private currentRoomId: string | null = null;
  // Turn-timer countdown
  private turnTimerEl: HTMLSpanElement | null = null;
  private turnTimerHideTimer: ReturnType<typeof setTimeout> | null = null;
  // Player inspector (feature 1)
  private playerInspector!: HTMLDivElement;
  private inspectedPlayerId: string | null = null;
  // Surrender button ref (feature 4)
  private surrenderBtn!: HTMLButtonElement;
  private surrenderConfirmEl: HTMLDivElement | null = null;
  // Leave confirm element (feature 4)
  private leaveConfirmEl: HTMLDivElement | null = null;
  // Room ready state (feature 3)
  private myReady: boolean = true;
  // Current room settings from server (feature 6)
  private currentRoomSettings: GameSettings = {};
  private currentIsHost: boolean = false;
  // Game-over rematch host id (feature 5)
  private gameOverHostId: string | null = null;

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
    this.buildPlayerInspector();
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
      <button id="lobbySettingsBtn" class="hdr-btn" title="${t("header.settings")}" style="position:absolute;top:12px;right:12px;">${t("header.settingsTitle")}</button>
      <h2 id="lobbyTitle" style="margin-bottom:12px;color:var(--gold);">${t("lobby.title")}</h2>
      <label id="lobbyNicknameLabel">${t("lobby.nickname")}</label>
      <input id="nickname" type="text" placeholder="Your name" value="Player" />
      <label id="lobbyBoardLabel">${t("lobby.board")}</label>
      <select id="boardId"></select>
      <label id="lobbyBotCountLabel">${t("lobby.botCount")}</label>
      <select id="botCount">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3" selected>3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
      <button id="createRoom" style="margin-top:16px;width:100%;">${t("lobby.createRoom")}</button>
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

    // Audio/locale settings reachable from the lobby too (bug 2-3).
    const lobbySettingsBtn = document.getElementById("lobbySettingsBtn") as HTMLButtonElement;
    lobbySettingsBtn?.addEventListener("click", () => {
      const visible = this.settingsOverlay.style.display !== "none";
      if (visible) hide(this.settingsOverlay); else show(this.settingsOverlay, "block");
    });

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
      <h2 id="roomPanelTitle" style="margin-bottom:12px;color:var(--gold);">${t("room.title")}</h2>
      <div id="roomInfo" style="margin-bottom:12px;font-size:13px;color:#ccc;"></div>
      <div id="roomPlayerList" style="margin-bottom:8px;"></div>
      <div id="roomReadyRow" style="margin:8px 0;"></div>
      <div id="roomLinkRow">
        <input id="roomLinkInput" type="text" readonly placeholder="Raum-Link…" />
        <button id="roomLinkCopyBtn" style="flex-shrink:0;white-space:nowrap;">${t("room.copyLink")}</button>
      </div>
      <div id="figurePicker"></div>
      <div id="roomSettingsPanel"></div>
      <button id="startGame" style="width:100%;margin-top:8px;">${t("room.startGame")}</button>
      <button id="leaveRoom" style="width:100%;background:rgba(255,255,255,0.1);margin-top:4px;">${t("room.leaveRoom")}</button>
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
          copyBtn.textContent = t("room.linkCopied");
          setTimeout(() => { copyBtn.textContent = t("room.copyLink"); }, 2000);
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
      <div id="eventsLabel" style="font-size:12px;color:#aaa;margin-bottom:4px;">${t("game.events")}</div>
      <div id="eventLog"></div>
      <div id="chatRow">
        <input id="chatInput" type="text" placeholder="${t("game.chat")}" />
        <button id="chatSendBtn">${t("game.send")}</button>
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
      <button id="rollBtn">${t("game.roll")}</button>
      <button id="casinoRollBtn" style="background:#a855f7;font-weight:bold;display:none;">${t("game.casinoRoll")}</button>
      <button id="ransomBtn">${t("game.ransom")}</button>
      <button id="endTurnBtn" style="background:#16a34a;font-size:15px;font-weight:bold;padding:10px 20px;display:none;">${t("game.endTurn")}</button>
    `;
    hud.appendChild(actionPanel);

    this.rollBtn = document.getElementById("rollBtn") as HTMLButtonElement;
    this.casinoRollBtn = document.getElementById("casinoRollBtn") as HTMLButtonElement;
    this.ransomBtn = document.getElementById("ransomBtn") as HTMLButtonElement;
    this.endTurnBtn = document.getElementById("endTurnBtn") as HTMLButtonElement;

    // Hide action buttons initially
    hide(this.rollBtn);
    hide(this.casinoRollBtn);
    hide(this.ransomBtn);
    hide(this.endTurnBtn);

    this.casinoRollBtn.addEventListener("click", () => {
      hide(this.casinoRollBtn);
      this.casinoRollBtn.disabled = true;
      this.net.send({ t: "command", command: { type: "ROLL_CASINO" } });
    });

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
    spectatorBanner.textContent = t("game.spectator");
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

    // Center: turn status + round + event + turn timer
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

    // Turn-timer badge (sibling of turn status, inside headerCenter)
    const timerEl = document.createElement("span");
    timerEl.id = "turnTimer";
    timerEl.style.display = "none";
    center.appendChild(timerEl); // append to center, NOT to headerTurnStatus (which uses .textContent)
    this.turnTimerEl = timerEl;

    // Right: view toggle, settings, help, leave, version
    const right = document.createElement("div");
    right.id = "headerRight";

    const viewBtn = document.createElement("button");
    viewBtn.className = "hdr-btn";
    viewBtn.id = "headerViewBtn";
    viewBtn.textContent = t("header.standardView");
    viewBtn.addEventListener("click", () => {
      if (this.currentView === "standard") {
        this.currentView = "top";
        viewBtn.textContent = t("header.topView");
        this.board3d.setView("top");
      } else {
        this.currentView = "standard";
        viewBtn.textContent = t("header.standardView");
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
    settingsBtn.id = "settingsHdrBtn";
    settingsBtn.textContent = t("header.settingsTitle");
    settingsBtn.title = t("header.settings");
    settingsBtn.addEventListener("click", () => {
      const visible = this.settingsOverlay.style.display !== "none";
      if (visible) hide(this.settingsOverlay);
      else show(this.settingsOverlay, "block");
      hide(this.helpOverlay);
    });
    right.appendChild(settingsBtn);

    const helpBtn = document.createElement("button");
    helpBtn.className = "hdr-btn";
    helpBtn.id = "helpHdrBtn";
    helpBtn.textContent = t("header.help");
    helpBtn.title = t("header.helpTitle");
    helpBtn.addEventListener("click", () => {
      const visible = this.helpOverlay.style.display !== "none";
      if (visible) hide(this.helpOverlay);
      else show(this.helpOverlay, "block");
      hide(this.settingsOverlay);
    });
    right.appendChild(helpBtn);

    // Surrender button (feature 4)
    const surrenderBtn = document.createElement("button");
    surrenderBtn.id = "surrenderBtn";
    surrenderBtn.textContent = t("game.surrender");
    hide(surrenderBtn);
    surrenderBtn.addEventListener("click", () => {
      this.showSurrenderConfirm();
    });
    right.appendChild(surrenderBtn);
    this.surrenderBtn = surrenderBtn;

    const leaveBtn = document.createElement("button");
    leaveBtn.className = "hdr-btn";
    leaveBtn.id = "leaveGameBtn";
    leaveBtn.textContent = t("header.leave");
    leaveBtn.style.background = "rgba(153,27,27,0.6)";
    leaveBtn.addEventListener("click", () => {
      this.showLeaveConfirm(leaveBtn);
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
    const buildHelpContent = () => `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;color:#f97316;font-size:14px;">${t("help.title")}</h3>
        <button id="helpCloseBtn" style="background:none;border:none;color:#aaa;font-size:20px;cursor:pointer;padding:0;line-height:1;">×</button>
      </div>
      <ul style="margin:0;padding-left:18px;">
        <li>${t("help.roll")}</li>
        <li>${t("help.buy")}</li>
        <li>${t("help.build")}</li>
        <li>${t("help.trade")}</li>
        <li>${t("help.travel")}</li>
        <li>${t("help.view")}</li>
        <li>${t("help.chat")}</li>
        <li>${t("help.deed")}</li>
      </ul>
    `;
    help.innerHTML = buildHelpContent();
    (help as HTMLElement & { _rebuildContent?: () => void })._rebuildContent = () => {
      help.innerHTML = buildHelpContent();
      help.querySelector("#helpCloseBtn")!.addEventListener("click", () => hide(help));
    };
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
    // Selected toggle → solid blue + white text (clearly the active choice);
    // unselected → muted glass. `sel(true)` also wins over the .hdr-btn/base rules.
    const sel = (on: boolean) =>
      on
        ? "background:#2563eb;border-color:#3b82f6;color:#fff;font-weight:bold;"
        : "background:rgba(255,255,255,0.06);color:var(--text-dim);";
    const buildSettingsContent = () => `
      <div id="settingsTitle" style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:8px;">${t("settings.title")}</div>
      <label id="settingsLocaleLabel">${t("settings.locale")}</label>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <button id="localeDEBtn" class="hdr-btn" style="font-size:12px;${sel(_locale === 'de')}">🇩🇪 DE</button>
        <button id="localeENBtn" class="hdr-btn" style="font-size:12px;${sel(_locale === 'en')}">🇬🇧 EN</button>
      </div>
      <div id="settingsNote" style="margin-top:8px;font-size:11px;color:#888;">${t("settings.localeNote")}</div>
      <label id="settingsThemeLabel" style="margin-top:10px;">${t("settings.theme")}</label>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <button id="themeNeonBtn" class="hdr-btn" style="font-size:12px;${sel(getTheme() === 'neon')}">${t("settings.themeNeon")}</button>
        <button id="themeClassicBtn" class="hdr-btn" style="font-size:12px;${sel(getTheme() === 'classic')}">${t("settings.themeClassic")}</button>
      </div>
      <label id="settingsQualityLabel" style="margin-top:10px;">${t("settings.quality")}</label>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <button id="qualityHighBtn" class="hdr-btn" style="font-size:12px;${sel(getQuality() === 'high')}">${t("settings.qualityHigh")}</button>
        <button id="qualityLowBtn" class="hdr-btn" style="font-size:12px;${sel(getQuality() === 'low')}">${t("settings.qualityLow")}</button>
      </div>
      <label id="settingsSfxLabel" style="margin-top:10px;">${t("settings.sfxVolume")}</label>
      <input id="sfxVolumeSlider" type="range" min="0" max="100" value="${Math.round(audio.currentSfxVolume * 100)}" style="width:100%;margin-top:2px;" />
      <label id="settingsMusicLabel" style="margin-top:6px;">${t("settings.musicVolume")}</label>
      <input id="musicVolumeSlider" type="range" min="0" max="100" value="${Math.round(audio.currentMusicVolume * 100)}" style="width:100%;margin-top:2px;" />
    `;
    settings.innerHTML = buildSettingsContent();
    hide(settings);
    // Append to root (not gameHud) so it can also open from the lobby (bug 2-3),
    // where gameHud is hidden. It is position:absolute so layout is unaffected.
    this.root.appendChild(settings);
    this.settingsOverlay = settings;

    // Wire locale buttons — send setLocale to server + persist + re-render UI
    const LOCALE_KEY = "laspoly_locale";
    const applyLocale = (locale: Locale) => {
      _locale = locale;
      this.currentLocale = locale;
      localStorage.setItem(LOCALE_KEY, locale);
      this.net.send({ t: "setLocale", locale });
      // Rebuild settings panel with new locale (preserves slider values)
      settings.innerHTML = buildSettingsContent();
      this.wireLocaleButtons(settings, applyLocale);
      this.wireVolumeSliders(settings);
      this.wireThemeButtons(settings);
      this.wireQualityButtons(settings);
      // Re-render all static UI text
      this.relabelUI();
    };
    this.wireLocaleButtons(settings, applyLocale);
    this.wireVolumeSliders(settings);
    this.wireThemeButtons(settings);
    this.wireQualityButtons(settings);
    const savedLocale = (localStorage.getItem(LOCALE_KEY) ?? "de") as Locale;
    // Defer applyLocale to after WS is open (constructor runs before connection)
    setTimeout(() => applyLocale(savedLocale), 0);
  }

  private wireLocaleButtons(settings: HTMLElement, applyLocale: (locale: Locale) => void) {
    settings.querySelector("#localeDEBtn")?.addEventListener("click", () => applyLocale("de"));
    settings.querySelector("#localeENBtn")?.addEventListener("click", () => applyLocale("en"));
  }

  private wireThemeButtons(settings: HTMLElement) {
    // Switching theme reloads so the 3D scene rebuilds under the new palette;
    // a mid-game reload resumes via the saved session.
    const apply = (theme: Theme) => {
      if (getTheme() === theme) return;
      setTheme(theme);
      location.reload();
    };
    settings.querySelector("#themeNeonBtn")?.addEventListener("click", () => apply("neon"));
    settings.querySelector("#themeClassicBtn")?.addEventListener("click", () => apply("classic"));
  }

  private wireQualityButtons(settings: HTMLElement) {
    // Switching quality reloads so the Babylon effect pipeline (bloom, glow,
    // shadows, particles) rebuilds cleanly; mid-game reload resumes via session.
    const apply = (quality: Quality) => {
      if (getQuality() === quality) return;
      setQuality(quality);
      location.reload();
    };
    settings.querySelector("#qualityHighBtn")?.addEventListener("click", () => apply("high"));
    settings.querySelector("#qualityLowBtn")?.addEventListener("click", () => apply("low"));
  }

  private wireVolumeSliders(settings: HTMLElement) {
    const sfxSlider = settings.querySelector("#sfxVolumeSlider") as HTMLInputElement | null;
    const musicSlider = settings.querySelector("#musicVolumeSlider") as HTMLInputElement | null;
    if (sfxSlider) {
      sfxSlider.addEventListener("input", () => {
        audio.setSfxVolume(parseInt(sfxSlider.value, 10) / 100);
      });
    }
    if (musicSlider) {
      musicSlider.addEventListener("input", () => {
        audio.setMusicVolume(parseInt(musicSlider.value, 10) / 100);
      });
    }
  }

  /** Re-apply i18n labels to all static UI text after a locale switch. */
  private relabelUI() {
    // Lobby
    const lobbyTitle = document.getElementById("lobbyTitle");
    if (lobbyTitle) lobbyTitle.textContent = t("lobby.title");
    const lobbyNickLabel = document.getElementById("lobbyNicknameLabel");
    if (lobbyNickLabel) lobbyNickLabel.textContent = t("lobby.nickname");
    const lobbyBoardLabel = document.getElementById("lobbyBoardLabel");
    if (lobbyBoardLabel) lobbyBoardLabel.textContent = t("lobby.board");
    const lobbyBotLabel = document.getElementById("lobbyBotCountLabel");
    if (lobbyBotLabel) lobbyBotLabel.textContent = t("lobby.botCount");
    const createRoomBtn = document.getElementById("createRoom");
    if (createRoomBtn) createRoomBtn.textContent = t("lobby.createRoom");

    // Room panel
    const roomPanelTitle = document.getElementById("roomPanelTitle");
    if (roomPanelTitle) roomPanelTitle.textContent = t("room.title");
    const copyBtn = document.getElementById("roomLinkCopyBtn");
    if (copyBtn) copyBtn.textContent = t("room.copyLink");
    const startGameBtn = document.getElementById("startGame");
    if (startGameBtn) startGameBtn.textContent = t("room.startGame");
    const leaveRoomBtn = document.getElementById("leaveRoom");
    if (leaveRoomBtn) leaveRoomBtn.textContent = t("room.leaveRoom");

    // Game HUD static labels
    const eventsLabel = document.getElementById("eventsLabel");
    if (eventsLabel) eventsLabel.textContent = t("game.events");
    const chatInput = document.getElementById("chatInput") as HTMLInputElement | null;
    if (chatInput) chatInput.placeholder = t("game.chat");
    const chatSendBtn = document.getElementById("chatSendBtn");
    if (chatSendBtn) chatSendBtn.textContent = t("game.send");
    const rollBtn = document.getElementById("rollBtn");
    if (rollBtn) rollBtn.textContent = t("game.roll");
    const ransomBtn = document.getElementById("ransomBtn");
    if (ransomBtn) ransomBtn.textContent = t("game.ransom");
    const endTurnBtn = document.getElementById("endTurnBtn");
    if (endTurnBtn) endTurnBtn.textContent = t("game.endTurn");
    const spectatorBanner = document.getElementById("spectatorBanner");
    if (spectatorBanner) spectatorBanner.textContent = t("game.spectator");

    // Header buttons
    const viewBtn = document.getElementById("headerViewBtn");
    if (viewBtn) viewBtn.textContent = this.currentView === "top" ? t("header.topView") : t("header.standardView");
    const settingsHdrBtn = document.getElementById("settingsHdrBtn");
    if (settingsHdrBtn) settingsHdrBtn.title = t("header.settings");
    const helpHdrBtn = document.getElementById("helpHdrBtn");
    if (helpHdrBtn) helpHdrBtn.title = t("header.helpTitle");
    const leaveGameBtn = document.getElementById("leaveGameBtn");
    if (leaveGameBtn) leaveGameBtn.textContent = t("header.leave");

    // Help overlay (rebuild content if visible)
    const helpOverlay = document.getElementById("helpOverlay") as HTMLElement & { _rebuildContent?: () => void } | null;
    if (helpOverlay?._rebuildContent) helpOverlay._rebuildContent();

    // Buy offer panel
    const buyHeader = document.querySelector("#buyOfferPanel .buy-header");
    if (buyHeader) buyHeader.textContent = t("buy.header");
    const buyBtn = document.getElementById("buyOfferBuyBtn");
    if (buyBtn) buyBtn.textContent = t("buy.buy");
    const buyDeclineBtn = document.getElementById("buyOfferDeclineBtn");
    if (buyDeclineBtn) buyDeclineBtn.textContent = t("buy.decline");

    // Action card popup
    const cardHeader = document.querySelector("#actionCardPopup .ac-header");
    if (cardHeader) cardHeader.textContent = t("card.header");
    const cardConfirm = document.getElementById("actionCardConfirmBtn");
    if (cardConfirm) cardConfirm.textContent = t("card.confirm");

    // Game over banner
    const gameOverTitle = document.querySelector("#gameOverBanner h1");
    if (gameOverTitle) gameOverTitle.textContent = t("gameover.title");
    const gameOverRestart = document.getElementById("gameOverRestart");
    if (gameOverRestart) gameOverRestart.textContent = t("gameover.back");
    const gameOverRematch = document.getElementById("gameOverRematch");
    if (gameOverRematch) gameOverRematch.textContent = t("gameover.rematch");
    const gameOverWaitHost = document.getElementById("gameOverWaitHost");
    if (gameOverWaitHost) gameOverWaitHost.textContent = t("gameover.waitHost");
    // Surrender button
    const surrenderBtnEl = document.getElementById("surrenderBtn");
    if (surrenderBtnEl) surrenderBtnEl.textContent = t("game.surrender");

    // Figure picker title in room panel
    const figureTitle = document.querySelector("#figurePicker .fp-title");
    if (figureTitle) figureTitle.textContent = t("room.figureTitle");

    // My properties panel header (will be rebuilt next updateGame call)
    const myPropHeader = document.querySelector("#myPropsPanel span[style*='facc15']");
    if (myPropHeader) myPropHeader.textContent = t("props.title");
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
      <h1>${t("gameover.title")}</h1>
      <div id="gameOverWinner" style="font-size:1.5rem;color:#fff;"></div>
      <div id="gameOverBtns" style="display:flex;gap:12px;margin-top:16px;align-items:center;justify-content:center;"></div>
    `;
    hide(banner);
    this.root.appendChild(banner);
    this.gameOverBanner = banner;

    const btnsEl = document.getElementById("gameOverBtns") as HTMLDivElement;

    // Rematch button (feature 5)
    const rematchBtn = document.createElement("button");
    rematchBtn.id = "gameOverRematch";
    rematchBtn.style.cssText = "background:#16a34a;";
    rematchBtn.textContent = t("gameover.rematch");
    rematchBtn.addEventListener("click", () => {
      this.net.send({ t: "newGame" });
    });
    btnsEl.appendChild(rematchBtn);

    // Wait for host label (feature 5) - shown when non-host
    const waitLabel = document.createElement("span");
    waitLabel.id = "gameOverWaitHost";
    waitLabel.style.cssText = "font-size:13px;color:#aaa;display:none;";
    waitLabel.textContent = t("gameover.waitHost");
    btnsEl.appendChild(waitLabel);

    const restartBtn = document.createElement("button");
    restartBtn.id = "gameOverRestart";
    restartBtn.textContent = t("gameover.back");
    restartBtn.addEventListener("click", () => {
      clearSession();
      hide(this.gameOverBanner);
      this.showLobbyPanel();
    });
    btnsEl.appendChild(restartBtn);
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
      <div class="ac-header">${t("card.header")}</div>
      <div class="ac-body" id="actionCardText"></div>
      <div class="ac-footer">
        <button id="actionCardConfirmBtn" style="background:#f97316;">${t("card.confirm")}</button>
      </div>
    `;
    hide(popup);
    this.root.appendChild(popup);
    this.actionCardPopup = popup;

    const confirmBtn = document.getElementById("actionCardConfirmBtn") as HTMLButtonElement;
    confirmBtn.addEventListener("click", () => this.dismissActionCard());
  }

  showActionCard(title: string, effect = "") {
    const textEl = document.getElementById("actionCardText");
    if (textEl) {
      // Layout (bug 9): card title, then what must be done, then Confirm (in footer).
      const titleHtml = `<div style="font-weight:bold;font-size:16px;color:var(--gold);margin-bottom:8px;">${title}</div>`;
      const effectHtml = effect
        ? `<div style="font-size:13px;color:#eee;line-height:1.5;">${effect}</div>`
        : "";
      textEl.innerHTML = titleHtml + effectHtml;
    }
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
      <div class="buy-header">${t("buy.header")}</div>
      <div class="buy-body">
        <div class="buy-detail buy-tile-name" id="buyTileName" style="font-weight:bold;color:var(--gold);margin-bottom:6px;font-size:13px;">—</div>
        <div class="buy-detail" id="buyPrice">${t("buy.price")} —</div>
        <div class="buy-detail" id="buyBalance">${t("buy.balance")} —</div>
        <div class="buy-btns">
          <button id="buyOfferBuyBtn" style="background:#16a34a;flex:1;">${t("buy.buy")}</button>
          <button id="buyOfferDeclineBtn" style="background:#991b1b;flex:1;">${t("buy.decline")}</button>
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

    if (!state) { hide(panel); this.deedCardPos = null; return; }

    const board = getBoard(state.boardId);
    const tile = board.tiles[pos];
    if (!tile) { hide(panel); this.deedCardPos = null; return; }
    this.deedCardPos = pos;

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
    closeBtn.addEventListener("click", () => { hide(panel); this.deedCardPos = null; });
    hdr.appendChild(nameSpan);
    hdr.appendChild(closeBtn);
    panel.appendChild(hdr);

    // Body
    const body = document.createElement("div");
    body.className = "dc-body";

    // Determine the currently-applicable rent row key so we can highlight it
    const ownerId = state.ownership[pos];
    const bld = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
    const isMortgaged = !!state.mortgaged[pos];

    // Compute which rent key applies for street tiles
    const streetActiveKey = (() => {
      if (!ownerId || isMortgaged) return null;
      if (tile.type !== "street") return null;
      if (bld.factory) return "deed.factory";
      if (bld.hotel) return "deed.hotel";
      if (bld.houses >= 4) return "deed.house4";
      if (bld.houses === 3) return "deed.house3";
      if (bld.houses === 2) return "deed.house2";
      if (bld.houses === 1) return "deed.house1";
      // No buildings: base rent applies if owner has monopoly (whole group owned)
      return "deed.baseRent";
    })();

    // Station: rent tier is based on how many stations the owner has
    const stationPositions = [5, 15, 25, 35];
    const stationActiveKey = (() => {
      if (!ownerId || tile.type !== "station" || isMortgaged) return null;
      const count = stationPositions.filter(p => state.ownership[p] === ownerId).length;
      return count >= 4 ? "deed.rentStation4"
           : count === 3 ? "deed.rentStation3"
           : count === 2 ? "deed.rentStation2"
           : "deed.rentStation1";
    })();

    // Attraction: rent is dice-based; highlight tier based on how many owner has
    const attractionActiveKey = (() => {
      if (!ownerId || tile.type !== "attraction" || isMortgaged) return null;
      const attrPositions = board.tiles
        .map((t, i) => ({ t, i }))
        .filter(({ t: tt }) => tt.type === "attraction")
        .map(({ i }) => i);
      const count = attrPositions.filter(p => state.ownership[p] === ownerId).length;
      return count >= 2 ? "deed.rentAttr2" : "deed.rentAttr1";
    })();

    const rowHighlighted = (label: string, value: string, activeKey: string | null, rowKey: string) => {
      const r = document.createElement("div");
      r.className = "dc-row";
      const active = activeKey === rowKey;
      if (active) {
        r.style.cssText = "background:rgba(250,204,21,0.2);border-radius:3px;font-weight:bold;border-bottom:1px solid #333;padding:2px 0;";
      }
      r.innerHTML = `<span class="dc-label" style="${active ? 'color:var(--gold);' : ''}">${label}</span><span class="dc-value" style="${active ? 'color:var(--gold);' : ''}">${value}</span>`;
      body.appendChild(r);
    };

    const row = (label: string, value: string) => rowHighlighted(label, value, null, "");

    if (tile.type === "street") {
      const st = tile as StreetTile;
      row(t("deed.price"), `${st.price} LPD`);
      row(t("deed.mortgage"), `${st.mortgage} LPD`);
      rowHighlighted(t("deed.baseRent"), `${st.rent[0]} LPD`, streetActiveKey, "deed.baseRent");
      rowHighlighted(t("deed.house1"), `${st.rent[1]} LPD`, streetActiveKey, "deed.house1");
      rowHighlighted(t("deed.house2"), `${st.rent[2]} LPD`, streetActiveKey, "deed.house2");
      rowHighlighted(t("deed.house3"), `${st.rent[3]} LPD`, streetActiveKey, "deed.house3");
      rowHighlighted(t("deed.house4"), `${st.rent[4]} LPD`, streetActiveKey, "deed.house4");
      rowHighlighted(t("deed.hotel"), `${st.rent[5]} LPD`, streetActiveKey, "deed.hotel");
      rowHighlighted(t("deed.factory"), `${st.factoryRevenue} LPD`, streetActiveKey, "deed.factory");
      row(t("deed.houseCost"), `${st.houseCost} LPD`);
      row(t("deed.hotelCost"), `${st.hotelCost} LPD`);
      row(t("deed.factoryCost"), `${st.factoryCost} LPD`);
    } else if (tile.type === "station") {
      const r = board.rules.station;
      row(t("deed.price"), `${r.price} LPD`);
      row(t("deed.mortgage"), `${r.mortgage} LPD`);
      rowHighlighted(t("deed.rentStation1"), `${r.rent[0] ?? 0} LPD`, stationActiveKey, "deed.rentStation1");
      rowHighlighted(t("deed.rentStation2"), `${r.rent[1] ?? 0} LPD`, stationActiveKey, "deed.rentStation2");
      rowHighlighted(t("deed.rentStation3"), `${r.rent[2] ?? 0} LPD`, stationActiveKey, "deed.rentStation3");
      rowHighlighted(t("deed.rentStation4"), `${r.rent[3] ?? 0} LPD`, stationActiveKey, "deed.rentStation4");
    } else if (tile.type === "attraction") {
      const a = board.rules.attraction;
      row(t("deed.price"), `${a.price} LPD`);
      row(t("deed.mortgage"), `${a.mortgage} LPD`);
      rowHighlighted(t("deed.rentAttr1"), `${t("deed.diceX")}${a.factorOne}`, attractionActiveKey, "deed.rentAttr1");
      rowHighlighted(t("deed.rentAttr2"), `${t("deed.diceX")}${a.factorBoth}`, attractionActiveKey, "deed.rentAttr2");
    }

    // Owner + buildings (ownerId / bld / isMortgaged already computed above)
    if (ownerId) {
      const owner = state.players.find(p => p.id === ownerId);
      const ownerDiv = document.createElement("div");
      ownerDiv.className = "dc-owner";
      ownerDiv.textContent = `${t("deed.owner")} ${owner?.name ?? "?"}`;
      body.appendChild(ownerDiv);

      // Bug 12: if this property belongs to ANOTHER player, offer a trade from here.
      const myId = this.net.playerId;
      if (myId && ownerId !== myId && (state.players.find(p => p.id === myId)?.alive ?? false)) {
        const tradeBtn = document.createElement("button");
        tradeBtn.className = "prop-btn";
        tradeBtn.style.cssText = "margin-top:8px;background:#7c3aed;";
        tradeBtn.textContent = t("props.trade");
        tradeBtn.addEventListener("click", () => {
          hide(panel);
          this.deedCardPos = null;
          this.refreshTradePanel(state, myId, ownerId);
          show(this.tradePanel, "block");
        });
        body.appendChild(tradeBtn);
      }

      let buildStr = "";
      if (bld.skyscraper) buildStr = t("deed.skyscraper");
      else if (bld.hotel) buildStr = t("deed.hotel");
      else if (bld.factory) buildStr = t("deed.factory");
      else if (bld.houses > 0) buildStr = `${bld.houses} ${bld.houses > 1 ? t("deed.houses") : t("deed.house")}`;
      if (buildStr) {
        const bDiv = document.createElement("div");
        bDiv.className = "dc-status";
        bDiv.textContent = `${t("deed.building")} ${buildStr}`;
        body.appendChild(bDiv);
      }

      if (isMortgaged) {
        const mDiv = document.createElement("div");
        mDiv.className = "dc-status";
        mDiv.textContent = t("deed.mortgaged");
        body.appendChild(mDiv);
      }
    } else {
      const unownedDiv = document.createElement("div");
      unownedDiv.className = "dc-owner";
      unownedDiv.textContent = t("deed.unowned");
      body.appendChild(unownedDiv);
    }

    // House rule: no-build field.
    if (state.unbuildableFields?.includes(pos)) {
      const nb = document.createElement("div");
      nb.className = "dc-status";
      nb.textContent = t("deed.unbuildable");
      body.appendChild(nb);
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
    // Stacking container: rapid payments each get their own self-dismissing
    // toast instead of overwriting one shared element.
    const el = document.createElement("div");
    el.id = "paymentToasts";
    this.gameHud.appendChild(el);
    this.paymentToast = el;
  }

  // Last cash value shown per player (drives the count-up tween).
  private lastShownMoney: Map<string, number> = new Map();

  /**
   * Count-up tween on the freshly rendered ".money-val" spans. A 500ms
   * force-write guarantees the final value even when rAF is throttled
   * (headless e2e); a span replaced mid-tween just becomes a detached node.
   */
  private animateMoneyValues(state: GameState) {
    for (const span of Array.from(this.playerList.querySelectorAll<HTMLElement>(".money-val"))) {
      const pid = span.dataset["pid"];
      if (!pid) continue;
      const target = state.players.find((p) => p.id === pid)?.money ?? 0;
      const from = this.lastShownMoney.get(pid);
      this.lastShownMoney.set(pid, target);
      if (from === undefined || from === target) continue; // already rendered as target
      const DUR = 400;
      const start = performance.now();
      let raf = 0;
      const force = setTimeout(() => {
        cancelAnimationFrame(raf);
        span.textContent = `LPD ${target}`;
      }, 500);
      const step = (now: number) => {
        const t = Math.min((now - start) / DUR, 1);
        span.textContent = `LPD ${Math.round(from + (target - from) * t)}`;
        if (t < 1) raf = requestAnimationFrame(step);
        else clearTimeout(force);
      };
      raf = requestAnimationFrame(step);
    }
  }

  showPaymentToast(text: string, type: "paying" | "receiving") {
    const container = this.paymentToast;
    // Cap the stack at 4 — drop the oldest (last in column-reverse DOM order).
    while (container.children.length >= 4) {
      container.firstChild?.remove();
    }
    const toast = document.createElement("div");
    toast.className = `payment-toast ${type}`;
    toast.textContent = type === "paying" ? `↑ ${text}` : `↓ ${text}`;
    container.appendChild(toast);
    // Fade in on the next frame so the CSS transition fires.
    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 350);
    }, 3000);
  }

  // -------------------------------------------------------------------------
  // Feature 1: Player inspector
  // -------------------------------------------------------------------------
  private buildPlayerInspector() {
    const el = document.createElement("div");
    el.id = "playerInspector";
    el.className = "panel";
    hide(el);
    this.gameHud.appendChild(el);
    this.playerInspector = el;
  }

  private openInspector(playerId: string) {
    this.inspectedPlayerId = playerId;
    this.refreshInspector();
    show(this.playerInspector, "block");
  }

  private refreshInspector() {
    const state = this.lastState;
    const playerId = this.inspectedPlayerId;
    const el = this.playerInspector;
    el.innerHTML = "";
    if (!state || !playerId) { hide(el); return; }

    const player = state.players.find(p => p.id === playerId);
    if (!player) { hide(el); return; }

    const board = getBoard(state.boardId);
    const worth = netWorth(state, playerId);

    // Header
    const hdr = document.createElement("div");
    hdr.className = "pi-header";
    const dot = player.color ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${player.color};margin-right:6px;"></span>` : "";
    const titleEl = document.createElement("div");
    titleEl.className = "pi-title";
    titleEl.innerHTML = `${dot}${player.name}${player.isBot ? " (Bot)" : ""}`;
    const closeBtn = document.createElement("button");
    closeBtn.className = "pi-close";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => { hide(el); this.inspectedPlayerId = null; });
    hdr.appendChild(titleEl);
    hdr.appendChild(closeBtn);
    el.appendChild(hdr);

    // Stats
    const cashEl = document.createElement("div");
    cashEl.className = "pi-stat";
    cashEl.textContent = `${t("inspector.cash")} ${player.money} LPD`;
    el.appendChild(cashEl);

    const worthEl = document.createElement("div");
    worthEl.className = "pi-worth";
    worthEl.textContent = `${t("inspector.netWorth")} ${worth} LPD`;
    el.appendChild(worthEl);

    // Properties grouped by colour
    const ownedPositions = Object.entries(state.ownership)
      .filter(([, ownerId]) => ownerId === playerId)
      .map(([pos]) => Number(pos))
      .sort((a, b) => a - b);

    const propsTitle = document.createElement("div");
    propsTitle.style.cssText = "font-size:12px;color:#aaa;margin-top:8px;margin-bottom:4px;";
    propsTitle.textContent = t("inspector.properties");
    el.appendChild(propsTitle);

    if (ownedPositions.length === 0) {
      const none = document.createElement("div");
      none.className = "pi-stat";
      none.textContent = t("inspector.none");
      el.appendChild(none);
    } else {
      // Group by colour group
      const groups = new Map<string, number[]>();
      for (const pos of ownedPositions) {
        const tile = board.tiles[pos];
        const group = (tile as { group?: string }).group ?? "other";
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group)!.push(pos);
      }
      for (const [group, positions] of groups) {
        const grpEl = document.createElement("div");
        grpEl.className = "pi-group";
        const grpTitle = document.createElement("div");
        grpTitle.className = "pi-group-title";
        const grpColor = this.groupCssColor(group);
        grpTitle.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${grpColor};margin-right:4px;"></span>${group}`;
        grpEl.appendChild(grpTitle);
        for (const pos of positions) {
          const tile = board.tiles[pos];
          if (!tile) continue;
          const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
          const isMortgaged = !!state.mortgaged[pos];
          let bStr = "";
          if (b.hotel) bStr = ` [${t("deed.hotel")}]`;
          else if (b.factory) bStr = ` [${t("deed.factory")}]`;
          else if (b.houses > 0) bStr = ` [${b.houses}H]`;
          const mortgStr = isMortgaged ? ` ${t("inspector.mortgaged")}` : "";
          const propEl = document.createElement("div");
          propEl.className = "pi-prop";
          propEl.textContent = `${tile.name}${bStr}${mortgStr}`;
          grpEl.appendChild(propEl);
        }
        el.appendChild(grpEl);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Feature 4: Surrender confirm (non-modal inline)
  // -------------------------------------------------------------------------
  private showSurrenderConfirm() {
    if (this.surrenderConfirmEl) return; // already shown
    const el = document.createElement("div");
    el.className = "confirm-overlay";
    // Position near surrender button
    el.style.cssText += "right:16px;top:80px;";
    el.innerHTML = `<div class="co-msg">${t("game.surrenderConfirm")}</div>`;
    const btns = document.createElement("div");
    btns.className = "co-btns";
    const yesBtn = document.createElement("button");
    yesBtn.style.background = "#991b1b";
    yesBtn.textContent = t("game.surrenderYes");
    yesBtn.addEventListener("click", () => {
      this.net.send({ t: "command", command: { type: "SURRENDER" } });
      this.closeSurrenderConfirm();
    });
    const noBtn = document.createElement("button");
    noBtn.style.background = "#555";
    noBtn.textContent = t("game.surrenderNo");
    noBtn.addEventListener("click", () => this.closeSurrenderConfirm());
    btns.appendChild(yesBtn);
    btns.appendChild(noBtn);
    el.appendChild(btns);
    this.gameHud.appendChild(el);
    this.surrenderConfirmEl = el;
  }

  private closeSurrenderConfirm() {
    if (this.surrenderConfirmEl) {
      this.surrenderConfirmEl.remove();
      this.surrenderConfirmEl = null;
    }
  }

  // -------------------------------------------------------------------------
  // Feature 4: Leave confirm (non-modal inline)
  // -------------------------------------------------------------------------
  private showLeaveConfirm(anchor: HTMLElement) {
    if (this.leaveConfirmEl) {
      this.leaveConfirmEl.remove();
      this.leaveConfirmEl = null;
      return;
    }
    const el = document.createElement("div");
    el.className = "confirm-overlay";
    el.style.cssText += "right:16px;top:80px;min-width:220px;";
    el.innerHTML = `<div class="co-msg">${t("game.leaveConfirm")}</div>`;
    const btns = document.createElement("div");
    btns.className = "co-btns";
    const yesBtn = document.createElement("button");
    yesBtn.style.background = "#991b1b";
    yesBtn.textContent = t("game.leaveYes");
    yesBtn.addEventListener("click", () => {
      clearSession();
      this.net.send({ t: "leaveRoom" });
      audio.stopBgm();
      audio.startBgm("lobby");
      this.leaveConfirmEl?.remove();
      this.leaveConfirmEl = null;
      this.showLobbyPanel();
    });
    const noBtn = document.createElement("button");
    noBtn.style.background = "#555";
    noBtn.textContent = t("game.leaveNo");
    noBtn.addEventListener("click", () => {
      this.leaveConfirmEl?.remove();
      this.leaveConfirmEl = null;
    });
    btns.appendChild(yesBtn);
    btns.appendChild(noBtn);
    el.appendChild(btns);
    this.gameHud.appendChild(el);
    this.leaveConfirmEl = el;
    // Keep anchor reference (suppress TS unused warning)
    void anchor;
  }

  // -------------------------------------------------------------------------
  // Turn-timer countdown
  // -------------------------------------------------------------------------
  showTurnTimer(playerId: string, secondsLeft: number) {
    const el = this.turnTimerEl;
    if (!el) return;

    // Determine if it's the local player's timer
    const isMe = this.net.playerId !== null && playerId === this.net.playerId;

    el.textContent = `⏱ ${secondsLeft}s`;
    el.style.display = "inline-block";
    el.classList.toggle("urgent", secondsLeft <= 10 && isMe);

    // Auto-hide 2 s after timer would expire (server stops sending at 0)
    if (this.turnTimerHideTimer) clearTimeout(this.turnTimerHideTimer);
    this.turnTimerHideTimer = setTimeout(() => {
      if (el) el.style.display = "none";
      this.turnTimerHideTimer = null;
    }, (secondsLeft + 2) * 1000);
  }

  private hideTurnTimer() {
    if (this.turnTimerEl) this.turnTimerEl.style.display = "none";
    if (this.turnTimerHideTimer) { clearTimeout(this.turnTimerHideTimer); this.turnTimerHideTimer = null; }
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

    const colorHex: Record<string, string> = {
      red: "#ef4444", blue: "#3b82f6", green: "#22c55e",
      yellow: "#eab308", purple: "#a855f7", orange: "#f97316",
    };
    const figureNames = ["Car 1", "Car 2", "Car 3", "Car 4", "Car 5", "Police"];

    // Colour is assigned by the server (bug 2): read it from this player's seat.
    const me = room.players.find((p) => p.id === this.net.playerId);
    if (me?.color) this.myColor = me.color;
    if (me?.figureIndex !== undefined) this.myFigureIndex = me.figureIndex;
    const myHex = colorHex[this.myColor] ?? this.myColor;

    const title = document.createElement("div");
    title.className = "fp-title";
    title.textContent = t("room.figureTitle");
    container.appendChild(title);

    // Assigned-colour row (read-only).
    const colorRow = document.createElement("div");
    colorRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:8px;";
    const dot = document.createElement("span");
    dot.style.cssText = `display:inline-block;width:18px;height:18px;border-radius:50%;background:${myHex};border:2px solid rgba(255,255,255,0.3);`;
    const colorTxt = document.createElement("span");
    colorTxt.style.cssText = "font-size:11px;color:#ccc;";
    colorTxt.textContent = `${t("room.colorAssigned")} ${this.myColor}`;
    colorRow.appendChild(dot);
    colorRow.appendChild(colorTxt);
    container.appendChild(colorRow);

    // 3D vehicle preview canvas (bug 2): the selected model, tinted, auto-rotating.
    const canvas = document.createElement("canvas");
    canvas.width = 220; canvas.height = 150;
    canvas.style.cssText = "width:100%;max-width:220px;height:150px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);display:block;margin-bottom:8px;background:#12121e;";
    container.appendChild(canvas);

    if (this.figurePreview) this.figurePreview.dispose();
    this.figurePreview = new FigurePreview(canvas);
    void this.figurePreview.show(this.myFigureIndex, myHex);

    // Vehicle buttons. Selecting one updates the live 3D preview + highlight in
    // place — no engine teardown (which would churn WebGL contexts).
    const grid = document.createElement("div");
    grid.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;";
    const btns: HTMLButtonElement[] = [];
    const restyle = () => {
      btns.forEach((b, fi) => {
        const sel = this.myFigureIndex === fi;
        b.style.borderColor = sel ? "#facc15" : "rgba(255,255,255,0.15)";
        b.style.background = sel ? myHex + "33" : "rgba(255,255,255,0.05)";
      });
    };
    for (let fi = 0; fi < FIGURE_COUNT; fi++) {
      const btn = document.createElement("button");
      btn.textContent = figureNames[fi] ?? String(fi + 1);
      btn.style.cssText = "padding:6px 10px;font-size:12px;border-radius:6px;cursor:pointer;border:2px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#eee;";
      btn.addEventListener("click", () => {
        if (this.myFigureIndex === fi) return;
        this.myFigureIndex = fi;
        this.net.send({ t: "chooseFigure", color: this.myColor, figureIndex: fi });
        void this.figurePreview?.show(fi, myHex);
        restyle();
      });
      btns.push(btn);
      grid.appendChild(btn);
    }
    restyle();
    container.appendChild(grid);
  }

  /** Dispose the lobby 3D vehicle preview engine (when leaving the room / game starts). */
  private disposeFigurePreview() {
    if (this.figurePreview) { this.figurePreview.dispose(); this.figurePreview = null; }
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
    this.disposeFigurePreview();
    show(this.lobby);
    hide(this.roomPanel);
    hide(this.gameHud);
    hide(this.spectatorBanner);
    if (this.helpOverlay) hide(this.helpOverlay);
    if (this.settingsOverlay) hide(this.settingsOverlay);
    if (this.deedCardPopup) hide(this.deedCardPopup);
    if (this.specialEventToast) hide(this.specialEventToast);
    if (this.actionCardPopup) hide(this.actionCardPopup);
    if (this.buyOfferPanel) hide(this.buyOfferPanel);
    if (this.myPropsPanel) hide(this.myPropsPanel);
    if (this.travelPanel) hide(this.travelPanel);
    if (this.tradePanel) hide(this.tradePanel);
    if (this.incomingSwapPanel) hide(this.incomingSwapPanel);
    if (this.gameOverBanner) hide(this.gameOverBanner);
    if (this.playerInspector) hide(this.playerInspector);
    this.closeSurrenderConfirm();
    this.leaveConfirmEl?.remove(); this.leaveConfirmEl = null;
    this.hideTurnTimer();
    this.lastState = null;
    this.wasMyTurn = false;
    this.inspectedPlayerId = null;
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
      header.textContent = t("lobby.openRooms");
      this.roomList.appendChild(header);

      for (const room of rooms) {
        if (room.started) continue;
        const item = document.createElement("div");
        item.className = "room-item";
        item.innerHTML = `<strong>${room.name}</strong> <span style="color:#aaa;font-size:12px;">(${room.playerCount} ${t("lobby.players")})</span>`;
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
    this.roomInfo.textContent = t("room.waiting");
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
    this.currentRoomSettings = room.settings ?? {};
    this.currentIsHost = this.net.playerId === room.host;
    if (this.currentRoomId) this.updateRoomLink(this.currentRoomId);
    hide(this.lobby);
    show(this.roomPanel);
    hide(this.gameHud);

    this.roomInfo.innerHTML = `
      <div><strong>${room.name}</strong></div>
      <div style="margin-top:4px;color:#aaa;">${t("room.board")}: ${room.boardId} | ${t("room.bots")}: ${room.botCount}</div>
    `;

    // Player list with ready indicators (feature 3)
    const rpList = document.getElementById("roomPlayerList");
    if (rpList) {
      rpList.innerHTML = `<div style="font-size:12px;color:#aaa;margin-bottom:4px;">${t("room.players")}:</div>`;
      for (const p of room.players) {
        if (p.isBot) continue;
        const row = document.createElement("div");
        row.className = "rp-player-row";
        const dot = document.createElement("span");
        dot.className = `rp-ready-dot ${p.ready ? "ready" : "not-ready"}`;
        dot.title = p.ready ? t("room.readyStatus") : t("room.notReadyStatus");
        const nameEl = document.createElement("span");
        nameEl.textContent = p.nickname + (p.id === room.host ? " ★" : "");
        const readyLabel = document.createElement("span");
        readyLabel.style.cssText = "font-size:11px;color:" + (p.ready ? "#22c55e" : "#9ca3af") + ";margin-left:auto;";
        readyLabel.textContent = p.ready ? t("room.readyStatus") : t("room.notReadyStatus");
        row.appendChild(dot);
        row.appendChild(nameEl);
        row.appendChild(readyLabel);
        rpList.appendChild(row);
      }
    }

    // Ready toggle (feature 3) — only for local human player
    const readyRow = document.getElementById("roomReadyRow");
    if (readyRow) {
      readyRow.innerHTML = "";
      const meInRoom = room.players.find(p => p.id === this.net.playerId && !p.isBot);
      if (meInRoom) {
        this.myReady = meInRoom.ready;
        const readyBtn = document.createElement("button");
        readyBtn.id = "readyToggleBtn";
        readyBtn.style.cssText = "width:100%;background:" + (this.myReady ? "#16a34a" : "#6b7280") + ";";
        readyBtn.textContent = this.myReady ? t("room.readyToggle.ready") : t("room.readyToggle.notReady");
        readyBtn.addEventListener("click", () => {
          this.myReady = !this.myReady;
          this.net.send({ t: "setReady", ready: this.myReady });
          readyBtn.textContent = this.myReady ? t("room.readyToggle.ready") : t("room.readyToggle.notReady");
          readyBtn.style.background = this.myReady ? "#16a34a" : "#6b7280";
        });
        readyRow.appendChild(readyBtn);
      }
    }

    // Show start button only if we're the host; disable if canStart is false
    if (this.currentIsHost) {
      show(this.startGameBtn, "block");
      const canStart = room.canStart;
      this.startGameBtn.disabled = !canStart;
      if (!canStart) {
        const humanCount = room.players.filter(p => !p.isBot).length;
        const totalPlayers = humanCount + room.botCount;
        this.startGameBtn.title = totalPlayers < 2 ? t("tooltip.minPlayers") : t("room.waiting");
      } else {
        this.startGameBtn.title = "";
      }
    } else {
      hide(this.startGameBtn);
    }

    // Game settings panel (feature 6)
    this.buildRoomSettingsPanel(room);

    // Figure/colour picker
    const pickerContainer = document.getElementById("figurePicker");
    if (pickerContainer) this.buildFigurePicker(pickerContainer, room);
  }

  private buildRoomSettingsPanel(room: RoomView) {
    const container = document.getElementById("roomSettingsPanel");
    if (!container) return;
    container.innerHTML = "";

    const isHost = this.net.playerId === room.host;
    const settings = room.settings ?? {};

    const panel = document.createElement("div");
    panel.id = "roomSettingsPanelInner";
    const titleEl = document.createElement("div");
    titleEl.className = "rs-title";
    titleEl.textContent = t("settings.game.title");
    panel.appendChild(titleEl);

    const multOptions = [
      { value: "0.5", label: t("settings.game.halfX") },
      { value: "1", label: t("settings.game.oneX") },
      { value: "2", label: t("settings.game.twoX") },
    ];
    const diffOptions = [
      { value: "easy", label: t("settings.game.easy") },
      { value: "normal", label: t("settings.game.normal") },
      { value: "hard", label: t("settings.game.hard") },
    ];

    const addSetting = (labelKey: string, id: string, options: { value: string; label: string }[], currentVal: string, onChange: (v: string) => void) => {
      const lbl = document.createElement("label");
      lbl.htmlFor = id;
      lbl.textContent = t(labelKey);
      panel.appendChild(lbl);

      if (isHost) {
        const sel = document.createElement("select");
        sel.id = id;
        for (const opt of options) {
          const o = document.createElement("option");
          o.value = opt.value;
          o.textContent = opt.label;
          if (opt.value === currentVal) o.selected = true;
          sel.appendChild(o);
        }
        sel.addEventListener("change", () => onChange(sel.value));
        panel.appendChild(sel);
      } else {
        const readonlyEl = document.createElement("div");
        readonlyEl.className = "rs-readonly";
        const found = options.find(o => o.value === currentVal);
        readonlyEl.textContent = found?.label ?? currentVal;
        panel.appendChild(readonlyEl);
      }
    };

    const curCap = String(settings.startingCapitalMult ?? 1);
    addSetting("settings.game.startCap", "rsStartCap", multOptions, curCap, (v) => {
      this.net.send({ t: "setGameSettings", settings: { ...this.currentRoomSettings, startingCapitalMult: parseFloat(v) } });
      this.currentRoomSettings = { ...this.currentRoomSettings, startingCapitalMult: parseFloat(v) };
    });

    const curBuild = String(settings.buildingCostMult ?? 1);
    addSetting("settings.game.buildCost", "rsBuildCost", multOptions, curBuild, (v) => {
      this.net.send({ t: "setGameSettings", settings: { ...this.currentRoomSettings, buildingCostMult: parseFloat(v) } });
      this.currentRoomSettings = { ...this.currentRoomSettings, buildingCostMult: parseFloat(v) };
    });

    const curDiff = settings.botDifficulty ?? "normal";
    addSetting("settings.game.botDiff", "rsBotDiff", diffOptions, curDiff, (v) => {
      this.net.send({ t: "setGameSettings", settings: { ...this.currentRoomSettings, botDifficulty: v as "easy" | "normal" | "hard" } });
      this.currentRoomSettings = { ...this.currentRoomSettings, botDifficulty: v as "easy" | "normal" | "hard" };
    });

    if (!isHost) {
      const note = document.createElement("div");
      note.className = "rs-readonly";
      note.textContent = t("settings.game.readonly");
      note.style.marginTop = "8px";
      panel.appendChild(note);
    }

    container.appendChild(panel);
  }

  updateGame(state: GameState, events: FormattedEvent[], myId: string | null) {
    this.lastState = state;
    this.disposeFigurePreview(); // free the lobby 3D vehicle preview once in-game
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
        ? (state.phase === "turn-end" ? t("turn.end") : t("turn.mine"))
        : `${currentPlayer?.name ?? "?"} ${t("turn.other")}`;
      this.headerTurnStatus.textContent = turnText;
      this.headerRound.textContent = `${t("turn.round")} ${state.round}`;

      // Special event label in header
      if (state.activeEvents.length > 0) {
        this.headerEvent.textContent = state.activeEvents
          .map((e) => t(`event.${e.id}`) || e.id)
          .join(" · ");
      } else {
        this.headerEvent.textContent = '';
      }
    }

    // Update player list with net worth ranking (feature 2)
    this.playerList.innerHTML = "";
    // Compute net worth for alive players and assign ranks
    const alivePlayers = state.players.filter(p => p.alive);
    const worthMap = new Map<string, number>();
    for (const p of alivePlayers) {
      worthMap.set(p.id, netWorth(state, p.id));
    }
    const sortedByWorth = [...alivePlayers].sort((a, b) => (worthMap.get(b.id) ?? 0) - (worthMap.get(a.id) ?? 0));
    const rankMap = new Map<string, number>();
    sortedByWorth.forEach((p, i) => rankMap.set(p.id, i + 1));

    for (let i = 0; i < state.players.length; i++) {
      const p = state.players[i];
      if (!p) continue;
      const isCurrent = i === state.currentPlayerIndex;
      const row = document.createElement("div");
      row.className = "player-row" + (isCurrent ? " current-player" : "") + (!p.alive ? " dead" : "");

      const dot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`;
      const rollStr = p.lastRoll[0] > 0 ? ` [${p.lastRoll[0]}+${p.lastRoll[1]}]` : "";
      const jail = p.inJail ? t("player.jail") : "";
      const rank = rankMap.get(p.id);
      const rankBadge = rank === 1 ? `<span class="nw-rank">#1</span>` : (rank ? `<span class="nw-worth">#${rank}</span>` : "");
      const worth = worthMap.get(p.id);
      const worthStr = worth !== undefined ? `<span class="nw-worth">${worth} NW</span>` : "";
      // Note: chip-stack icons deliberately omitted here (sidebar is cleaner
      // without them). LPD amount + net-worth badge remain.
      // Cash on its own line below (bug 3): "LPD <money>" sits next to the amount,
      // not glued to the "NW" net-worth badge above it.
      row.innerHTML = `${dot}<strong>${p.name}</strong>${p.isBot ? " (Bot)" : ""}${jail}${rollStr}${rankBadge}${worthStr}${this.renderDeedStrip(state, p.id)}<span class="money-val" data-pid="${p.id}" style="display:block;color:#aaa;font-size:11px;margin-top:2px;">LPD ${p.money}</span>`;

      // Feature 1: clicking row opens inspector
      row.addEventListener("click", () => {
        if (this.inspectedPlayerId === p.id && this.playerInspector.style.display !== "none") {
          hide(this.playerInspector);
          this.inspectedPlayerId = null;
        } else {
          this.openInspector(p.id);
        }
      });
      this.playerList.appendChild(row);
    }

    // Animate changed cash values (count-up tween on the fresh spans).
    this.animateMoneyValues(state);

    // Refresh inspector if open
    if (this.inspectedPlayerId && this.playerInspector.style.display !== "none") {
      this.refreshInspector();
    }

    // Bug 11: keep the open deed card in sync (e.g. after buying a house on it).
    if (this.deedCardPos !== null && this.deedCardPopup.style.display !== "none") {
      this.showDeedCard(this.deedCardPos);
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

    // Emit a local turn-change notification
    if (isMyTurn && !this.wasMyTurn && amAlive) {
      // It just became our turn — server already sends a nextTurn event to the
      // log, so we only show the toast here (skip the duplicate log inject).
      this.showToast(t("turn.mine.toast"));
    } else if (!isMyTurn && this.wasMyTurn) {
      // Our turn just ended — show whose turn it is now
      if (currentPlayer) {
        this.showToast(`${currentPlayer.name} ${t("turn.other")}`);
      }
    }
    this.wasMyTurn = isMyTurn && amAlive;

    // Show/hide action buttons
    const showRoll = isMyTurn && amAlive && state.phase === "awaiting-roll";
    const showCasino = isMyTurn && amAlive && state.phase === "awaiting-casino";
    const showBuy = isMyTurn && amAlive && state.phase === "awaiting-buy";
    const showRansom = isMyTurn && amAlive && state.phase === "awaiting-roll" && (me?.inJail ?? false);
    const showEndTurn = isMyTurn && amAlive && state.phase === "turn-end";

    // Surrender button (feature 4): show when alive in an active game
    if (amAlive && state.phase !== "finished") {
      show(this.surrenderBtn, "inline-block");
    } else {
      hide(this.surrenderBtn);
      this.closeSurrenderConfirm();
    }

    if (showRoll) { show(this.rollBtn, "inline-block"); this.rollBtn.disabled = false; }
    else { hide(this.rollBtn); this.rollBtn.disabled = true; }

    if (showCasino) { show(this.casinoRollBtn, "inline-block"); this.casinoRollBtn.disabled = false; }
    else { hide(this.casinoRollBtn); this.casinoRollBtn.disabled = true; }

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
      if (priceEl) priceEl.textContent = `${t("buy.price")} ${price} LPD`;
      if (balanceEl) balanceEl.textContent = `${t("buy.balance")} ${me?.money ?? 0} LPD`;
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

    // My-properties panel: always visible during the game (trading is always possible)
    if (myId && amAlive) {
      this.refreshMyPropsPanel(state, myId);
    } else if (myId && !amAlive && state.phase !== "finished") {
      // Spectator: still show panel (read-only) if they owned properties
      this.refreshMyPropsPanel(state, myId);
    } else {
      hide(this.myPropsPanel);
    }

    // Travel panel: only AFTER rolling and landing on a station (turn-end phase),
    // not at the start of the turn before the roll (bug 10).
    const showMgmt = isMyTurn && amAlive && state.phase === "turn-end" && !(me?.inJail ?? false);
    if (showMgmt && myId) {
      const travelDests = canTravelFrom(state, myId);
      if (travelDests.length > 0) {
        this.refreshTravelPanel(state, myId);
        show(this.travelPanel, "block");
      } else {
        hide(this.travelPanel);
      }
    } else {
      hide(this.travelPanel);
    }
    // Bug 13: the trade dialog stays open across turn changes — it is NOT hidden
    // here (and deliberately not rebuilt, so in-progress selections are kept).
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

  showGameOver(winnerName: string, _winnerId?: string) {
    const winnerEl = document.getElementById("gameOverWinner");
    if (winnerEl) winnerEl.textContent = `${t("gameover.winner")} ${winnerName}`;

    // Rematch button (feature 5): only host sees it
    const rematchBtn = document.getElementById("gameOverRematch") as HTMLButtonElement | null;
    const waitLabel = document.getElementById("gameOverWaitHost") as HTMLSpanElement | null;
    const isHost = this.currentIsHost || this.net.playerId === this.currentHostId;
    if (rematchBtn) rematchBtn.style.display = isHost ? "inline-block" : "none";
    if (waitLabel) waitLabel.style.display = isHost ? "none" : "inline";

    show(this.gameOverBanner, "flex");
    hide(this.surrenderBtn);
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

    const isMyTurn = state.players[state.currentPlayerIndex]?.id === myId;
    const amAlive = me?.alive ?? false;
    const canAct = isMyTurn && amAlive && (state.phase === "awaiting-roll" || state.phase === "turn-end") && !(me?.inJail ?? false);

    // Building cost multiplier from special event (buildingSale halves costs)
    // state.buildingCostMult is the base multiplier (from settings)
    // When buildingSale is active, the engine halves costs. We show the halved cost in the panel.
    const eventMult = state.activeEvents.some((e) => e.id === "buildingSale") ? 0.5 : 1.0;
    const costMult = (state.buildingCostMult ?? 1.0) * eventMult;

    // Header with capital + trade button
    const header = document.createElement("div");
    header.style.cssText = "display:flex;flex-direction:column;gap:4px;margin-bottom:8px;";
    const headerRow = document.createElement("div");
    headerRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;";
    headerRow.innerHTML = `<span style="font-size:13px;color:var(--gold);font-weight:bold;">${t("props.title")}</span>`;
    const tradeBtn = document.createElement("button");
    tradeBtn.className = "prop-btn";
    tradeBtn.textContent = t("props.trade");
    tradeBtn.addEventListener("click", () => {
      const panelVisible = this.tradePanel.style.display !== "none";
      if (panelVisible) {
        hide(this.tradePanel);
      } else {
        this.refreshTradePanel(state, myId);
        show(this.tradePanel, "block");
      }
    });
    headerRow.appendChild(tradeBtn);
    header.appendChild(headerRow);

    // Cash line
    const cashLine = document.createElement("div");
    cashLine.style.cssText = "font-size:12px;color:#86efac;";
    cashLine.textContent = `${t("props.capital")}: ${me?.money ?? 0} LPD`;
    header.appendChild(cashLine);

    // Builds-remaining indicator (per-turn build limit)
    const buildsLine = document.createElement("div");
    const exhausted = state.buildsPerTurn > 0 && state.buildsThisTurn >= state.buildsPerTurn;
    buildsLine.id = "buildsLeftLine";
    buildsLine.style.cssText = `font-size:11px;color:${exhausted ? "#f87171" : "#aaa"};`;
    const limitStr = state.buildsPerTurn === 0 ? "∞" : String(state.buildsPerTurn);
    buildsLine.textContent = `${t("props.builds")}: ${state.buildsThisTurn}/${limitStr}`;
    header.appendChild(buildsLine);

    // buildingSale indicator
    if (state.activeEvents.some((e) => e.id === "buildingSale")) {
      const saleLabel = document.createElement("div");
      saleLabel.style.cssText = "font-size:11px;color:#f97316;";
      saleLabel.textContent = t("props.buildingSaleActive");
      header.appendChild(saleLabel);
    }

    panel.appendChild(header);

    if (props.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.style.cssText = "font-size:12px;color:#666;";
      emptyMsg.textContent = "—";
      panel.appendChild(emptyMsg);
      show(panel, "block");
      return;
    }

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
      if (b.skyscraper) buildingStr = `[${t("deed.skyscraper")}]`;
      else if (b.hotel) buildingStr = `[${t("deed.hotel")}]`;
      else if (b.factory) buildingStr = `[${t("deed.factory")}]`;
      else if (b.houses > 0) buildingStr = `[${b.houses} ${b.houses > 1 ? t("deed.houses") : t("deed.house")}]`;
      else buildingStr = "—";

      const mortgageStr = isMortgaged ? ` <span style='color:#f87171;'>[${t("deed.mortgaged")}]</span>` : "";
      const noBuildStr = state.unbuildableFields?.includes(pos)
        ? ` <span title="${t("deed.unbuildable")}">⛔</span>`
        : "";

      row.innerHTML = `
        <div class="prop-name">${groupColor}${tile.name}${mortgageStr}${noBuildStr}</div>
        <div class="prop-detail">${t("deed.building")} ${buildingStr}</div>
      `;
      row.style.cursor = "pointer";
      row.addEventListener("click", () => this.showDeedCard(pos));

      // Buttons — greyed out (disabled) when not player's turn, not hidden
      const btnRow = document.createElement("div");
      btnRow.style.marginTop = "4px";
      const myMoney = me?.money ?? 0;

      const makeBtn = (label: string, cost: number | null, cls: string, onClick: () => void, forceDisabled = false): HTMLButtonElement => {
        const btn = document.createElement("button");
        btn.className = cls;
        btn.textContent = label;
        const unaffordable = cost !== null && cost > myMoney;
        if (forceDisabled || unaffordable || !canAct) {
          btn.disabled = true;
          btn.style.opacity = "0.4";
          if (unaffordable) btn.title = `Benötigt ${cost} LPD (du hast ${myMoney} LPD)`;
          else if (!canAct) btn.title = t("tooltip.onlyYourTurn");
        } else {
          // stopPropagation: the whole property row opens the deed card on
          // click — building/selling/mortgaging must NOT bubble into that.
          btn.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
        }
        return btn;
      };

      /** Disabled build button explaining WHY the build is blocked. */
      const makeBlockedBtn = (label: string, reasonKey: string): HTMLButtonElement => {
        const btn = document.createElement("button");
        btn.className = "prop-btn";
        btn.textContent = label;
        btn.disabled = true;
        btn.style.opacity = "0.4";
        btn.title = t(`buildBlock.${reasonKey}`);
        return btn;
      };

      // BUILD buttons (only for streets with whole-group ownership)
      if (tile.type === "street") {
        const st = tile as StreetTile;
        // Compute discounted costs (Math.round matches the engine's
        // buildingChargeCost rounding — was Math.floor, a cosmetic mismatch).
        const hCost = Math.round(st.houseCost * costMult);
        const htCost = Math.round(st.hotelCost * costMult);
        const fCost = Math.round(st.factoryCost * costMult);

        if (canBuild(state, pos, "house")) {
          btnRow.appendChild(makeBtn(
            `${t("prop.house")} (${hCost} LPD)`, hCost, "prop-btn",
            () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "house" } })
          ));
        } else {
          const reason = buildBlockReason(state, pos, "house");
          if (reason) btnRow.appendChild(makeBlockedBtn(`${t("prop.house")} (${hCost} LPD)`, reason));
        }
        if (canBuild(state, pos, "hotel")) {
          btnRow.appendChild(makeBtn(
            `${t("prop.hotel")} (${htCost} LPD)`, htCost, "prop-btn",
            () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "hotel" } })
          ));
        } else {
          const reason = buildBlockReason(state, pos, "hotel");
          if (reason) btnRow.appendChild(makeBlockedBtn(`${t("prop.hotel")} (${htCost} LPD)`, reason));
        }
        if (canBuild(state, pos, "factory")) {
          btnRow.appendChild(makeBtn(
            `${t("prop.factory")} (${fCost} LPD)`, fCost, "prop-btn",
            () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "factory" } })
          ));
        }
        if (canBuild(state, pos, "skyscraper")) {
          const skyMult = board.rules.skyscraper?.costMult ?? 2.0;
          const skCost = Math.round(st.hotelCost * skyMult * costMult);
          btnRow.appendChild(makeBtn(
            `${t("prop.skyscraper")} (${skCost} LPD)`, skCost, "prop-btn",
            () => this.net.send({ t: "command", command: { type: "BUILD", pos, building: "skyscraper" } })
          ));
        }
        if (canSellBuilding(state, pos)) {
          btnRow.appendChild(makeBtn(
            t("prop.sellBuilding"), null, "prop-btn danger",
            () => this.net.send({ t: "command", command: { type: "SELL_BUILDING", pos } })
          ));
        }
      }

      if (canMortgage(state, pos)) {
        const mv = mortgageValue(board, tile);
        btnRow.appendChild(makeBtn(
          `${t("prop.mortgage")} (+${mv})`, null, "prop-btn",
          () => this.net.send({ t: "command", command: { type: "MORTGAGE", pos } })
        ));
      }
      if (canUnmortgage(state, pos)) {
        const mv = mortgageValue(board, tile);
        const cost = Math.floor(mv * board.rules.mortgageUnmortgageMultiplier);
        btnRow.appendChild(makeBtn(
          `${t("prop.unmortgage")} (-${cost})`, cost, "prop-btn",
          () => this.net.send({ t: "command", command: { type: "UNMORTGAGE", pos } })
        ));
      }
      if (canSellProperty(state, pos)) {
        const refund = Math.floor(tilePrice(board, tile) / 2);
        btnRow.appendChild(makeBtn(
          `${t("prop.sell")} (+${refund})`, null, "prop-btn danger",
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
    title.style.cssText = "font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:8px;";
    title.textContent = t("travel.title");
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
        ? `${tile.name} (${ticketCost} LPD ${t("travel.ticket")})`
        : `${tile.name} (${t("travel.free")})`;
      btn.addEventListener("click", () => {
        this.net.send({ t: "command", command: { type: "TRAVEL", toPos: dest } });
        hide(panel);
      });
      panel.appendChild(btn);
    }

    const closeBtn = document.createElement("button");
    closeBtn.style.cssText = "display:block;width:100%;margin-top:8px;background:rgba(255,255,255,0.1);";
    closeBtn.textContent = t("travel.close");
    closeBtn.addEventListener("click", () => hide(panel));
    panel.appendChild(closeBtn);
  }

  private refreshTradePanel(state: GameState, myId: string, preselectTarget?: string) {
    const panel = this.tradePanel;
    panel.innerHTML = "";

    const board = getBoard(state.boardId);
    const alivePlayers = state.players.filter((p) => p.alive && p.id !== myId);

    const title = document.createElement("div");
    title.style.cssText = "font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:10px;";
    title.textContent = t("trade.title");
    panel.appendChild(title);

    // Target player selector
    const targetLabel = document.createElement("label");
    targetLabel.textContent = t("trade.offerTo");
    panel.appendChild(targetLabel);

    const targetSelect = document.createElement("select");
    for (const p of alivePlayers) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      targetSelect.appendChild(opt);
    }
    if (preselectTarget && alivePlayers.some((p) => p.id === preselectTarget)) {
      targetSelect.value = preselectTarget;
    }
    panel.appendChild(targetSelect);

    // My props to give (unbuilt, unmortgaged only)
    const myProps = ownedPropsOf(state, myId).filter((pos) => {
      const b = state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
      return !(b.houses > 0 || b.hotel || b.factory) && !state.mortgaged[pos];
    });

    const giveSection = document.createElement("div");
    giveSection.className = "swap-section";
    giveSection.innerHTML = `<div class="swap-label">${t("trade.give")}</div>`;

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
    giveMoneyLbl.textContent = t("trade.giveMoney");
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
    recvLbl.textContent = t("trade.receiveMoneyLabel");
    const recvUnit = document.createElement("span");
    recvUnit.textContent = " LPD";
    receiveMoneySection.innerHTML = `<div class="swap-label">${t("trade.receiveMoney")}</div>`;
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
      receiveSection.innerHTML = `<div class="swap-label">${t("trade.receive")} ${targetName}):</div>`;
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
    offerBtn.textContent = t("trade.offer");
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
    cancelBtn.style.cssText = "background:rgba(255,255,255,0.1);";
    cancelBtn.textContent = t("trade.cancel");
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
    title.style.cssText = "font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:8px;";
    title.textContent = `${t("swap.from")} ${from?.name ?? "?"}`;
    panel.appendChild(title);

    const giveNames = swap.give.props.map((pos) => board.tiles[pos]?.name ?? `Pos ${pos}`).join(", ") || "—";
    const recvNames = swap.receive.props.map((pos) => board.tiles[pos]?.name ?? `Pos ${pos}`).join(", ") || "—";

    const info = document.createElement("div");
    info.style.cssText = "font-size:12px;color:#ccc;margin-bottom:10px;";
    info.innerHTML = `
      <div><strong>${t("swap.give")}</strong> ${recvNames} + ${swap.receive.money} LPD</div>
      <div><strong>${t("swap.receive")}</strong> ${giveNames} + ${swap.give.money} LPD</div>
    `;
    panel.appendChild(info);

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:8px;";

    const acceptBtn = document.createElement("button");
    acceptBtn.textContent = t("swap.accept");
    acceptBtn.addEventListener("click", () => {
      this.net.send({ t: "command", command: { type: "RESPOND_SWAP", accept: true } });
      hide(panel);
    });

    const declineBtn = document.createElement("button");
    declineBtn.style.background = "#991b1b";
    declineBtn.textContent = t("swap.decline");
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
