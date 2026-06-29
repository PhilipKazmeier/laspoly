/**
 * g2-dicezoom.spec.ts — Zoom in on dice to verify pip patterns.
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

test("g2-dice-zoom-pips", async ({ page }) => {
  await page.goto("/");
  await page.locator("#nickname").fill("DiceZoom");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();
  await page.locator("#rollBtn").isEnabled();
  await page.waitForTimeout(500);

  // Roll
  await page.locator("#rollBtn").click();
  // Wait for the animation to settle
  await page.waitForTimeout(2_500);

  // Take a full page screenshot with the dice visible
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "g2-dice-zoom-full.png"),
  });

  // Zoom in on the dice area by clipping the canvas screenshot
  // The dice settle near the felt center-left (around x=40%, y=40% of canvas)
  const canvas = page.locator("#renderCanvas");
  const box = await canvas.boundingBox();
  if (box) {
    // Clip to the center-left of the canvas where dice are
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "g2-dice-zoom-clip.png"),
      clip: {
        x: box.x + box.width * 0.25,
        y: box.y + box.height * 0.2,
        width: box.width * 0.35,
        height: box.height * 0.3,
      },
    });
  }
});
