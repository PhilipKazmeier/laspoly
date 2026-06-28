import { Net } from "./net.js";
import { Board3D } from "./board3d.js";
import { UI } from "./ui.js";

const net = new Net();
const board3d = new Board3D(document.getElementById("renderCanvas") as HTMLCanvasElement);
const ui = new UI(document.getElementById("ui") as HTMLDivElement, net);

net.onMessage((msg) => {
  switch (msg.t) {
    case "rooms": ui.showLobby(msg.rooms); break;
    case "joined": ui.onJoined(msg.roomId, msg.playerId); break;
    case "room": ui.showRoom(msg.room); break;
    case "state":
      board3d.update(msg.state, net.playerId);
      ui.updateGame(msg.state, msg.events, net.playerId);
      break;
    case "chat": ui.addChat(msg.from, msg.text); break;
    case "error": ui.showError(msg.message); break;
    case "gameOver": ui.showGameOver(msg.winnerName); break;
  }
});
