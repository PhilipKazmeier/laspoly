/**
 * g2-dicezoom3.spec.ts — Very tight zoom on dice after roll.
 */
import { test } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.join(__dirname, "__screenshots__");

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test("g2-dice-verytight", async ({ page }) => {
  await page.goto("/");
  await page.locator("#nickname").fill("DiceV3");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();
  await page.locator("#rollBtn").isEnabled();
  await page.waitForTimeout(500);

  await page.locator("#rollBtn").click();
  await page.waitForTimeout(2_500);

  // Full page screenshot first to see positions
  const fullPath = path.join(SCREENSHOTS_DIR, "g2-full-for-dice-pos.png");
  await page.screenshot({ path: fullPath });

  // The canvas starts at about x=330, y=60 in the 1280x720 page.
  // Dice land at about x=530-575, y=295-320 of page coordinates.
  // Based on our full screenshot analysis, dice are roughly at 40-45% x, 35-42% y of canvas.
  const canvas = page.locator("#renderCanvas");
  const box = await canvas.boundingBox();
  if (box) {
    // Target: dice appear in the left-center of the felt
    // Canvas is typically width=936, height=590 starting at x=330, y=60
    const diceX = box.x + box.width * 0.22;
    const diceY = box.y + box.height * 0.38;
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "g2-dice-verytight.png"),
      clip: {
        x: diceX - 40,
        y: diceY - 30,
        width: 120,
        height: 80,
      },
    });
  }
});
