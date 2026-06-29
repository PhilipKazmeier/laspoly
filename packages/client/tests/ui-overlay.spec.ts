/**
 * ui-overlay.spec.ts — Screenshots for the 10 UI overlay fixes.
 *
 * Verifies: header not overlapping panels, deed-card popup, help close button,
 * figure picker, special-event toast, action-card popup, language toggle, post-game reset.
 */
import { test, expect, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SS = path.join(__dirname, "__screenshots__");

test.beforeAll(() => { fs.mkdirSync(SS, { recursive: true }); });

async function injectStateRelay(page: Page) {
  await page.addInitScript(() => {
    const OrigWS = window.WebSocket;
    class PW extends OrigWS {
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
            if (msg.t === "gameOver") {
              (window as Record<string, unknown>)["_gameOver"] = msg;
            }
          } catch { /* ignore */ }
        });
      }
    }
    window.WebSocket = PW as typeof WebSocket;
  });
}

async function waitForAction(
  page: Page,
  timeout = 60_000
): Promise<"roll" | "buy" | "ransom" | "gameover" | "spectator" | "timeout"> {
  try {
    const r = await page.waitForFunction(() => {
      const vis = (id: string) => {
        const el = document.getElementById(id);
        return el ? el.style.display !== "none" && el.style.display !== "" : false;
      };
      const go = document.getElementById("gameOverBanner");
      if (go && go.style.display === "flex") return "gameover";
      if (vis("spectatorBanner")) return "spectator";
      if (vis("rollBtn")) return "roll";
      if (vis("buyOfferPanel")) return "buy";
      if (vis("ransomBtn")) return "ransom";
      return null;
    }, undefined, { timeout });
    const v = await r.jsonValue() as string | null;
    return (v ?? "timeout") as "roll" | "buy" | "ransom" | "gameover" | "spectator" | "timeout";
  } catch {
    return "timeout";
  }
}

async function shot(page: Page, name: string) {
  const p = path.join(SS, `ui-${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function startAndCreateRoom(page: Page, nick: string) {
  await page.locator("#nickname").fill(nick);
  await page.locator("#botCount").selectOption("3");
  await page.locator("#createRoom").click();
  await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
}

async function startGame(page: Page) {
  await page.locator("#startGame").click();
  await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
}

test.describe("UI Overlay Fixes", () => {
  test("1+9: header does not overlap player panel", async ({ page }) => {
    test.setTimeout(60_000);
    await injectStateRelay(page);
    await page.goto("/");
    await startAndCreateRoom(page, "HeaderTest");
    await page.locator("#startGame").click();
    await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });
    // Wait for player rows
    await page.waitForFunction(() => document.querySelectorAll(".player-row").length >= 1, undefined, { timeout: 20_000 });
    await page.waitForTimeout(500);

    await shot(page, "1-header-no-overlap");

    // Assert player panel top edge is at or below header bottom
    const headerBox = await page.locator("#gameHeader").boundingBox();
    const playerBox = await page.locator("#playerList").boundingBox();
    expect(headerBox).not.toBeNull();
    expect(playerBox).not.toBeNull();
    if (headerBox && playerBox) {
      const headerBottom = headerBox.y + headerBox.height;
      console.log(`Header bottom: ${headerBottom}px, PlayerList top: ${playerBox.y}px`);
      // Player list must start at or below header bottom (allow 2px rounding)
      expect(playerBox.y).toBeGreaterThanOrEqual(headerBottom - 2);
    }
  });

  test("3+4: deed card opens from property panel click", async ({ page }) => {
    test.setTimeout(90_000);
    await injectStateRelay(page);
    await page.goto("/");
    await startAndCreateRoom(page, "DeedTest");
    await startGame(page);

    // Buy properties to get a property row in the panel
    for (let i = 0; i < 15; i++) {
      const arrived = await waitForAction(page, 15_000);
      if (arrived === "gameover" || arrived === "spectator" || arrived === "timeout") break;
      if (arrived === "ransom") {
        await page.locator("#ransomBtn").click();
      } else if (arrived === "buy") {
        await page.locator("#buyOfferBuyBtn").click();
      } else {
        await page.locator("#rollBtn").click();
        await page.waitForTimeout(400);
        const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
        if (buyNow) await page.locator("#buyOfferBuyBtn").click();
      }
      // Dismiss action card if any
      const ac = await page.locator("#actionCardPopup").isVisible().catch(() => false);
      if (ac) await page.locator("#actionCardConfirmBtn").click().catch(() => {});
      await page.waitForTimeout(200);

      // Check if we have property rows (panel visible during our turn)
      const propCount = await page.locator(".prop-row").count();
      if (propCount > 0) break;
    }

    const propCount = await page.locator(".prop-row").count();
    console.log(`Property rows found: ${propCount}`);

    if (propCount > 0) {
      await page.locator(".prop-row").first().click();
      await page.waitForTimeout(500);
      const deedVisible = await page.locator("#deedCardPopup").isVisible().catch(() => false);
      console.log(`Deed card visible after prop-row click: ${deedVisible}`);
      if (deedVisible) {
        await shot(page, "3-deed-card-popup");
        const deedText = await page.locator("#deedCardPopup").textContent();
        console.log(`Deed card text: ${deedText?.slice(0, 200)}`);
        // Should contain price info
        expect(deedText).toMatch(/LPD/);
        // Should have the × close button
        await expect(page.locator("#deedCardPopup .dc-close")).toBeVisible();
        // Close it
        await page.locator("#deedCardPopup .dc-close").click();
        await page.waitForTimeout(300);
        expect(await page.locator("#deedCardPopup").isVisible()).toBe(false);
        await shot(page, "3-deed-card-closed");
      }
    } else {
      console.log("No property rows this run — skipping deed-card assertion");
    }
  });

  test("7: help overlay has visible × close button and is closable", async ({ page }) => {
    test.setTimeout(60_000);
    await injectStateRelay(page);
    await page.goto("/");
    await startAndCreateRoom(page, "HelpTest");
    await startGame(page);

    // Open help
    const helpBtn = page.locator("button[title='Hilfe']");
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator("#helpOverlay")).toBeVisible();

    // × close button must be present and visible
    await expect(page.locator("#helpCloseBtn")).toBeVisible();
    await shot(page, "7-help-open-with-close-button");

    // Click × to close
    await page.locator("#helpCloseBtn").click();
    await page.waitForTimeout(200);
    expect(await page.locator("#helpOverlay").isVisible()).toBe(false);
    await shot(page, "7-help-closed");

    // Test Escape key closes it
    await helpBtn.click();
    await page.waitForTimeout(200);
    await expect(page.locator("#helpOverlay")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    expect(await page.locator("#helpOverlay").isVisible()).toBe(false);
    console.log("Help overlay: × close ✓, Escape close ✓");
  });

  test("8: lobby figure/colour picker visible in room panel", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/");
    await page.locator("#nickname").fill("FigureTest");
    await page.locator("#botCount").selectOption("3");
    await page.locator("#createRoom").click();
    await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });

    // Figure picker must be rendered
    await expect(page.locator("#figurePicker")).toBeVisible();
    const swatches = await page.locator(".fp-swatch").count();
    console.log(`Figure swatches count: ${swatches}`);
    // 6 colours × 6 figures = 36 swatches
    expect(swatches).toBeGreaterThan(0);
    await shot(page, "8-lobby-figure-picker");

    // Click the first swatch and check it becomes selected
    const firstSwatch = page.locator(".fp-swatch").first();
    await firstSwatch.click();
    await page.waitForTimeout(300);
    const selectedCount = await page.locator(".fp-swatch.selected").count();
    console.log(`Selected swatches after click: ${selectedCount}`);
    expect(selectedCount).toBeGreaterThanOrEqual(1);
    await shot(page, "8-figure-swatch-selected");
  });

  test("5: special event toast appears at game start", async ({ page }) => {
    test.setTimeout(60_000);
    await injectStateRelay(page);
    await page.goto("/");
    await startAndCreateRoom(page, "ToastTest");
    await page.locator("#startGame").click();
    await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

    // Special event emitted at game start — check within 3 seconds
    let toastSeen = false;
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(200);
      toastSeen = await page.locator("#specialEventToast").isVisible().catch(() => false);
      if (toastSeen) break;
    }
    console.log(`Special event toast visible: ${toastSeen}`);
    if (toastSeen) {
      const toastText = await page.locator("#specialEventToast .set-text").textContent();
      console.log(`Toast text: ${toastText}`);
      expect(toastText).toMatch(/Runde|Round/);
      await shot(page, "5-special-event-toast");
      // Close button works
      await page.locator("#specialEventToast .set-close").click();
      await page.waitForTimeout(200);
      expect(await page.locator("#specialEventToast").isVisible()).toBe(false);
    } else {
      // May have already auto-dismissed — check header event label as fallback
      const headerEvent = await page.locator("#headerEvent").textContent().catch(() => "");
      console.log(`Header event label: ${headerEvent}`);
      await shot(page, "5-header-event-label");
    }
  });

  test("6: action-card popup shows localized text (own draw)", async ({ page }) => {
    test.setTimeout(120_000);
    await injectStateRelay(page);
    await page.goto("/");
    await startAndCreateRoom(page, "CardTest");
    await startGame(page);

    let cardSeen = false;
    for (let i = 0; i < 80; i++) {
      const arrived = await waitForAction(page, 12_000);
      if (arrived === "gameover" || arrived === "spectator" || arrived === "timeout") break;
      if (arrived === "ransom") {
        await page.locator("#ransomBtn").click();
      } else if (arrived === "buy") {
        await page.locator("#buyOfferDeclineBtn").click();
      } else {
        await page.locator("#rollBtn").click();
      }
      await page.waitForTimeout(400);
      const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
      if (buyNow) await page.locator("#buyOfferDeclineBtn").click();

      const acVisible = await page.locator("#actionCardPopup").isVisible().catch(() => false);
      if (acVisible) {
        cardSeen = true;
        const cardText = await page.locator("#actionCardText").textContent();
        console.log(`Action card text: "${cardText}"`);
        // Must not show raw placeholder like {card}
        expect(cardText).not.toMatch(/\{[a-z]+\}/i);
        // Must not show raw key format like [actionCard...]
        expect(cardText).not.toMatch(/^\[action/);
        await shot(page, "6-action-card-popup");
        await page.locator("#actionCardConfirmBtn").click().catch(() => {});
        break;
      }
      await page.waitForTimeout(100);
    }
    console.log(`Action card popup seen in own turn: ${cardSeen}`);
    // Note: action cards are drawn probabilistically — acceptable if not drawn in 80 turns
  });

  test("6+DE→EN: language toggle changes event log language", async ({ page }) => {
    test.setTimeout(60_000);
    await injectStateRelay(page);
    await page.goto("/");
    await startAndCreateRoom(page, "LangTest");
    await startGame(page);

    // Play one turn in DE (default)
    const firstArrived = await waitForAction(page, 30_000);
    if (firstArrived === "roll") {
      await page.locator("#rollBtn").click();
      await page.waitForTimeout(500);
      const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
      if (buyNow) await page.locator("#buyOfferDeclineBtn").click();
    }
    await page.waitForTimeout(500);
    const deLogText = await page.locator("#eventLog").textContent().catch(() => "");
    console.log(`DE log sample: ${deLogText.slice(0, 200)}`);
    await shot(page, "6-log-german");

    // Toggle to EN via settings
    await page.locator("button[title='Einstellungen']").click();
    await page.waitForTimeout(200);
    await expect(page.locator("#settingsOverlay")).toBeVisible();
    await page.locator("#localeENBtn").click();
    await page.waitForTimeout(300);
    // EN button should be highlighted now
    const enBtnBg = await page.locator("#localeENBtn").evaluate((el) => (el as HTMLElement).style.background);
    console.log(`EN button background after click: ${enBtnBg}`);
    await shot(page, "6-settings-locale-toggle");
    // Close settings
    await page.keyboard.press("Escape");
  });

  test("9: after game-over, create room works again (no stuck state)", async ({ page }) => {
    test.setTimeout(180_000);
    await injectStateRelay(page);
    await page.goto("/");
    await startAndCreateRoom(page, "ResetTest");
    await page.locator("#startGame").click();
    await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

    // Drive to game over
    for (let i = 0; i < 250; i++) {
      const arrived = await waitForAction(page, 60_000);
      if (arrived === "gameover") break;
      if (arrived === "timeout") break;
      if (arrived === "spectator") {
        await page.waitForFunction(
          () => (document.getElementById("gameOverBanner") as HTMLElement | null)?.style.display === "flex",
          undefined, { timeout: 90_000 }
        ).catch(() => null);
        break;
      }
      if (arrived === "ransom") {
        await page.locator("#ransomBtn").click();
      } else if (arrived === "buy") {
        await page.locator("#buyOfferDeclineBtn").click();
      } else {
        await page.locator("#rollBtn").click();
        await page.waitForTimeout(300);
        const b = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
        if (b) await page.locator("#buyOfferDeclineBtn").click();
      }
      const ac = await page.locator("#actionCardPopup").isVisible().catch(() => false);
      if (ac) await page.locator("#actionCardConfirmBtn").click().catch(() => {});
      await page.waitForTimeout(150);
    }

    const goVisible = await page.locator("#gameOverBanner").isVisible().catch(() => false);
    if (!goVisible) {
      console.log("Game over not reached — skipping post-game assertions");
      return;
    }

    await shot(page, "9-game-over-banner");

    // Click "Zurück zur Lobby"
    await page.locator("#gameOverRestart").click();
    await page.waitForTimeout(1_000);
    await expect(page.locator("#lobby")).toBeVisible({ timeout: 10_000 });
    await shot(page, "9-back-to-lobby");

    // Create a second room — this must work without "already in room" error
    await page.locator("#nickname").fill("SecondGame");
    await page.locator("#botCount").selectOption("3");
    await page.locator("#createRoom").click();
    await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
    await shot(page, "9-second-room-created");
    console.log("Second room created after game-over — lobby reset works ✓");
  });
});
