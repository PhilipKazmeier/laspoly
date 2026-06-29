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

test("board pass2 – tokens visible as vehicles on board", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("Pass2Test");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();

  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#rollBtn")).toBeEnabled({ timeout: 30_000 });

  // Let bots move a few turns so tokens spread around the board
  await page.locator("#rollBtn").click();
  await page.waitForTimeout(8_000); // wait for animation, then handle turn-end
  // Click "Zug beenden" if it appeared after our roll
  if (await page.locator("#endTurnBtn").isVisible().catch(() => false)) {
    await page.locator("#endTurnBtn").click();
  }
  await page.waitForTimeout(2_000); // let bots animate

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "board-pass2-tokens.png"),
  });

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});

test("board pass2 – dice + cup visible after roll", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("DiceTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();

  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#rollBtn")).toBeEnabled({ timeout: 30_000 });

  // Roll and capture during the dice-settle phase
  await page.locator("#rollBtn").click();
  await page.waitForTimeout(2_000); // dice settled + result label up

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "board-pass2-dice.png"),
  });

  await page.waitForTimeout(4_000); // let bots finish

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});

test("board pass2 – chip stacks and deed display visible", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#nickname").fill("ChipTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();

  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });

  // Play several turns; buy whenever offered so we accumulate deeds.
  // Also handle turn-end phase ("Zug beenden" button).
  for (let i = 0; i < 12; i++) {
    if (await page.locator("#rollBtn").isVisible()) {
      await page.locator("#rollBtn").click();
      await page.waitForTimeout(8_000); // wait for dice + movement animation
    }
    if (await page.locator("#buyOfferBuyBtn").isVisible()) {
      await page.locator("#buyOfferBuyBtn").click();
      await page.waitForTimeout(500);
    }
    if (await page.locator("#endTurnBtn").isVisible()) {
      await page.locator("#endTurnBtn").click();
    }
    await page.waitForTimeout(500);
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "board-pass2-chips-deeds.png"),
    fullPage: true,
  });

  // Verify chip images render in the DOM
  const chipImgs = await page.locator("img.chip-img").count();
  expect(chipImgs).toBeGreaterThan(0);

  const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("underground.obj"));
  expect(fatal).toHaveLength(0);
});
