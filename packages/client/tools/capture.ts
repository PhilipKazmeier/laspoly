/**
 * Screenshot harness — the verification gate for visual work
 * (docs/superpowers/plans/back-room-overhaul.md, Phase 0.4).
 *
 * Boots a browser against a RUNNING dev server, plays the standard audit flow
 * (lobby → create room with 3 bots → start → roll → buy offer → bot rounds)
 * and writes numbered PNGs. LOOK AT the images — do not trust code over pixels
 * (docs/HANDOFF.md §5).
 *
 * Usage:
 *   npm run dev                 # in another terminal (server :8080 + vite :5173)
 *   npx tsx tools/capture.ts    # from packages/client
 *
 * Env:
 *   CAPTURE_URL   page to open        (default http://localhost:5173)
 *   CAPTURE_OUT   output directory    (default test-results/capture)
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const URL = process.env.CAPTURE_URL ?? "http://localhost:5173";
const OUT = process.env.CAPTURE_OUT ?? path.join("test-results", "capture");

const run = async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const shot = (name: string) =>
    page.screenshot({ path: path.join(OUT, `${name}.png`) });

  await page.goto(URL);
  await page.waitForSelector("#renderCanvas");
  // connected = room list no longer shows the connecting placeholder
  await page.waitForFunction(() => {
    const el = document.querySelector("#roomList");
    return !!el && !/Verbinde|Connecting/i.test(el.textContent ?? "");
  }, undefined, { timeout: 30_000 });
  await page.waitForTimeout(2000); // let the 3D scene settle
  await shot("01-lobby");

  await page.locator("#nickname").fill("Capture");
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await page.waitForTimeout(1500);
  await shot("02-room");

  await page.locator("#startGame").click();
  await page.waitForSelector("#rollBtn", { state: "visible", timeout: 30_000 });
  await page.waitForTimeout(1000);
  await shot("03-hud-my-turn");

  await page.locator("#rollBtn").click();
  await page.waitForTimeout(1200);
  await shot("04-dice-roll");
  await page.waitForTimeout(2500);
  await shot("05-after-landing");

  const buyBtn = page.locator("#buyOfferBuyBtn");
  if (await buyBtn.isVisible().catch(() => false)) {
    await shot("06-buy-offer");
    await buyBtn.click();
    await page.waitForTimeout(800);
  }

  const endTurn = page.locator("#endTurnBtn");
  if (await endTurn.isVisible().catch(() => false)) await endTurn.click().catch(() => {});
  await page.waitForTimeout(6000);
  await shot("07-bots-playing");
  await page.waitForTimeout(8000);
  await shot("08-bots-playing-later");

  await browser.close();
  console.log(`captured to ${OUT}/01…08.png — now READ them`);
};

run().catch(e => { console.error(e); process.exit(1); });
