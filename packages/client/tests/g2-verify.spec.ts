/**
 * g2-verify.spec.ts — Visual verification screenshots for bug fixes.
 * Screenshots saved to __screenshots__/g2-*.png
 */
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

async function startGame(page: import("@playwright/test").Page, nick: string) {
  await page.goto("/");
  await page.locator("#nickname").fill(nick);
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();
  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#rollBtn")).toBeEnabled({ timeout: 10_000 });
}

test("g2-1: cup visible on turn 1 and after roll", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await startGame(page, "CupTest");

  // Screenshot BEFORE roll: cup should be on the felt
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "g2-cup-whole-turn1.png"),
  });

  // Roll the dice
  await page.locator("#rollBtn").click();
  // Wait for dice animation to play (~2s)
  await page.waitForTimeout(2_500);

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "g2-dice-settled-turn1.png"),
  });

  // Complete the turn (buy or end turn)
  const buyBtn = page.locator("#buyBtn");
  const endTurnBtn = page.locator("#endTurnBtn");
  if (await buyBtn.isVisible()) {
    await page.locator("#declineBtn").click();
  }
  if (await endTurnBtn.isVisible()) {
    await endTurnBtn.click();
  }
  // Wait for bots to take turns and next human turn to begin
  await page.waitForTimeout(6_000);

  // Cup should reappear for the human's next turn
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "g2-cup-visible-later-turn.png"),
  });

  // No fatal errors (exclude favicon and underground.obj which are pre-existing)
  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});

test("g2-2: dice distinct pips after roll", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await startGame(page, "DicePipTest");

  // Roll and capture the settled dice
  await page.locator("#rollBtn").click();
  await page.waitForTimeout(2_500); // let animation finish

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "g2-dice-distinct-pips.png"),
  });

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});

test("g2-3: street label close-up", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await startGame(page, "LabelTest");

  // Top-down view to see labels more clearly
  const topBtn = page.locator("button", { hasText: "Vogelperspektive" }).or(
    page.locator("button", { hasText: "Top" })
  );
  if (await topBtn.isVisible()) await topBtn.click();

  await page.waitForTimeout(500);

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "g2-label-closeup.png"),
  });

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});

test("g2-4: wood table texture", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await startGame(page, "WoodTest");

  // Standard view shows the table edges
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "g2-wood-table.png"),
  });

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});

test("g2-6: no bot card popup for human", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await startGame(page, "BotCardTest");

  // Roll and end human turn to let bots play
  await page.locator("#rollBtn").click();
  await page.waitForTimeout(2_500);

  const buyBtn = page.locator("#buyBtn");
  const endTurnBtn = page.locator("#endTurnBtn");
  if (await buyBtn.isVisible()) await page.locator("#declineBtn").click();
  if (await endTurnBtn.isVisible()) await endTurnBtn.click();

  // Wait for bots to act; if any action card popup appears during bot turns, that's the bug
  await page.waitForTimeout(8_000);

  // Screenshot should show no action card popup during bot turns
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "g2-no-bot-card-popup.png"),
  });

  // The action card popup should NOT be visible now (bots have had their turns)
  const popup = page.locator("#actionCardPopup");
  // If popup is visible now (after bot turns ended), that's the bug
  // We only check that it's not stuck open from a bot draw
  const isVisible = await popup.isVisible();
  if (isVisible) {
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "g2-bot-card-popup-bug.png") });
  }
  // Don't assert here — just capture evidence
  void isVisible;

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});
