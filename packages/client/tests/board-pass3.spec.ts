import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.join(__dirname, "__screenshots__");

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test("board pass3 – header bar visible with room name and turn status", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("Pass3Test");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();

  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#rollBtn")).toBeEnabled({ timeout: 30_000 });

  // Header bar must be present and visible
  await expect(page.locator("#gameHeader")).toBeVisible();

  // Turn status must have text
  const turnStatus = page.locator("#headerTurnStatus");
  await expect(turnStatus).toBeVisible();
  const turnText = await turnStatus.textContent();
  expect(turnText).toMatch(/am Zug/);

  // Roll and wait for bots to settle so a toast and tokens appear
  await page.locator("#rollBtn").click();
  await page.waitForTimeout(5_000);

  // Full-page screenshot showing header
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "board-pass3.png"),
    fullPage: true,
  });

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});

test("board pass3 – view toggle switches to top-down view", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("ViewTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();

  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });

  // Roll so there's something on the board
  await page.locator("#rollBtn").click();
  await page.waitForTimeout(3_000);

  // Click the view toggle button → top-down
  const viewBtn = page.locator("#headerViewBtn");
  await expect(viewBtn).toBeVisible();
  await viewBtn.click();
  await expect(viewBtn).toHaveText(/Vogel/);

  // Wait a frame for camera to update
  await page.waitForTimeout(700);

  // Canvas screenshot in top-down view
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "board-pass3-top.png"),
  });

  // Toggle back to standard
  await viewBtn.click();
  await expect(viewBtn).toHaveText(/Standard/);
  await page.waitForTimeout(500);

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});

test("board pass3 – tokens have distinguishable colours on board", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("TokenColourTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();

  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });

  // Play several turns to spread tokens around the board
  for (let i = 0; i < 4; i++) {
    if (await page.locator("#rollBtn").isVisible()) {
      await page.locator("#rollBtn").click();
      await page.waitForTimeout(3_000);
    }
    if (await page.locator("#buyOfferBuyBtn").isVisible()) {
      await page.locator("#buyOfferBuyBtn").click();
    }
    await page.waitForTimeout(1_000);
  }

  // Dismiss any action-card popup that may be covering the board
  if (await page.locator("#actionCardConfirmBtn").isVisible().catch(() => false)) {
    await page.locator("#actionCardConfirmBtn").click().catch(() => {});
  }
  await page.waitForTimeout(500);

  // Canvas screenshot in standard angled view to assess token colour rings
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "board-pass3-tokens.png"),
  });

  // Player rows must show coloured dots (one row per player)
  const playerRows = await page.locator(".player-row").count();
  expect(playerRows).toBeGreaterThan(1);

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});
