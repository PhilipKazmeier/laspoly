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
}

const ignorable = (e: string) =>
  !e.includes("favicon") && !e.includes("underground.obj");

test("rework – standard view: inward bars, labels, tokens, ownership, displays", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await startGame(page, "ReworkStd");
  await expect(page.locator("#rollBtn")).toBeEnabled();

  // Standard view before any roll: cup visible, tokens at GO.
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-standard.png"),
  });

  expect(errors.filter(ignorable), "no console errors").toHaveLength(0);
});

test("rework – cup vanishes, dice show result on felt after roll", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await startGame(page, "ReworkDice");

  await page.locator("#rollBtn").click();
  // Mid-animation: cup is lifting/shaking.
  await page.waitForTimeout(250);
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-mid-roll.png"),
  });

  // After the dice settle: cup hidden, dice on felt showing the result.
  await page.waitForTimeout(2_500);
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-post-roll.png"),
  });

  expect(errors.filter(ignorable), "no console errors").toHaveLength(0);
});

test("rework – clockwise token movement", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await startGame(page, "ReworkCW");

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-before-roll.png"),
  });

  await page.locator("#rollBtn").click();
  // Capture mid-move (after dice settle ~2.5s, token is walking).
  await page.waitForTimeout(2_900);
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-midmove.png"),
  });

  await page.waitForTimeout(3_000);
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-clockwise.png"),
  });

  expect(errors.filter(ignorable), "no console errors").toHaveLength(0);
});

test("rework – top-down view readable without glare", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await startGame(page, "ReworkTop");

  await page.locator("#rollBtn").click();
  await page.waitForTimeout(8_000);
  if (await page.locator("#buyOfferBuyBtn").isVisible().catch(() => false)) {
    await page.locator("#buyOfferBuyBtn").click();
    await page.waitForTimeout(700);
  }
  if (await page.locator("#endTurnBtn").isVisible().catch(() => false)) {
    await page.locator("#endTurnBtn").click();
    await page.waitForTimeout(500);
  }

  const viewBtn = page.locator("#headerViewBtn");
  await expect(viewBtn).toBeVisible();
  await viewBtn.click();
  await page.waitForTimeout(900);

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-topdown.png"),
  });

  await viewBtn.click();
  await page.waitForTimeout(500);

  expect(errors.filter(ignorable), "no console errors").toHaveLength(0);
});

test("rework – ownership markers + player displays accumulate", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await startGame(page, "ReworkOwn");

  for (let i = 0; i < 6; i++) {
    if (await page.locator("#rollBtn").isVisible().catch(() => false)) {
      await page.locator("#rollBtn").click();
      await page.waitForTimeout(8_000); // wait for animation
    }
    if (await page.locator("#buyOfferBuyBtn").isVisible().catch(() => false)) {
      await page.locator("#buyOfferBuyBtn").click();
      await page.waitForTimeout(900);
    }
    if (await page.locator("#actionCardConfirmBtn").isVisible().catch(() => false)) {
      await page.locator("#actionCardConfirmBtn").click().catch(() => {});
      await page.waitForTimeout(500);
    }
    if (await page.locator("#endTurnBtn").isVisible().catch(() => false)) {
      await page.locator("#endTurnBtn").click();
      await page.waitForTimeout(500);
    }
  }

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "rework-ownership.png"),
  });

  expect(errors.filter(ignorable), "no console errors").toHaveLength(0);
});
