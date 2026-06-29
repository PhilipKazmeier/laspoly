/**
 * g2-dicezoom2.spec.ts — Tighter zoom on dice after roll.
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

test("g2-dice-tightzoom", async ({ page }) => {
  await page.goto("/");
  await page.locator("#nickname").fill("DiceZoom2");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();
  await page.locator("#rollBtn").isEnabled();
  await page.waitForTimeout(500);

  await page.locator("#rollBtn").click();
  await page.waitForTimeout(2_500);

  const canvas = page.locator("#renderCanvas");
  const box = await canvas.boundingBox();
  if (box) {
    // The dice land at roughly 45% from left, 35% from top of canvas after roll.
    // Take a tight clip around that area.
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "g2-dice-tight.png"),
      clip: {
        x: box.x + box.width * 0.33,
        y: box.y + box.height * 0.25,
        width: box.width * 0.2,
        height: box.height * 0.2,
      },
    });
  }
});
