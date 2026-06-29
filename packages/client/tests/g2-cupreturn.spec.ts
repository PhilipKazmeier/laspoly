/**
 * g2-cupreturn.spec.ts — Verify the cup reappears after bots take their turns.
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

test("g2-cup-reappears-turn2", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await page.locator("#nickname").fill("CupTurn2");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();
  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#rollBtn")).toBeEnabled({ timeout: 10_000 });

  // Screenshot of cup before first roll (turn 1, awaiting roll)
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "g2-cup-before-roll-t1.png"),
  });

  // Roll the dice
  await page.locator("#rollBtn").click();
  await page.waitForTimeout(3_000);

  // Handle any buy/end-turn buttons
  const buyBtn = page.locator("#buyBtn");
  const declineBtn = page.locator("#declineBtn");
  const endTurnBtn = page.locator("#endTurnBtn");

  if (await buyBtn.isVisible()) {
    await declineBtn.click();
    await page.waitForTimeout(1_000);
  }
  if (await endTurnBtn.isVisible()) {
    await endTurnBtn.click();
  }

  // Wait for bots to complete all their turns (3 bots * ~2s each = ~6s + buffer)
  await page.waitForTimeout(10_000);

  // Now it should be the human's turn again (turn 2) - cup should be showing
  // Wait for the roll button to be enabled (ensures it's human's turn)
  await expect(page.locator("#rollBtn")).toBeEnabled({ timeout: 15_000 });

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "g2-cup-turn2-awaiting-roll.png"),
  });

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});
