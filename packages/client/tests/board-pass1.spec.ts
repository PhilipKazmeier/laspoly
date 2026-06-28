import { test, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import * as path from "path";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, "__screenshots__");

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test("board pass1 – full page screenshot", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await expect(page.locator("#renderCanvas")).toBeVisible();

  // Start a game with 3 bots
  await page.locator("#nickname").fill("ScreenTest");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();

  // Wait for Roll button = game started
  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#rollBtn")).toBeEnabled({ timeout: 30_000 });

  // Roll the dice so tokens spread out on the board
  await page.locator("#rollBtn").click();

  // Wait for bots to take their turns (tokens spread around the board)
  await page.waitForTimeout(3_000);

  // Give 3D board time to render
  await page.waitForTimeout(1_000);

  // Full-page screenshot
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "board-pass1.png"),
    fullPage: true,
  });

  // Canvas-only screenshot (board close-up)
  const canvas = page.locator("#renderCanvas");
  await canvas.screenshot({
    path: path.join(SCREENSHOTS_DIR, "board-pass1-canvas.png"),
  });

  // No fatal JS errors (underground.obj may 404 — that's OK)
  const fatal = errors.filter(
    (e) => !e.includes("favicon") && !e.includes("underground.obj")
  );
  expect(fatal).toHaveLength(0);
});
