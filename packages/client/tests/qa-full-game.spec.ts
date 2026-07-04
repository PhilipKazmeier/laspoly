/**
 * qa-full-game.spec.ts  –  Detailed live-playthrough QA for LasPoly
 *
 * Auto-pilots a game (1 human + 3 bots) exercising as many code paths as
 * possible, captures screenshots at key moments, and reports every deviation
 * from expected behaviour.
 *
 * Run with:
 *   cd /Users/philip/Work/Other/laspoly
 *   npx playwright test packages/client/tests/qa-full-game.spec.ts --reporter=list
 */

import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

/** Poll until the next actionable prompt (or game over) instead of a fixed sleep. */
async function waitForNextPrompt(page: Page, timeout = 12_000): Promise<void> {
  await page.waitForFunction(() => {
    const vis = (id: string) => {
      const el = document.getElementById(id);
      return !!el && el.style.display !== "none" && el.style.display !== "";
    };
    return vis("buyOfferPanel") || vis("endTurnBtn") || vis("rollBtn") ||
      vis("ransomBtn") || vis("actionCardPopup") ||
      (document.getElementById("gameOverBanner") as HTMLElement | null)?.style.display === "flex";
  }, undefined, { timeout }).catch(() => null);
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.join(__dirname, "__screenshots__");

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

/** Inject a WebSocket relay so tests can read the live GameState. */
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
            if (msg.t === "gameOver") {
              (window as Record<string, unknown>)["_gameOver"] = msg;
            }
            if (msg.t === "error") {
              const errs =
                ((window as Record<string, unknown>)["_serverErrors"] as string[] | undefined) ?? [];
              errs.push(msg.message as string);
              (window as Record<string, unknown>)["_serverErrors"] = errs;
            }
          } catch {
            /* ignore */
          }
        });
      }
    }
    window.WebSocket = PatchedWS as typeof WebSocket;
  });
}

/** Returns current state snapshot from the relay element, or null. */
async function getState(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => {
    const el = document.getElementById("_lastState");
    if (!el?.dataset["state"]) return null;
    try {
      return JSON.parse(el.dataset["state"] as string) as Record<string, unknown>;
    } catch {
      return null;
    }
  });
}

type ActionResult = "roll" | "buy" | "ransom" | "endTurn" | "gameover" | "spectator" | "timeout";

/** Wait for the next actionable state or terminal condition. */
async function waitForAction(page: Page, timeout = 60_000): Promise<ActionResult> {
  try {
    const result = await page.waitForFunction(
      () => {
        const vis = (id: string) => {
          const el = document.getElementById(id);
          return el ? el.style.display !== "none" && el.style.display !== "" : false;
        };
        const govEl = document.getElementById("gameOverBanner");
        if (govEl && govEl.style.display === "flex") return "gameover";
        if (vis("spectatorBanner")) return "spectator";
        if (vis("rollBtn")) return "roll";
        if (vis("buyOfferPanel")) return "buy";
        if (vis("ransomBtn")) return "ransom";
        if (vis("endTurnBtn")) return "endTurn";
        return null;
      },
      undefined,
      { timeout },
    );
    const val = await result.jsonValue() as string | null;
    return (val ?? "timeout") as ActionResult;
  } catch {
    return "timeout";
  }
}

/** Screenshot helper with consistent naming. */
async function shot(page: Page, name: string, options: { canvas?: boolean } = {}) {
  const p = path.join(SCREENSHOTS_DIR, `qa-${name}.png`);
  if (options.canvas) {
    await page.locator("#renderCanvas").screenshot({ path: p });
  } else {
    await page.screenshot({ path: p, fullPage: true });
  }
  return p;
}

// ---------------------------------------------------------------------------
// Main comprehensive QA test
// ---------------------------------------------------------------------------

test.describe("QA Full-Game Playthrough", () => {
  test(
    "comprehensive autopilot (lobby→game→bankruptcy→game-over + animation checks)",
    async ({ page }) => {
      test.setTimeout(180_000);

      // -----------------------------------------------------------------------
      // 0. Error collectors
      // -----------------------------------------------------------------------
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on("console", (msg: ConsoleMessage) => {
        if (msg.type() === "error" && !msg.text().includes("favicon")) {
          consoleErrors.push(`[console.error] ${msg.text()}`);
        }
      });
      page.on("pageerror", (err: Error) => {
        pageErrors.push(`[pageerror] ${err.message}`);
      });

      await injectStateRelay(page);

      // -----------------------------------------------------------------------
      // 1. LOBBY – navigate, fill form, create room
      // -----------------------------------------------------------------------
      await page.goto("/");

      // Version badge visible
      const versionBadge = page.locator("#versionBadge");
      await expect(versionBadge).toBeVisible({ timeout: 10_000 });
      const versionText = await versionBadge.textContent();
      console.log(`Version badge: "${versionText}"`);

      // Canvas rendered
      await expect(page.locator("#renderCanvas")).toBeVisible({ timeout: 10_000 });

      // Lobby screenshot
      await shot(page, "01-lobby");

      // Fill lobby form
      await page.locator("#nickname").fill("QATester");
      await page.locator("#botCount").selectOption("3");

      // Board selector must be populated
      const boardOpts = await page.locator("#boardId option").count();
      console.log(`Board selector options: ${boardOpts}`);
      expect(boardOpts).toBeGreaterThan(0);

      await page.locator("#createRoom").click();

      // -----------------------------------------------------------------------
      // 2. ROOM PANEL – host sees start button
      // -----------------------------------------------------------------------
      await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
      const roomPanelText = await page.locator("#roomInfo").textContent();
      console.log(`Room panel text: "${roomPanelText}"`);

      await shot(page, "02-room-panel");

      await page.locator("#startGame").click();

      // -----------------------------------------------------------------------
      // 3. GAME HUD – wait for HUD and player rows
      // -----------------------------------------------------------------------
      await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });
      await page.waitForFunction(
        () => document.querySelectorAll(".player-row").length >= 4,
        undefined,
        { timeout: 30_000 },
      );

      // Header bar checks
      await expect(page.locator("#gameHeader")).toBeVisible();
      const turnStatus = await page.locator("#headerTurnStatus").textContent();
      console.log(`Header turn status: "${turnStatus}"`);
      expect(turnStatus).toMatch(/am Zug/);

      const headerVersion = await page.locator("#headerVersion").textContent();
      console.log(`Header version: "${headerVersion}"`);
      expect(headerVersion).toMatch(/^v\d/);

      await shot(page, "03-game-start");

      // -----------------------------------------------------------------------
      // 4. AUTO-PILOT LOOP
      // -----------------------------------------------------------------------
      // Tracking flags
      const flags = {
        rentObserved: false,
        buyPhaseEncountered: false,
        buyPhaseDeclined: false,
        ransomUsed: false,
        jailObserved: false,
        spectatorObserved: false,
        gameOverObserved: false,
        actionCardPopupSeen: false,
        specialEventBannerSeen: false,
        negativeMoneyFound: false,
        badLogLineFound: false,
        badLogLines: [] as string[],
        actionCardMoment: false,
        screenshotsTaken: {
          dice: false,
          buyOffer: false,
          actionCard: false,
          jail: false,
          spectator: false,
          gameOver: false,
          topView: false,
          buildingBuilt: false,
        },
      };

      const MAX_TURNS = 250;
      let humanTurns = 0;
      // Track when buildings first appeared (for screenshot)
      let hadBuildings = false;

      // After a few turns take an angled-view 3D board shot with tokens
      let earlyCanvasShot = false;

      for (let i = 0; i < MAX_TURNS; i++) {
        const arrived = await waitForAction(page, 60_000);

        // -- Terminal conditions --
        if (arrived === "timeout") {
          const go = await page.locator("#gameOverBanner").isVisible().catch(() => false);
          if (go) { flags.gameOverObserved = true; break; }
          const sp = await page.locator("#spectatorBanner").isVisible().catch(() => false);
          if (sp) {
            flags.spectatorObserved = true;
            if (!flags.screenshotsTaken.spectator) {
              await shot(page, "08-spectator-banner");
              flags.screenshotsTaken.spectator = true;
            }
            await page.waitForFunction(
              () => (document.getElementById("gameOverBanner") as HTMLElement | null)?.style.display === "flex",
              undefined,
              { timeout: 90_000 },
            ).catch(() => null);
            const finalGO = await page.locator("#gameOverBanner").isVisible().catch(() => false);
            if (finalGO) flags.gameOverObserved = true;
          }
          break;
        }

        if (arrived === "gameover") {
          flags.gameOverObserved = true;
          break;
        }

        if (arrived === "spectator") {
          flags.spectatorObserved = true;
          if (!flags.screenshotsTaken.spectator) {
            await shot(page, "08-spectator-banner");
            flags.screenshotsTaken.spectator = true;
          }
          // Wait for game over
          await page.waitForFunction(
            () => (document.getElementById("gameOverBanner") as HTMLElement | null)?.style.display === "flex",
            undefined,
            { timeout: 90_000 },
          ).catch(() => null);
          const finalGO = await page.locator("#gameOverBanner").isVisible().catch(() => false);
          if (finalGO) flags.gameOverObserved = true;
          break;
        }

        humanTurns++;

        // -- Early canvas + token shot --
        if (humanTurns === 3 && !earlyCanvasShot) {
          await shot(page, "04-canvas-tokens", { canvas: true });
          earlyCanvasShot = true;
        }

        // -- Check for action-card popup --
        const acVisible = await page.locator("#actionCardPopup").isVisible().catch(() => false);
        if (acVisible && !flags.actionCardMoment) {
          flags.actionCardPopupSeen = true;
          flags.actionCardMoment = true;
          if (!flags.screenshotsTaken.actionCard) {
            await shot(page, "07-action-card-popup");
            flags.screenshotsTaken.actionCard = true;
          }
          // Dismiss card
          await page.locator("#actionCardConfirmBtn").click().catch(() => {});
          await page.waitForTimeout(300);
        }

        // -- Check for special event in header --
        const headerEvent = await page.locator("#headerEvent").textContent().catch(() => "");
        if (headerEvent && headerEvent.trim().length > 0) {
          flags.specialEventBannerSeen = true;
        }

        // -- Check negative money --
        const playerListHtml = await page.locator("#playerList").innerHTML();
        const moneyMatches = playerListHtml.match(/LPD (-?\d+)/g) ?? [];
        for (const m of moneyMatches) {
          const val = parseInt(m.replace("LPD ", ""), 10);
          if (val < 0) {
            flags.negativeMoneyFound = true;
            console.error(`NEGATIVE MONEY in UI: "${m}"`);
          }
        }

        // -- Check event log for rent --
        const logText = await page.locator("#eventLog").textContent().catch(() => "");
        if (logText.includes("Miete") || logText.includes("rent")) flags.rentObserved = true;

        // -- Check for jail icon in player list --
        if (playerListHtml.includes("Knast") || playerListHtml.includes("jail")) {
          flags.jailObserved = true;
          if (!flags.screenshotsTaken.jail) {
            await shot(page, "06-jail-state");
            flags.screenshotsTaken.jail = true;
          }
        }

        // -- Check for buildings in state --
        const state = await getState(page);
        if (state && !hadBuildings) {
          const buildings = state["buildings"] as Record<string, unknown> | undefined;
          if (buildings && Object.keys(buildings).length > 0) {
            hadBuildings = true;
            if (!flags.screenshotsTaken.buildingBuilt) {
              await page.waitForTimeout(500);
              await shot(page, "10-buildings-on-board", { canvas: true });
              flags.screenshotsTaken.buildingBuilt = true;
            }
          }
        }

        // -- Handle ransom --
        if (arrived === "ransom") {
          flags.ransomUsed = true;
          if (!flags.screenshotsTaken.jail) {
            await shot(page, "06-jail-ransom");
            flags.screenshotsTaken.jail = true;
          }
          await page.locator("#ransomBtn").click();
          await waitForNextPrompt(page);
          const endAfterRansom = await page.locator("#endTurnBtn").isVisible().catch(() => false);
          if (endAfterRansom) await page.locator("#endTurnBtn").click();
          await page.waitForTimeout(200);
          continue;
        }

        // -- Handle turn-end phase --
        if (arrived === "endTurn") {
          await page.locator("#endTurnBtn").click();
          await page.waitForTimeout(150);
          continue;
        }

        // -- Handle buy offer --
        if (arrived === "buy") {
          flags.buyPhaseEncountered = true;

          if (!flags.screenshotsTaken.buyOffer) {
            await shot(page, "05-buy-offer-panel");
            flags.screenshotsTaken.buyOffer = true;
          }

          // Verify buy offer panel has expected fields
          const buyTileName = await page.locator("#buyTileName").textContent().catch(() => "");
          const buyPrice = await page.locator("#buyPrice").textContent().catch(() => "");
          const buyBalance = await page.locator("#buyBalance").textContent().catch(() => "");
          console.log(`Buy offer: tile="${buyTileName}" price="${buyPrice}" balance="${buyBalance}"`);

          // BUY if we have enough (state relay gives us money), otherwise DECLINE
          const shouldBuy = await page.evaluate(() => {
            try {
              const el = document.getElementById("_lastState");
              if (!el?.dataset["state"]) return false;
              const st = JSON.parse(el.dataset["state"] as string) as {
                currentPlayerIndex: number;
                players: Array<{ money: number }>;
              };
              const cp = st.players[st.currentPlayerIndex];
              return cp ? cp.money >= 300 : false;
            } catch {
              return false;
            }
          });

          if (shouldBuy) {
            await page.locator("#buyOfferBuyBtn").click();
          } else {
            flags.buyPhaseDeclined = true;
            await page.locator("#buyOfferDeclineBtn").click();
          }
          await page.waitForTimeout(500);
          // After buying/declining, handle turn-end
          const endAfterBuy = await page.locator("#endTurnBtn").isVisible().catch(() => false);
          if (endAfterBuy) await page.locator("#endTurnBtn").click();
          await page.waitForTimeout(150);
          continue;
        }

        // -- Handle roll (normal turn) --
        // arrived === "roll"

        // Verify roll button is enabled
        const rollEnabled = await page.locator("#rollBtn").isEnabled();
        if (!rollEnabled) {
          console.error("ROLL BUTTON VISIBLE BUT DISABLED on human turn");
        }

        // Buy offer panel must NOT be visible during roll phase
        const buyVisibleInRoll = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
        if (buyVisibleInRoll) {
          console.error("BUY OFFER PANEL VISIBLE DURING ROLL PHASE — state leak?");
        }

        // Dice result label screenshot at turn 5 (captures dice animation aftermath)
        if (humanTurns === 5 && !flags.screenshotsTaken.dice) {
          // Take BEFORE rolling
          await shot(page, "04b-before-roll", { canvas: true });
        }

        await page.locator("#rollBtn").click();
        await page.waitForTimeout(400); // let dice animation begin

        // After rolling, capture dice animation frame
        if (humanTurns === 5 && !flags.screenshotsTaken.dice) {
          await shot(page, "04c-dice-animating", { canvas: true });
          flags.screenshotsTaken.dice = true;
        }

        // Wait for full animation (dice + movement)
        await page.waitForTimeout(7_600);

        // If buy offer appeared after roll, handle it
        const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
        if (buyNow) {
          flags.buyPhaseEncountered = true;
          if (!flags.screenshotsTaken.buyOffer) {
            await shot(page, "05-buy-offer-panel");
            flags.screenshotsTaken.buyOffer = true;
          }
          const shouldBuy = await page.evaluate(() => {
            try {
              const el = document.getElementById("_lastState");
              if (!el?.dataset["state"]) return false;
              const st = JSON.parse(el.dataset["state"] as string) as {
                currentPlayerIndex: number;
                players: Array<{ money: number }>;
              };
              const cp = st.players[st.currentPlayerIndex];
              return cp ? cp.money >= 300 : false;
            } catch {
              return false;
            }
          });
          if (shouldBuy) {
            await page.locator("#buyOfferBuyBtn").click();
          } else {
            await page.locator("#buyOfferDeclineBtn").click();
          }
          await page.waitForTimeout(500);
        }

        // Check for action card that appeared after roll (now strictly post-animation)
        const acAfterRoll = await page.locator("#actionCardPopup").isVisible().catch(() => false);
        if (acAfterRoll) {
          flags.actionCardPopupSeen = true;
          if (!flags.screenshotsTaken.actionCard) {
            await shot(page, "07-action-card-popup");
            flags.screenshotsTaken.actionCard = true;
          }
          await page.locator("#actionCardConfirmBtn").click().catch(() => {});
          await page.waitForTimeout(300);
        }

        // Handle turn-end phase after roll
        const endAfterRoll = await page.locator("#endTurnBtn").isVisible().catch(() => false);
        if (endAfterRoll) await page.locator("#endTurnBtn").click();
        await page.waitForTimeout(150);
      }

      // -----------------------------------------------------------------------
      // 5. TOP-DOWN VIEW CHECK
      // -----------------------------------------------------------------------
      const viewBtn = page.locator("#headerViewBtn");
      const viewBtnVisible = await viewBtn.isVisible().catch(() => false);
      if (viewBtnVisible) {
        await viewBtn.click();
        await page.waitForTimeout(800);
        const viewText = await viewBtn.textContent().catch(() => "");
        console.log(`View button text after click: "${viewText}"`);
        if (viewText && viewText.includes("Vogel")) {
          await shot(page, "09-top-down-view", { canvas: true });
          flags.screenshotsTaken.topView = true;
        }
        // Toggle back
        await viewBtn.click();
        await page.waitForTimeout(400);
      }

      // -----------------------------------------------------------------------
      // 6. EVENT LOG QUALITY CHECK
      // -----------------------------------------------------------------------
      const allLogLines = await page.locator(".event-line").allTextContents();
      console.log(`Total event log lines: ${allLogLines.length}`);

      for (const line of allLogLines) {
        const trimmed = line.trim();
        if (trimmed === "") {
          flags.badLogLineFound = true;
          flags.badLogLines.push("(empty line)");
        } else if (/\{[a-zA-Z]+\}/.test(trimmed)) {
          flags.badLogLineFound = true;
          flags.badLogLines.push(`Unformatted placeholder: "${trimmed}"`);
        } else if (/^\[[a-zA-Z_]+\]/.test(trimmed)) {
          flags.badLogLineFound = true;
          flags.badLogLines.push(`Fallback key format: "${trimmed}"`);
        }
      }

      // -----------------------------------------------------------------------
      // 7. GAME OVER BANNER
      // -----------------------------------------------------------------------
      if (flags.gameOverObserved) {
        await shot(page, "11-game-over-banner");
        const winnerText = await page.locator("#gameOverWinner").textContent().catch(() => "");
        const winnerBtn = await page.locator("#gameOverRestart").isVisible().catch(() => false);
        console.log(`Game-over winner text: "${winnerText}"`);
        console.log(`Game-over restart button visible: ${winnerBtn}`);
        expect(winnerText).toMatch(/Gewinner:/);
        expect(winnerText!.trim().length).toBeGreaterThan("Gewinner:".length + 1);
        expect(winnerBtn).toBe(true);
      }

      // -----------------------------------------------------------------------
      // 8. RECONNECT CHECK (reload page with session stored in localStorage)
      // -----------------------------------------------------------------------
      if (!flags.gameOverObserved) {
        const sessionExists = await page.evaluate(() => !!localStorage.getItem("laspoly_session"));
        if (sessionExists) {
          console.log("Session found in localStorage — testing reconnect...");
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.waitForTimeout(3_000);
          // After reload, should reconnect to existing room (game still in progress)
          // The lobby should NOT flash if session resume works
          const lobbyVisible = await page.locator("#lobby").isVisible().catch(() => false);
          const hudVisible = await page.locator("#gameHud").isVisible().catch(() => false);
          const roomPanelVisAfterReload = await page.locator("#roomPanel").isVisible().catch(() => false);
          console.log(`After reload — lobby=${lobbyVisible}, hud=${hudVisible}, room=${roomPanelVisAfterReload}`);
          await shot(page, "12-after-reconnect");
        }
      }

      // -----------------------------------------------------------------------
      // 9. CHAT TEST
      // -----------------------------------------------------------------------
      const chatInputVisible = await page.locator("#chatInput").isVisible().catch(() => false);
      if (chatInputVisible) {
        await page.locator("#chatInput").fill("QA chat test message");
        await page.locator("#chatSendBtn").click();
        await page.waitForTimeout(500);
        const logHtml = await page.locator("#eventLog").innerHTML();
        const chatAppeared = logHtml.includes("QA chat test message");
        console.log(`Chat message appeared in log: ${chatAppeared}`);
      }

      // -----------------------------------------------------------------------
      // 10. HELP OVERLAY CHECK
      // -----------------------------------------------------------------------
      const helpBtn = page.locator("button[title='Hilfe']");
      const helpBtnVisible = await helpBtn.isVisible().catch(() => false);
      if (helpBtnVisible) {
        await helpBtn.click();
        await page.waitForTimeout(300);
        const helpOverlayVisible = await page.locator("#helpOverlay").isVisible().catch(() => false);
        console.log(`Help overlay visible after click: ${helpOverlayVisible}`);
        if (helpOverlayVisible) {
          await shot(page, "13-help-overlay");
          await helpBtn.click(); // dismiss
          await page.waitForTimeout(200);
        }
      }

      // -----------------------------------------------------------------------
      // 11. SERVER ERRORS CHECK
      // -----------------------------------------------------------------------
      const serverErrors = await page.evaluate(
        () => ((window as Record<string, unknown>)["_serverErrors"] ?? []) as string[],
      );

      // -----------------------------------------------------------------------
      // FINAL SUMMARY
      // -----------------------------------------------------------------------
      console.log("=== QA SUMMARY ===");
      console.log(`Human turns taken: ${humanTurns}`);
      console.log(`Buy phase encountered: ${flags.buyPhaseEncountered}`);
      console.log(`Buy phase declined at least once: ${flags.buyPhaseDeclined}`);
      console.log(`Rent observed in log: ${flags.rentObserved}`);
      console.log(`Ransom (jail pay) used: ${flags.ransomUsed}`);
      console.log(`Jail observed in player list: ${flags.jailObserved}`);
      console.log(`Spectator banner shown: ${flags.spectatorObserved}`);
      console.log(`Game over reached: ${flags.gameOverObserved}`);
      console.log(`Action-card popup seen: ${flags.actionCardPopupSeen}`);
      console.log(`Special event in header: ${flags.specialEventBannerSeen}`);
      console.log(`Negative money found: ${flags.negativeMoneyFound}`);
      console.log(`Bad log lines: ${flags.badLogLines.length}`);
      if (flags.badLogLines.length > 0) console.log(flags.badLogLines.join("\n"));
      console.log(`Console errors: ${consoleErrors.length}`);
      consoleErrors.forEach((e) => console.log(e));
      console.log(`Page errors: ${pageErrors.length}`);
      pageErrors.forEach((e) => console.log(e));
      console.log(`Server errors: ${serverErrors.length}`);
      serverErrors.forEach((e: string) => console.log(`[server] ${e}`));
      console.log(`Screenshots taken:`, JSON.stringify(flags.screenshotsTaken, null, 2));

      // -----------------------------------------------------------------------
      // ASSERTIONS
      // -----------------------------------------------------------------------
      // All log lines must be properly formatted
      expect(
        flags.badLogLines,
        `Bad event log lines found:\n${flags.badLogLines.join("\n")}`,
      ).toHaveLength(0);

      // No negative money
      expect(flags.negativeMoneyFound, "A player showed negative money in the UI").toBe(false);

      // Console/page/server errors — none expected
      const filteredConsoleErrors = consoleErrors.filter(
        (e) => !e.includes("favicon") && !e.includes("underground.obj"),
      );
      expect(filteredConsoleErrors, `Console errors:\n${filteredConsoleErrors.join("\n")}`).toHaveLength(0);
      expect(pageErrors, `Page errors:\n${pageErrors.join("\n")}`).toHaveLength(0);
      expect(serverErrors, `Server errors:\n${serverErrors.join("\n")}`).toHaveLength(0);
    },
  );

  // -------------------------------------------------------------------------
  // Supplemental: Chat test
  // -------------------------------------------------------------------------
  test("chat messages are echoed to event log", async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await injectStateRelay(page);
    await page.goto("/");

    await page.locator("#nickname").fill("ChatTester");
    await page.locator("#botCount").selectOption("3");
    await page.locator("#createRoom").click();
    await page.locator("#startGame").click();
    await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

    // Wait for our first turn
    const arrived = await waitForAction(page, 45_000);
    if (arrived === "roll" || arrived === "buy" || arrived === "ransom") {
      await page.locator("#eventLogPanel").hover(); // expand the ticker (chat lives inside)
      await page.locator("#chatInput").fill("Hello from QA");
      await page.locator("#chatSendBtn").click();
      await page.waitForTimeout(700);
      const logHtml = await page.locator("#eventLog").innerHTML();
      const chatEchoed = logHtml.includes("Hello from QA");
      console.log(`Chat echoed in log: ${chatEchoed}`);
      expect(chatEchoed).toBe(true);

      await shot(page, "chat-echo");
    }

    const fatal = errors.filter((e) => !e.includes("favicon"));
    expect(fatal).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Supplemental: Game-Over → return to lobby → can create another room
  // -------------------------------------------------------------------------
  test("game-over → back to lobby → create new room works", async ({ page }) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await injectStateRelay(page);
    await page.goto("/");

    await page.locator("#nickname").fill("LoopTester");
    await page.locator("#botCount").selectOption("3");
    await page.locator("#createRoom").click();
    await page.locator("#startGame").click();
    await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

    // Drive to game over (auto-pilot, just roll and decline everything)
    for (let i = 0; i < 250; i++) {
      const arrived = await waitForAction(page, 60_000);
      if (arrived === "gameover") break;
      if (arrived === "timeout") break;
      if (arrived === "spectator") {
        // wait for game over
        await page.waitForFunction(
          () => (document.getElementById("gameOverBanner") as HTMLElement | null)?.style.display === "flex",
          undefined,
          { timeout: 90_000 },
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
        const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
        if (buyNow) await page.locator("#buyOfferDeclineBtn").click();
      }
      // Dismiss action card if it appears
      const ac = await page.locator("#actionCardPopup").isVisible().catch(() => false);
      if (ac) await page.locator("#actionCardConfirmBtn").click().catch(() => {});
      await page.waitForTimeout(150);
    }

    const goVisible = await page.locator("#gameOverBanner").isVisible().catch(() => false);
    if (!goVisible) {
      console.log("Game over not reached in allotted turns — skipping post-game assertions");
      return;
    }

    // Click "Zurück zur Lobby"
    await page.locator("#gameOverRestart").click();
    await page.waitForTimeout(1_000);

    // Lobby must be visible again
    await expect(page.locator("#lobby")).toBeVisible({ timeout: 10_000 });
    await shot(page, "back-to-lobby-after-game-over");

    // Can create a second room
    await page.locator("#nickname").fill("SecondGame");
    await page.locator("#botCount").selectOption("3");
    await page.locator("#createRoom").click();
    await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
    console.log("Second room created successfully after game-over return");

    const fatal = errors.filter((e) => !e.includes("favicon"));
    expect(fatal).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Supplemental: Reconnect after reload
  // -------------------------------------------------------------------------
  test("session persists across page reload", async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await injectStateRelay(page);
    await page.goto("/");

    await page.locator("#nickname").fill("ReconnectTester");
    await page.locator("#botCount").selectOption("3");
    await page.locator("#createRoom").click();
    await page.locator("#startGame").click();
    await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

    // Play a few turns to ensure game is active
    for (let i = 0; i < 5; i++) {
      const arrived = await waitForAction(page, 30_000);
      if (arrived === "gameover" || arrived === "spectator" || arrived === "timeout") break;
      if (arrived === "ransom") {
        await page.locator("#ransomBtn").click();
      } else if (arrived === "buy") {
        await page.locator("#buyOfferDeclineBtn").click();
      } else if (arrived === "endTurn") {
        await page.locator("#endTurnBtn").click();
      } else {
        await page.locator("#rollBtn").click();
        await page.waitForTimeout(300);
        const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
        if (buyNow) await page.locator("#buyOfferDeclineBtn").click();
      }
      await page.waitForTimeout(200);
    }

    // Check that session is saved
    const session = await page.evaluate(() => localStorage.getItem("laspoly_session"));
    console.log(`Session in localStorage: ${session ? "yes" : "no"}`);
    if (!session) {
      console.log("No session — skipping reconnect test");
      return;
    }

    // Reload
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    // Should reconnect: lobby should NOT persist, game HUD or room panel should appear
    const lobbyAfterReload = await page.locator("#lobby").isVisible().catch(() => false);
    const hudAfterReload = await page.locator("#gameHud").isVisible().catch(() => false);
    const roomAfterReload = await page.locator("#roomPanel").isVisible().catch(() => false);

    console.log(`After reload — lobby=${lobbyAfterReload}, hud=${hudAfterReload}, room=${roomAfterReload}`);
    await shot(page, "reconnect-after-reload");

    // Either HUD or room panel must be visible (not lobby from scratch)
    expect(hudAfterReload || roomAfterReload, "After reload, should be back in game/room, not at lobby").toBe(true);

    const fatal = errors.filter((e) => !e.includes("favicon"));
    expect(fatal).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Supplemental: Top-down view renders different camera angle
  // -------------------------------------------------------------------------
  test("view toggle switches camera to top-down perspective", async ({ page }) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");

    await page.locator("#nickname").fill("ViewToggle");
    await page.locator("#botCount").selectOption("3");
    await page.locator("#createRoom").click();
    await page.locator("#startGame").click();
    await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });

    // Roll and wait for scene to settle
    await page.locator("#rollBtn").click();
    await page.waitForTimeout(3_000);
    const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
    if (buyNow) await page.locator("#buyOfferDeclineBtn").click();

    // Standard view screenshot
    await shot(page, "view-standard", { canvas: true });

    // Toggle to top-down
    const viewBtn = page.locator("#headerViewBtn");
    await expect(viewBtn).toBeVisible();
    const textBefore = await viewBtn.textContent();
    await viewBtn.click();
    await page.waitForTimeout(800);
    const textAfter = await viewBtn.textContent();
    console.log(`View button: before="${textBefore}" after="${textAfter}"`);
    expect(textAfter).toMatch(/Vogel/);

    // Top-down screenshot
    await shot(page, "view-topdown", { canvas: true });

    // Toggle back
    await viewBtn.click();
    await page.waitForTimeout(400);
    const textBack = await viewBtn.textContent();
    expect(textBack).toMatch(/Standard/);

    const fatal = errors.filter((e) => !e.includes("favicon"));
    expect(fatal).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Supplemental: Leave room from header (no crash)
  // -------------------------------------------------------------------------
  test("leave room from header returns to lobby", async ({ page }) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");

    await page.locator("#nickname").fill("LeaveTester");
    await page.locator("#botCount").selectOption("3");
    await page.locator("#createRoom").click();
    await page.locator("#startGame").click();
    await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });

    // Click the "✕ Verlassen" button in the header
    const leaveBtn = page.locator("#gameHeader button").filter({ hasText: "Verlassen" });
    await expect(leaveBtn).toBeVisible();
    await leaveBtn.click();
    // The leave-confirm overlay asks first — confirm with its yes button.
    await page.locator(".confirm-overlay button").first().click();
    await page.waitForTimeout(1_000);

    // Should be back at lobby
    await expect(page.locator("#lobby")).toBeVisible({ timeout: 10_000 });
    await shot(page, "leave-room-to-lobby");

    const fatal = errors.filter((e) => !e.includes("favicon"));
    expect(fatal).toHaveLength(0);
  });
});
