import { Net, loadSession, clearSession } from "./net.js";
import { Board3D } from "./board3d.js";
import { UI } from "./ui.js";

const net = new Net();
const board3d = new Board3D(document.getElementById("renderCanvas") as HTMLCanvasElement);
const ui = new UI(document.getElementById("ui") as HTMLDivElement, net, board3d);

// Track whether we are attempting a session resume (suppress initial lobby flash)
let resuming = false;

net.onMessage((msg) => {
  switch (msg.t) {
    case "rooms":
      if (!resuming) ui.showLobby(msg.rooms);
      break;
    case "joined":
      ui.onJoined(msg.roomId, msg.playerId);
      break;
    case "resumed":
      resuming = false;
      ui.onJoined(msg.roomId, msg.playerId);
      break;
    case "room":
      ui.showRoom(msg.room);
      break;
    case "state":
      board3d.handleEvents(msg.events);
      // Show action card popup if any actionCard* event in this batch
      for (const ev of msg.events) {
        if (ev.key.startsWith("actionCard")) {
          ui.showActionCard(ev.text);
          break;
        }
      }
      board3d.update(msg.state, net.playerId);
      ui.updateGame(msg.state, msg.events, net.playerId);
      break;
    case "chat":
      ui.addChat(msg.from, msg.text);
      break;
    case "error":
      if (resuming) {
        // Resume failed (room gone or bad token) — clear session and show lobby
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

// Attempt session resume on startup
const session = loadSession();
if (session) {
  resuming = true;
  net.send({ t: "resume", roomId: session.roomId, playerId: session.playerId, token: session.token });
}

// Expose clearSession for UI (leave room)
(window as Record<string, unknown>)["_clearSession"] = clearSession;
