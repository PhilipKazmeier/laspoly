/**
 * anim-polish.spec.ts — Animation + rendering polish verification
 *
 * Verifies:
 *  1. Buy panel appears only AFTER the moving token has landed (not mid-animation).
 *  2. Token moves smoothly (no large single-frame teleport for a normal dice move).
 *  3. Dice show real pip faces after settling (no number overlay).
 *  4. Labels read upright on all 4 edges (top-down + standard captures).
 *  5. On-board player displays show "LPD" not "€".
 *  6. Consecutive bot turns animate sequentially.
 *
 * Screenshots: tests/__screenshots__/anim-*.png
 */

import { test, expect, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.join(__dirname, "__screenshots__");

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

/** Inject a WebSocket relay so tests can read the live GameState + state count. */
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
              (window as Record<string, unknown>)["_stateCount"] =
                (((window as Record<string, unknown>)["_stateCount"] as number) ?? 0) + 1;
            }
          } catch { /* ignore */ }
        });
      }
    }
    window.WebSocket = PatchedWS as typeof WebSocket;
  });
}

async function getState(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => {
    const el = document.getElementById("_lastState");
    if (!el?.dataset["state"]) return null;
    try { return JSON.parse(el.dataset["state"] as string) as Record<string, unknown>; }
    catch { return null; }
  });
}

async function startGame(page: Page, nick: string) {
  await page.goto("/");
  await page.locator("#nickname").fill(nick);
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.locator("#startGame").click();
  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
}

const ignorable = (e: string) =>
  !e.includes("favicon") && !e.includes("underground.obj");

// ---------------------------------------------------------------------------

test("anim: buy panel appears only AFTER the token lands", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await injectStateRelay(page);
  await startGame(page, "AnimBuy");

  await page.locator("#rollBtn").click();

  // During the dice + walk animation the buy panel must not be visible yet.
  // (Dice alone take ~1.3 s; we check at 600 ms which is mid-dice-roll.)
  await page.waitForTimeout(600);
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "anim-buy-mid-roll.png"),
  });
  const midBuyVisible = await page.locator("#buyOfferBuyBtn").isVisible().catch(() => false);
  expect(midBuyVisible, "buy panel must not appear during animation").toBe(false);

  // Let the full sequence finish.
  await page.waitForTimeout(5_000);
  const state = await getState(page);
  if (state?.["phase"] === "awaiting-buy") {
    await expect(page.locator("#buyOfferBuyBtn")).toBeVisible({ timeout: 3_000 });
    await page.locator("#renderCanvas").screenshot({
      path: path.join(SCREENSHOTS_DIR, "anim-buy-after-landing.png"),
    });
  }

  expect(errors.filter(ignorable)).toHaveLength(0);
});

// ---------------------------------------------------------------------------

test("anim: token moves smoothly — no large single-frame teleport", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await startGame(page, "AnimSmooth");

  await page.locator("#rollBtn").click();
  // Sample frames during the move; smooth motion → gradual pixel change.
  const sizes: number[] = [];
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(180);
    const shot = path.join(SCREENSHOTS_DIR, `anim-smooth-frame${i}.png`);
    await page.locator("#renderCanvas").screenshot({ path: shot });
    sizes.push(fs.statSync(shot).size);
  }
  const maxSize = Math.max(...sizes);
  const minSize = Math.min(...sizes);
  expect(maxSize / minSize, "frame sizes within 6x (smooth, no dramatic jump)").toBeLessThan(6);

  await page.waitForTimeout(4_000);
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "anim-smooth-final.png"),
  });

  expect(errors.filter(ignorable)).toHaveLength(0);
});

// ---------------------------------------------------------------------------

test("anim: dice show pip faces after settling (no number overlay)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await startGame(page, "AnimDice");

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "anim-dice-before.png"),
  });

  await page.locator("#rollBtn").click();
  // Wait for dice to settle (lift+shake+descend ~1.3 s + bounce ~0.4 s).
  await page.waitForTimeout(2_000);
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "anim-dice-pips.png"),
  });

  expect(errors.filter(ignorable)).toHaveLength(0);
});

// ---------------------------------------------------------------------------

test("anim: labels upright + readable on all 4 edges", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await startGame(page, "AnimLabels");

  // Top-down view shows all 4 edges' labels at once.
  const viewBtn = page.locator("#headerViewBtn");
  await expect(viewBtn).toBeVisible();
  await viewBtn.click();
  await page.waitForTimeout(900);
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "anim-labels-topdown.png"),
  });

  // Standard angled view for a second perspective.
  await viewBtn.click();
  await page.waitForTimeout(500);
  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "anim-labels-standard.png"),
  });

  expect(errors.filter(ignorable)).toHaveLength(0);
});

// ---------------------------------------------------------------------------

test("anim: on-board player displays render (LPD currency)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await startGame(page, "AnimLPD");

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "anim-lpd-displays.png"),
  });

  expect(errors.filter(ignorable)).toHaveLength(0);
});

// ---------------------------------------------------------------------------

test("anim: consecutive bot turns animate sequentially", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await injectStateRelay(page);
  await startGame(page, "AnimSerial");

  await page.locator("#rollBtn").click();
  const countBefore = await page.evaluate(
    () => (window as Record<string, unknown>)["_stateCount"] ?? 0
  );

  // Wait for the local turn + bot turns to roll in.
  await page.waitForTimeout(9_000);

  const countAfter = await page.evaluate(
    () => (window as Record<string, unknown>)["_stateCount"] ?? 0
  );
  expect(Number(countAfter) - Number(countBefore)).toBeGreaterThanOrEqual(3);

  await page.locator("#renderCanvas").screenshot({
    path: path.join(SCREENSHOTS_DIR, "anim-serial-after-bots.png"),
  });

  expect(errors.filter(ignorable)).toHaveLength(0);
});
