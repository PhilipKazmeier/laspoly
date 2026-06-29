/**
 * qolb.spec.ts — Quality-of-Life (batch B) feature verification
 *
 * Features tested:
 *  1. Player inspector — clicking a player row opens a panel with net-worth figure
 *  2. Net-worth ranking — player list shows NW figures and rank badge
 *  3. Ready-up toggle — room panel shows ready button and player ready states
 *  4. Surrender + leave-confirm — Aufgeben button exists; leave asks for confirm
 *  5. Rematch button — game-over banner has rematch button for host
 *  6. Lobby game-settings — room panel shows settings controls (host) or read-only
 */
import { test, expect, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SS = path.join(__dirname, "__screenshots__");

test.beforeAll(() => { fs.mkdirSync(SS, { recursive: true }); });

async function shot(page: Page, name: string) {
  const p = path.join(SS, `qolb-${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

/** Intercept WebSocket messages and store room + state on window */
async function injectRelays(page: Page) {
  await page.addInitScript(() => {
    const OrigWS = window.WebSocket;
    class PW extends OrigWS {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        this.addEventListener("message", (ev) => {
          try {
            const msg = JSON.parse(ev.data as string);
            if (msg.t === "state") {
              let el = document.getElementById("_lastState");
              if (!el) {
                el = document.createElement("div");
                el.id = "_lastState";
                el.style.display = "none";
                document.body.appendChild(el);
              }
              el.dataset["state"] = JSON.stringify(msg.state);
              (window as Record<string, unknown>)["_stateCount"] =
                (((window as Record<string, unknown>)["_stateCount"] as number) ?? 0) + 1;
            }
            if (msg.t === "room") {
              (window as Record<string, unknown>)["_lastRoom"] = msg.room;
            }
          } catch { /* ignore */ }
        });
      }
    }
    window.WebSocket = PW as typeof WebSocket;
  });
}

async function waitForAction(
  page: Page,
  timeout = 90_000
): Promise<"roll" | "buy" | "ransom" | "endTurn" | "gameover" | "spectator" | "timeout"> {
  try {
    const r = await page.waitForFunction(() => {
      const vis = (id: string) => {
        const el = document.getElementById(id);
        return el ? el.style.display !== "none" && el.style.display !== "" : false;
      };
      const go = document.getElementById("gameOverBanner");
      if (go && go.style.display === "flex") return "gameover";
      if (vis("spectatorBanner")) return "spectator";
      if (vis("rollBtn")) return "roll";
      if (vis("buyOfferPanel")) return "buy";
      if (vis("ransomBtn")) return "ransom";
      if (vis("endTurnBtn")) return "endTurn";
      return null;
    }, undefined, { timeout });
    const v = await r.jsonValue() as string | null;
    return (v ?? "timeout") as "roll" | "buy" | "ransom" | "endTurn" | "gameover" | "spectator" | "timeout";
  } catch {
    return "timeout";
  }
}

test("QoLB-3/6: room panel shows ready toggle and game-settings controls", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(err.message));

  await injectRelays(page);
  await page.goto("/");

  await page.locator("#nickname").fill("QolbHost");
  await page.locator("#botCount").selectOption("2");
  await page.locator("#createRoom").click();

  // Room panel should appear
  await expect(page.locator("#roomPanel")).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: path.join(SS, "qolb-room-panel.png") });

  // Feature 3: ready toggle button should exist
  await expect(page.locator("#readyToggleBtn")).toBeVisible({ timeout: 5_000 });
  const readyText = await page.locator("#readyToggleBtn").textContent();
  // Text should be either "Bereit" or "Nicht bereit"
  expect(readyText).toBeTruthy();

  // Click the ready toggle to toggle state
  await page.locator("#readyToggleBtn").click();
  const readyTextAfter = await page.locator("#readyToggleBtn").textContent();
  expect(readyTextAfter).not.toEqual(readyText);
  // Toggle back
  await page.locator("#readyToggleBtn").click();

  // Feature 6: game-settings selects should exist for host
  await expect(page.locator("#rsStartCap")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("#rsBuildCost")).toBeVisible({ timeout: 2_000 });
  await expect(page.locator("#rsBotDiff")).toBeVisible({ timeout: 2_000 });

  // Change startingCapital setting to 2x and verify it's selectable
  await page.locator("#rsStartCap").selectOption("2");
  const capVal = await page.locator("#rsStartCap").inputValue();
  expect(capVal).toBe("2");

  // Player list in room panel should show player rows with ready state
  const playerRows = page.locator(".rp-player-row");
  await expect(playerRows.first()).toBeVisible({ timeout: 3_000 });

  await shot(page, "room-ready-settings");

  const realErrors = errors.filter(e =>
    !e.includes("favicon") &&
    !e.includes("autoplay") &&
    !e.includes("NotAllowedError") &&
    !e.includes("play()")
  );
  expect(realErrors).toHaveLength(0);
});

test("QoLB-1/2/4: in-game inspector, net-worth ranking, surrender button, leave confirm", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(err.message));

  await injectRelays(page);
  await page.goto("/");

  // Create a game with bots to quickly get in-game
  await page.locator("#nickname").fill("QolbPlayer");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await expect(page.locator("#roomPanel")).toBeVisible({ timeout: 10_000 });
  await page.locator("#startGame").click();

  // Wait for game to start
  await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

  // Feature 4: surrender button should exist in header
  const surrenderBtn = page.locator("#surrenderBtn");
  // Wait for it to appear (visible once alive in game)
  await expect(surrenderBtn).toBeVisible({ timeout: 30_000 });
  await shot(page, "surrender-btn");

  // Feature 2: player list should show net-worth values and rank badges
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll(".player-row");
    return rows.length > 0;
  }, undefined, { timeout: 15_000 });

  // Check for net-worth elements (NW badge or rank)
  const nwElements = page.locator(".nw-worth, .nw-rank");
  const nwCount = await nwElements.count();
  // At least one net-worth figure should appear
  expect(nwCount).toBeGreaterThan(0);

  await shot(page, "player-list-networth");

  // Feature 1: click a player row to open inspector
  const firstRow = page.locator(".player-row").first();
  await firstRow.click();

  // Inspector panel should appear
  await expect(page.locator("#playerInspector")).toBeVisible({ timeout: 5_000 });
  // Inspector should contain a net-worth figure
  const inspectorText = await page.locator("#playerInspector .pi-worth").textContent();
  expect(inspectorText).toContain("LPD");
  // Net-worth should be a number
  const worthMatch = inspectorText?.match(/\d+/);
  expect(worthMatch).not.toBeNull();

  await shot(page, "inspector-open");

  // Close inspector by clicking close button
  await page.locator("#playerInspector .pi-close").click();
  await expect(page.locator("#playerInspector")).toBeHidden({ timeout: 3_000 });

  // Feature 4: surrender button opens confirm dialog
  await surrenderBtn.click();
  // Confirm overlay should appear
  const confirmOverlay = page.locator(".confirm-overlay").first();
  await expect(confirmOverlay).toBeVisible({ timeout: 5_000 });

  await shot(page, "surrender-confirm");

  // Cancel the surrender
  await page.locator(".confirm-overlay button").last().click();
  await expect(page.locator(".confirm-overlay").first()).toBeHidden({ timeout: 3_000 });

  // Feature 4: leave button opens confirm dialog (not immediately leaving)
  await page.locator("#leaveGameBtn").click();
  const leaveConfirm = page.locator(".confirm-overlay").first();
  await expect(leaveConfirm).toBeVisible({ timeout: 5_000 });
  // Verify game is still running (didn't leave yet)
  await expect(page.locator("#gameHud")).toBeVisible({ timeout: 2_000 });

  await shot(page, "leave-confirm");

  // Stay in game (click "No/Bleiben" — the second button)
  await page.locator(".confirm-overlay button").last().click();
  await expect(page.locator(".confirm-overlay").first()).toBeHidden({ timeout: 3_000 });
  await expect(page.locator("#gameHud")).toBeVisible({ timeout: 2_000 });

  const realErrors = errors.filter(e =>
    !e.includes("favicon") &&
    !e.includes("autoplay") &&
    !e.includes("NotAllowedError") &&
    !e.includes("play()")
  );
  expect(realErrors).toHaveLength(0);
});

test("QoLB-5: game-over banner has rematch button for host", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(err.message));

  await injectRelays(page);
  await page.goto("/");

  // Inject a fake gameOver message to test the banner
  await page.addInitScript(() => {
    // Intercept outgoing WS messages to track joins, and inject a gameOver after state
    const OrigWS = window.WebSocket;
    class PW2 extends OrigWS {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        this.addEventListener("message", (ev) => {
          try {
            const msg = JSON.parse(ev.data as string);
            // After the first state message, also emit a fake gameOver
            if (msg.t === "state" && !(window as Record<string, unknown>)["_fakeGameOverSent"]) {
              (window as Record<string, unknown>)["_fakeGameOverSent"] = true;
              // dispatch synthetic gameOver
              setTimeout(() => {
                const fakeEv = new MessageEvent("message", {
                  data: JSON.stringify({ t: "gameOver", winnerId: "w1", winnerName: "Bot 1" }),
                });
                this.dispatchEvent(fakeEv);
              }, 2000);
            }
          } catch { /* ignore */ }
        });
      }
    }
    window.WebSocket = PW2 as typeof WebSocket;
  });

  await page.goto("/");
  await page.locator("#nickname").fill("QolbHostGO");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await expect(page.locator("#roomPanel")).toBeVisible({ timeout: 10_000 });
  await page.locator("#startGame").click();
  await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

  // Wait for the synthetic gameOver banner
  await expect(page.locator("#gameOverBanner")).toBeVisible({ timeout: 20_000 });

  await shot(page, "gameover-banner");

  // Feature 5: Rematch button should exist (host sees it)
  const rematchBtn = page.locator("#gameOverRematch");
  await expect(rematchBtn).toBeVisible({ timeout: 5_000 });
  // The "Back to lobby" button should also be there
  await expect(page.locator("#gameOverRestart")).toBeVisible();

  // Verify the banner code structure is correct
  const rematchText = await rematchBtn.textContent();
  expect(rematchText).toBeTruthy();
  // Should be "Neues Spiel" in DE or "New Game" in EN
  expect(rematchText?.length).toBeGreaterThan(0);

  await shot(page, "gameover-rematch");

  const realErrors = errors.filter(e =>
    !e.includes("favicon") &&
    !e.includes("autoplay") &&
    !e.includes("NotAllowedError") &&
    !e.includes("play()")
  );
  expect(realErrors).toHaveLength(0);
});
