import { test, expect } from "@playwright/test";

test("lobby → create room → start game → roll turn", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(err.message));

  await page.goto("/");

  // Canvas exists
  await expect(page.locator("#renderCanvas")).toBeVisible();

  // Fill nickname
  await page.locator("#nickname").fill("TestPlayer");

  // Set bot count to 3
  await page.locator("#botCount").selectOption("3");

  // Create room
  await page.locator("#createRoom").click();

  // Start game (should be host)
  await page.locator("#startGame").click();

  // Wait for Roll button to appear (it's our turn eventually)
  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#rollBtn")).toBeEnabled({ timeout: 30_000 });

  // Log has German text
  const log = page.locator("#eventLog");
  await expect(log).toContainText(/würfelt|bewegt|ist an der Reihe|LPD/, { timeout: 30_000 });

  // No uncaught errors
  expect(errors.filter(e => !e.includes("favicon"))).toHaveLength(0);
});
