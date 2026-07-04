import { describe, it, expect } from "vitest";
import { GameRoom, RoomManager } from "./room.js";
import { currentPlayer } from "@laspoly/shared";

// ---- Helpers ---------------------------------------------------------------

function makeStartedRoom() {
  const room = new GameRoom("Test", "vegas", 3);
  const aliceId = room.addHuman("Alice");
  const bobId = room.addHuman("Bob");
  room.start(42);
  return { room, aliceId, bobId };
}

// ---- validateCommand logic (extracted inline for unit testing) -------------

function validateCommand(cmd: unknown): string | null {
  function isStr(v: unknown): v is string { return typeof v === "string"; }
  function isFiniteInt(v: unknown): v is number {
    return typeof v === "number" && Number.isFinite(v) && Number.isInteger(v);
  }
  function isBool(v: unknown): v is boolean { return typeof v === "boolean"; }
  function isObj(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
  }
  function isArr(v: unknown): v is unknown[] { return Array.isArray(v); }

  if (!isObj(cmd)) return "command must be an object";
  const type = cmd["type"];
  if (!isStr(type)) return "command.type must be a string";

  switch (type) {
    case "ROLL_DICE": case "BUY_PROPERTY": case "DECLINE_PROPERTY": case "PAY_RANSOM": break;
    case "BUILD": {
      const pos = cmd["pos"]; const building = cmd["building"];
      if (!isFiniteInt(pos) || pos < 0 || pos > 39) return "BUILD.pos must be integer 0–39";
      if (!isStr(building) || !["house","hotel","factory"].includes(building))
        return "BUILD.building must be 'house', 'hotel', or 'factory'";
      break;
    }
    case "SELL_BUILDING": case "MORTGAGE": case "UNMORTGAGE": case "SELL_PROPERTY": {
      const pos = cmd["pos"];
      if (!isFiniteInt(pos) || pos < 0 || pos > 39) return `${type}.pos must be integer 0–39`;
      break;
    }
    case "TRAVEL": {
      const toPos = cmd["toPos"];
      if (!isFiniteInt(toPos) || toPos < 0 || toPos > 39) return "TRAVEL.toPos must be integer 0–39";
      break;
    }
    case "PROPOSE_SWAP": {
      const toId = cmd["toId"]; const give = cmd["give"]; const receive = cmd["receive"];
      if (!isStr(toId)) return "PROPOSE_SWAP.toId must be a string";
      if (!isObj(give)) return "PROPOSE_SWAP.give must be an object";
      if (!isObj(receive)) return "PROPOSE_SWAP.receive must be an object";
      if (!isFiniteInt(give["money"]) || (give["money"] as number) < 0)
        return "PROPOSE_SWAP.give.money must be a non-negative integer";
      if (!isFiniteInt(receive["money"]) || (receive["money"] as number) < 0)
        return "PROPOSE_SWAP.receive.money must be a non-negative integer";
      if (!isArr(give["props"]) || (give["props"] as unknown[]).length > 40)
        return "PROPOSE_SWAP.give.props must be an array (max 40 entries)";
      if (!isArr(receive["props"]) || (receive["props"] as unknown[]).length > 40)
        return "PROPOSE_SWAP.receive.props must be an array (max 40 entries)";
      for (const pos of give["props"] as unknown[]) {
        if (!isFiniteInt(pos) || (pos as number) < 0 || (pos as number) > 39)
          return "PROPOSE_SWAP.give.props entries must be integers 0–39";
      }
      for (const pos of receive["props"] as unknown[]) {
        if (!isFiniteInt(pos) || (pos as number) < 0 || (pos as number) > 39)
          return "PROPOSE_SWAP.receive.props entries must be integers 0–39";
      }
      break;
    }
    case "RESPOND_SWAP": {
      if (!isBool(cmd["accept"])) return "RESPOND_SWAP.accept must be a boolean";
      break;
    }
    default: return `unknown command type: ${String(type)}`;
  }
  return null;
}

// ---- Tests -----------------------------------------------------------------

describe("validateCommand", () => {
  it("accepts valid no-arg commands", () => {
    expect(validateCommand({ type: "ROLL_DICE" })).toBeNull();
    expect(validateCommand({ type: "BUY_PROPERTY" })).toBeNull();
    expect(validateCommand({ type: "DECLINE_PROPERTY" })).toBeNull();
    expect(validateCommand({ type: "PAY_RANSOM" })).toBeNull();
  });

  it("rejects non-object command", () => {
    expect(validateCommand(null)).not.toBeNull();
    expect(validateCommand("ROLL_DICE")).not.toBeNull();
    expect(validateCommand(42)).not.toBeNull();
    expect(validateCommand([])).not.toBeNull();
  });

  it("rejects command without type", () => {
    expect(validateCommand({})).not.toBeNull();
    expect(validateCommand({ type: 42 })).not.toBeNull();
  });

  it("rejects unknown command type", () => {
    expect(validateCommand({ type: "HACK_SERVER" })).not.toBeNull();
    expect(validateCommand({ type: "__proto__" })).not.toBeNull();
  });

  it("validates BUILD.pos range", () => {
    expect(validateCommand({ type: "BUILD", pos: 0, building: "house" })).toBeNull();
    expect(validateCommand({ type: "BUILD", pos: 39, building: "hotel" })).toBeNull();
    expect(validateCommand({ type: "BUILD", pos: -1, building: "house" })).not.toBeNull();
    expect(validateCommand({ type: "BUILD", pos: 40, building: "house" })).not.toBeNull();
    expect(validateCommand({ type: "BUILD", pos: 1.5, building: "house" })).not.toBeNull();
    expect(validateCommand({ type: "BUILD", pos: Infinity, building: "house" })).not.toBeNull();
    expect(validateCommand({ type: "BUILD", pos: NaN, building: "house" })).not.toBeNull();
  });

  it("validates BUILD.building enum", () => {
    expect(validateCommand({ type: "BUILD", pos: 1, building: "factory" })).toBeNull();
    expect(validateCommand({ type: "BUILD", pos: 1, building: "nuke" })).not.toBeNull();
    expect(validateCommand({ type: "BUILD", pos: 1, building: 42 })).not.toBeNull();
  });

  it("validates MORTGAGE/SELL_BUILDING/SELL_PROPERTY/UNMORTGAGE.pos range", () => {
    for (const type of ["MORTGAGE", "SELL_BUILDING", "SELL_PROPERTY", "UNMORTGAGE"] as const) {
      expect(validateCommand({ type, pos: 5 })).toBeNull();
      expect(validateCommand({ type, pos: -1 })).not.toBeNull();
      expect(validateCommand({ type, pos: 99 })).not.toBeNull();
      expect(validateCommand({ type, pos: "5" })).not.toBeNull();
    }
  });

  it("validates TRAVEL.toPos range", () => {
    expect(validateCommand({ type: "TRAVEL", toPos: 5 })).toBeNull();
    expect(validateCommand({ type: "TRAVEL", toPos: -1 })).not.toBeNull();
    expect(validateCommand({ type: "TRAVEL", toPos: 40 })).not.toBeNull();
  });

  it("validates PROPOSE_SWAP fields", () => {
    const valid = { type: "PROPOSE_SWAP", toId: "h2", give: { props: [], money: 0 }, receive: { props: [], money: 0 } };
    expect(validateCommand(valid)).toBeNull();
    expect(validateCommand({ ...valid, toId: 42 })).not.toBeNull();
    expect(validateCommand({ ...valid, give: { props: [], money: -1 } })).not.toBeNull();
    expect(validateCommand({ ...valid, receive: { props: [], money: -1 } })).not.toBeNull();
    expect(validateCommand({ ...valid, give: { props: [40], money: 0 } })).not.toBeNull();
    expect(validateCommand({ ...valid, give: { props: [-1], money: 0 } })).not.toBeNull();
    expect(validateCommand({ ...valid, give: { props: [1.5], money: 0 } })).not.toBeNull();
    expect(validateCommand({ ...valid, give: { props: "not-array", money: 0 } })).not.toBeNull();
    expect(validateCommand({ ...valid, give: { props: [], money: 1.5 } })).not.toBeNull();
  });

  it("validates RESPOND_SWAP.accept must be boolean", () => {
    expect(validateCommand({ type: "RESPOND_SWAP", accept: true })).toBeNull();
    expect(validateCommand({ type: "RESPOND_SWAP", accept: false })).toBeNull();
    expect(validateCommand({ type: "RESPOND_SWAP", accept: 1 })).not.toBeNull();
    expect(validateCommand({ type: "RESPOND_SWAP", accept: "true" })).not.toBeNull();
    expect(validateCommand({ type: "RESPOND_SWAP", accept: null })).not.toBeNull();
  });
});

describe("Authorization: player can only act for their own seat", () => {
  it("rejects command from wrong playerId", () => {
    const { room, aliceId, bobId } = makeStartedRoom();
    // Whoever is not current player should be rejected
    const cp = currentPlayer(room.state!);
    const notCurrentId = cp.id === aliceId ? bobId : aliceId;
    expect(() => room.applyHumanCommand(notCurrentId, { type: "ROLL_DICE" })).toThrow();
  });

  it("rejects completely fake playerId", () => {
    const { room } = makeStartedRoom();
    expect(() => room.applyHumanCommand("fake-player-id", { type: "ROLL_DICE" })).toThrow();
  });

  it("RESPOND_SWAP only from the swap target", () => {
    const { room, aliceId, bobId } = makeStartedRoom();
    // Find the current player and manually set up a pending swap in state
    const cp = currentPlayer(room.state!);
    const otherId = cp.id === aliceId ? bobId : aliceId;

    // Manually inject pending swap targeting otherId (not current player)
    room.state!.pendingSwap = {
      fromId: cp.id,
      toId: otherId,
      give: { props: [], money: 0 },
      receive: { props: [], money: 0 },
    };

    // Current player (fromId) should NOT be able to respond
    expect(() => room.applyHumanCommand(cp.id, { type: "RESPOND_SWAP", accept: true })).toThrow();

    // The actual target should be able to respond
    expect(() => room.applyHumanCommand(otherId, { type: "RESPOND_SWAP", accept: false })).not.toThrow();
  });
});

describe("Session tokens", () => {
  it("token is 32 hex chars (128 bits)", () => {
    const room = new GameRoom("T", "vegas", 1);
    const id = room.addHuman("Test");
    const token = room.getToken(id)!;
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it("wrong token rejected", () => {
    const room = new GameRoom("T", "vegas", 1);
    const id = room.addHuman("Test");
    expect(room.resumeHuman(id, "wrong")).toBeNull();
    expect(room.resumeHuman(id, "")).toBeNull();
    expect(room.resumeHuman("fakeid", room.getToken(id)!)).toBeNull();
  });

  it("correct token accepted", () => {
    const room = new GameRoom("T", "vegas", 1);
    const id = room.addHuman("Test");
    room.start(1);
    room.removeHuman(id); // mark disconnected
    expect(room.resumeHuman(id, room.getToken(id)!)).toBe("Test");
  });

  it("token not present in broadcast GameState", () => {
    const { room } = makeStartedRoom();
    const stateJson = JSON.stringify(room.state);
    // tokens are 32-char hex strings; make sure none appear in the game state
    expect(stateJson).not.toMatch(/[0-9a-f]{32}/);
  });

  it("toView does not include tokens", () => {
    const room = new GameRoom("T", "vegas", 2);
    room.addHuman("Alice");
    room.addHuman("Bob");
    const view = room.toView();
    const viewJson = JSON.stringify(view);
    expect(viewJson).not.toMatch(/token/i);
    expect(viewJson).not.toMatch(/[0-9a-f]{32}/);
  });
});

describe("Room limits", () => {
  it("RoomManager can store and retrieve rooms", () => {
    const mgr = new RoomManager();
    const r = mgr.create("Test", "vegas", 2);
    expect(mgr.get(r.id)).toBe(r);
    mgr.delete(r.id);
    expect(mgr.get(r.id)).toBeUndefined();
  });

  it("addHuman respects seat filling", () => {
    const room = new GameRoom("T", "vegas", 5);
    for (let i = 0; i < 6; i++) room.addHuman(`Player${i}`);
    room.start(1);
    // 6 humans, 5 bots requested but capped at 6 total
    expect(room.state!.players.length).toBeLessThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// Private rooms (password)
// ---------------------------------------------------------------------------

describe("private rooms", () => {
  it("summary exposes hasPassword but never the password itself", () => {
    const pub = new GameRoom("Public", "vegas", 1);
    const priv = new GameRoom("Private", "vegas", 1, "geheim");
    expect(pub.toSummary().hasPassword).toBe(false);
    expect(priv.toSummary().hasPassword).toBe(true);
    expect(JSON.stringify(priv.toSummary())).not.toContain("geheim");
    priv.addHuman("Host");
    expect(JSON.stringify(priv.toView())).not.toContain("geheim");
  });

  it("password stored on the room; resume token remains independent", () => {
    const room = new GameRoom("P", "vegas", 1, "pw123");
    const pid = room.addHuman("Alice");
    const token = room.getToken(pid);
    expect(room.password).toBe("pw123");
    expect(token).toBeTruthy();
    expect(token).not.toBe("pw123");
    // Resume path validates the token, not the password.
    expect(room.resumeHuman(pid, token!)).toBe("Alice"); // returns the nickname on success
  });
});

// ---------------------------------------------------------------------------
// Custom token images
// ---------------------------------------------------------------------------

import { validateTokenImage, MAX_TOKEN_IMAGE_CHARS } from "./room.js";
import { CUSTOM_FIGURE_INDEX } from "@laspoly/shared";

describe("custom token images", () => {
  // 1×1 red pixel PNG / JPEG headers for magic-byte checks.
  const PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const validPng = `data:image/png;base64,${PNG_B64}`;

  it("accepts a valid PNG data URL", () => {
    expect(validateTokenImage(validPng)).toBeNull();
  });

  it("rejects SVG, mislabelled payloads, oversized and garbage input", () => {
    expect(validateTokenImage(`data:image/svg+xml;base64,${PNG_B64}`)).toMatch(/PNG or JPEG/);
    // JPEG label with PNG payload → magic-byte mismatch.
    expect(validateTokenImage(`data:image/jpeg;base64,${PNG_B64}`)).toMatch(/not a JPEG/);
    expect(validateTokenImage("data:image/png;base64," + "A".repeat(MAX_TOKEN_IMAGE_CHARS + 10))).toMatch(/too large/);
    expect(validateTokenImage(42)).toMatch(/string/);
    expect(validateTokenImage("hello")).toMatch(/PNG or JPEG/);
  });

  it("chooseFigure with CUSTOM_FIGURE_INDEX requires an uploaded image; standees may repeat", () => {
    const room = new GameRoom("Std", "vegas", 0);
    const a = room.addHuman("Alice");
    const b = room.addHuman("Bob");
    const pa = room.players.find((p) => p.id === a)!;
    const pb = room.players.find((p) => p.id === b)!;

    expect(room.chooseFigure(a, pa.color, CUSTOM_FIGURE_INDEX, 0)).toMatch(/Upload/);
    expect(room.setCustomImage(a, validPng)).toBeNull();
    expect(room.chooseFigure(a, pa.color, CUSTOM_FIGURE_INDEX, 0)).toBeNull();
    // Second player with their own image can ALSO pick the standee.
    expect(room.setCustomImage(b, validPng)).toBeNull();
    expect(room.chooseFigure(b, pb.color, CUSTOM_FIGURE_INDEX, 0)).toBeNull();
    // toView carries the image; toSummary never does.
    expect(room.toView().players.find((p) => p.id === a)?.customImage).toBe(validPng);
    expect(JSON.stringify(room.toSummary())).not.toContain("base64");
  });
});
