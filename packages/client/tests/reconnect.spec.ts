/**
 * Tests for Fix 1 (create room with non-3 bot count) and Fix 3 (session resume).
 */
import { test, expect, type Page } from "@playwright/test";

async function injectStateRelay(page: Page) {
  await page.addInitScript(() => {
    const OrigWS = window.WebSocket;
    class PatchedWS extends OrigWS {
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
            }
            if (msg.t === "joined") {
              (window as Record<string, unknown>)["_joinedMsg"] = msg;
            }
            if (msg.t === "resumed") {
              (window as Record<string, unknown>)["_resumedMsg"] = msg;
            }
            if (msg.t === "error") {
              const errs = ((window as Record<string, unknown>)["_serverErrors"] as string[] | undefined) ?? [];
              errs.push((msg as { message: string }).message);
              (window as Record<string, unknown>)["_serverErrors"] = errs;
            }
          } catch {
            /* ignore */
          }
        });
      }
    }
    window.WebSocket = PatchedWS as typeof WebSocket;
  });
}

test("Fix 1 — create room with 1 bot (not 3) and start successfully", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("console", msg => { if (msg.type() === "error" && !msg.text().includes("favicon")) errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(err.message));

  await injectStateRelay(page);
  await page.goto("/");

  await page.locator("#nickname").fill("OneBotPlayer");
  // Select 1 bot (not the default 3)
  await page.locator("#botCount").selectOption("1");
  await page.locator("#createRoom").click();

  // Should enter room panel as host
  await expect(page.locator("#roomPanel")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#startGame")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("#startGame")).toBeEnabled({ timeout: 5_000 });

  // Start the game
  await page.locator("#startGame").click();

  // Game HUD should appear (1 human + 1 bot = 2 players)
  await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

  // Should have exactly 2 player rows
  await page.waitForFunction(
    () => document.querySelectorAll(".player-row").length >= 2,
    undefined,
    { timeout: 20_000 },
  );
  await expect(page.locator(".player-row")).toHaveCount(2);

  // Wait for first action (roll or buy or ransom)
  try {
    await page.waitForFunction(
      () => {
        const visible = (id: string) => {
          const el = document.getElementById(id);
          return el ? el.style.display !== "none" && el.style.display !== "" : false;
        };
        const govEl = document.getElementById("gameOverBanner");
        if (govEl && govEl.style.display === "flex") return true;
        return visible("rollBtn") || visible("buyOfferPanel") || visible("ransomBtn") || visible("spectatorBanner");
      },
      undefined,
      { timeout: 40_000 },
    );
  } catch {
    // Timeout — still acceptable if game is running
  }

  const serverErrors = await page.evaluate(
    () => ((window as Record<string, unknown>)["_serverErrors"] ?? []) as string[],
  );
  expect(serverErrors, `Server errors: ${serverErrors.join(", ")}`).toHaveLength(0);
  expect(errors, `Client errors: ${errors.join(", ")}`).toHaveLength(0);
});

test("Fix 1 — create room with 2 bots and start successfully", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("console", msg => { if (msg.type() === "error" && !msg.text().includes("favicon")) errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(err.message));

  await injectStateRelay(page);
  await page.goto("/");

  await page.locator("#nickname").fill("TwoBotPlayer");
  await page.locator("#botCount").selectOption("2");
  await page.locator("#createRoom").click();

  await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#startGame")).toBeEnabled();
  await page.locator("#startGame").click();

  await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

  await page.waitForFunction(
    () => document.querySelectorAll(".player-row").length >= 3,
    undefined,
    { timeout: 20_000 },
  );
  await expect(page.locator(".player-row")).toHaveCount(3);

  const serverErrors = await page.evaluate(
    () => ((window as Record<string, unknown>)["_serverErrors"] ?? []) as string[],
  );
  expect(serverErrors).toHaveLength(0);
  expect(errors).toHaveLength(0);
});

test("Fix 1 — create room with 5 bots and start successfully", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("console", msg => { if (msg.type() === "error" && !msg.text().includes("favicon")) errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(err.message));

  await injectStateRelay(page);
  await page.goto("/");

  await page.locator("#nickname").fill("FiveBotPlayer");
  await page.locator("#botCount").selectOption("5");
  await page.locator("#createRoom").click();

  await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#startGame")).toBeEnabled();
  await page.locator("#startGame").click();

  await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

  // 1 human + 5 bots = 6 players
  await page.waitForFunction(
    () => document.querySelectorAll(".player-row").length >= 6,
    undefined,
    { timeout: 20_000 },
  );
  await expect(page.locator(".player-row")).toHaveCount(6);

  const serverErrors = await page.evaluate(
    () => ((window as Record<string, unknown>)["_serverErrors"] ?? []) as string[],
  );
  expect(serverErrors).toHaveLength(0);
  expect(errors).toHaveLength(0);
});

test("Fix 3 — reload resumes into running game (not lobby)", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));

  await injectStateRelay(page);
  await page.goto("/");

  // Create room with 1 bot and start
  await page.locator("#nickname").fill("ResumePlayer");
  await page.locator("#botCount").selectOption("1");
  await page.locator("#createRoom").click();
  await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
  await page.locator("#startGame").click();

  // Wait for game to actually start (state received)
  await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

  // Wait for at least one state update so game is running
  await page.waitForFunction(
    () => document.getElementById("_lastState") !== null,
    undefined,
    { timeout: 20_000 },
  );

  // Verify session was saved to localStorage
  const session = await page.evaluate(() => localStorage.getItem("laspoly_session"));
  expect(session).toBeTruthy();
  const sessionData = JSON.parse(session!);
  expect(sessionData.roomId).toBeTruthy();
  expect(sessionData.playerId).toBeTruthy();
  expect(sessionData.token).toBeTruthy();

  // Reload the page — this simulates the user pressing F5
  await page.reload();

  // After reload, should NOT see the lobby (should resume into game)
  // The game HUD should become visible again
  await expect(page.locator("#gameHud")).toBeVisible({ timeout: 30_000 });

  // Lobby should NOT be visible
  const lobbyVisible = await page.locator("#lobby").isVisible().catch(() => false);
  expect(lobbyVisible, "Lobby should not be visible after resume").toBe(false);

  // Player list should still show 2 players
  await page.waitForFunction(
    () => document.querySelectorAll(".player-row").length >= 2,
    undefined,
    { timeout: 20_000 },
  );
  await expect(page.locator(".player-row")).toHaveCount(2);

  expect(errors, `Page errors: ${errors.join(", ")}`).toHaveLength(0);
});
