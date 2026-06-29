/**
 * Phase 2c Management UI e2e test.
 *
 * Drives a game (1 human + 3 bots) until the human owns at least one property,
 * then:
 *   1. Verifies #myPropsPanel appears during human's awaiting-roll turn.
 *   2. Verifies chat input stays interactive while panel is open (non-modal).
 *   3. Clicks "Hypothek" button on an owned property.
 *   4. Verifies the event log shows "Hypothek" (mortgage event) and player money increased.
 *   5. Verifies no console/page errors throughout.
 */
import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

// ---- helpers ----------------------------------------------------------------

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
                ((window as Record<string, unknown>)["_stateCount"] as number ?? 0) + 1;
            }
            if (msg.t === "error") {
              const errs = ((window as Record<string, unknown>)["_serverErrors"] as string[] | undefined) ?? [];
              errs.push(msg.message);
              (window as Record<string, unknown>)["_serverErrors"] = errs;
            }
          } catch { /* ignore */ }
        });
      }
    }
    window.WebSocket = PatchedWS as typeof WebSocket;
  });
}

async function waitForAction(page: Page, timeout = 60_000): Promise<
  "roll" | "buy" | "ransom" | "gameover" | "spectator" | "timeout"
> {
  try {
    const result = await page.waitForFunction(
      () => {
        const visible = (id: string) => {
          const el = document.getElementById(id);
          return el ? el.style.display !== "none" && el.style.display !== "" : false;
        };
        const govEl = document.getElementById("gameOverBanner");
        if (govEl && govEl.style.display === "flex") return "gameover";
        if (visible("spectatorBanner")) return "spectator";
        if (visible("rollBtn")) return "roll";
        if (visible("buyOfferPanel")) return "buy";
        if (visible("ransomBtn")) return "ransom";
        return null;
      },
      undefined,
      { timeout },
    );
    const val = await result.jsonValue() as string | null;
    return (val ?? "timeout") as "roll" | "buy" | "ransom" | "gameover" | "spectator" | "timeout";
  } catch {
    return "timeout";
  }
}

// ---- test -------------------------------------------------------------------

test.describe("Phase 2c Management UI", () => {
  test(
    "my-properties panel appears, is non-modal, and mortgage action works",
    async ({ page }) => {
      test.setTimeout(240_000);

      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on("console", (msg: ConsoleMessage) => {
        if (msg.type() === "error" && !msg.text().includes("favicon")) {
          consoleErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err: Error) => {
        pageErrors.push(err.message);
      });

      await injectStateRelay(page);
      await page.goto("/");

      // Start a game with 3 bots; human buys aggressively to own properties
      await page.locator("#nickname").fill("MgmtTester");
      await page.locator("#botCount").selectOption("3");
      await page.locator("#createRoom").click();
      await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
      await page.locator("#startGame").click();
      await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });

      let myPropsPanelSeen = false;
      let mortgageClicked = false;
      let mortgageLogSeen = false;
      let nonModalConfirmed = false;
      let moneyBeforeMortgage = -1;
      let moneyAfterMortgage = -1;

      const MAX_TURNS = 150;

      for (let i = 0; i < MAX_TURNS; i++) {
        const arrived = await waitForAction(page, 60_000);

        if (arrived === "timeout" || arrived === "gameover" || arrived === "spectator") break;

        if (arrived === "ransom") {
          await page.locator("#ransomBtn").click();
          await page.waitForTimeout(150);
          continue;
        }

        if (arrived === "buy") {
          // Buy only if we can clearly afford the tile (tile price <= player money).
          // We read money from the state relay. If state unavailable, decline.
          const canAfford = await page.evaluate(() => {
            try {
              const el = document.getElementById("_lastState");
              if (!el?.dataset["state"]) return false;
              const st = JSON.parse(el.dataset["state"] as string) as {
                currentPlayerIndex: number;
                players: Array<{ money: number; alive: boolean }>;
                pendingPurchase: number | null;
                tiles?: Array<{ price?: number }>;
              };
              const cp = st.players[st.currentPlayerIndex];
              if (!cp) return false;
              // We don't have easy access to tile prices in the relay snapshot,
              // so use a safe money threshold. All tiles are 400 or below on vegas,
              // but cheapest are 60-100 LPD. If we have at least 400 LPD, buy.
              return cp.money >= 400;
            } catch { return false; }
          });
          if (canAfford) {
            await page.locator("#buyOfferBuyBtn").click();
          } else {
            await page.locator("#buyOfferDeclineBtn").click();
          }
          await page.waitForTimeout(150);
          continue;
        }

        // arrived === "roll"
        // Check if #myPropsPanel is visible (human owns a property on their turn)
        const panelVisible = await page.locator("#myPropsPanel").isVisible().catch(() => false);

        if (panelVisible && !mortgageClicked) {
          myPropsPanelSeen = true;

          // Verify non-modality: chat input must be editable while panel is open
          const chatInput = page.locator("#chatInput");
          const isEnabled = await chatInput.isEnabled().catch(() => false);
          if (isEnabled) {
            await chatInput.fill("non-modal check");
            const val = await chatInput.inputValue();
            if (val === "non-modal check") nonModalConfirmed = true;
            await chatInput.fill("");
          }

          // Look for a "Hypothek" button inside #myPropsPanel
          const mortgageBtns = page.locator("#myPropsPanel button").filter({ hasText: /Hypothek/ });
          const mortgageBtnCount = await mortgageBtns.count();

          if (mortgageBtnCount > 0) {
            // Read player money before (first money value in player list = current human's row)
            const playerListHtml = await page.locator("#playerList").innerHTML();
            const myMoneyMatch = playerListHtml.match(/LPD (\d+)/);
            moneyBeforeMortgage = myMoneyMatch ? parseInt(myMoneyMatch[1]!, 10) : -1;

            await mortgageBtns.first().click();
            mortgageClicked = true;

            // Wait for state update
            await page.waitForTimeout(600);

            // Check event log for "verpfändet" (the German i18n text for the mortgaged event)
            const logText = await page.locator("#eventLog").textContent();
            if (logText && logText.includes("verpfändet")) {
              mortgageLogSeen = true;
            }

            // Read money after
            const playerListHtmlAfter = await page.locator("#playerList").innerHTML();
            const myMoneyMatchAfter = playerListHtmlAfter.match(/LPD (\d+)/);
            moneyAfterMortgage = myMoneyMatchAfter ? parseInt(myMoneyMatchAfter[1]!, 10) : -1;

            // Now roll to advance the turn
            await page.locator("#rollBtn").click();
            await page.waitForTimeout(300);
            // Decline purchase after roll (we already did the mortgage action)
            const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
            if (buyNow) await page.locator("#buyOfferDeclineBtn").click();
            await page.waitForTimeout(150);
            continue;
          }
        }

        // Default: roll
        await page.locator("#rollBtn").click();
        await page.waitForTimeout(300);

        // After roll: buy if we can afford it (state relay check)
        const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
        if (buyNow) {
          const canAffordNow = await page.evaluate(() => {
            try {
              const el = document.getElementById("_lastState");
              if (!el?.dataset["state"]) return false;
              const st = JSON.parse(el.dataset["state"] as string) as {
                currentPlayerIndex: number;
                players: Array<{ money: number }>;
              };
              const cp = st.players[st.currentPlayerIndex];
              return cp ? cp.money >= 400 : false;
            } catch { return false; }
          });
          if (canAffordNow) {
            await page.locator("#buyOfferBuyBtn").click();
          } else {
            await page.locator("#buyOfferDeclineBtn").click();
          }
        }
        await page.waitForTimeout(150);
      }

      // ---- Assertions ----

      // My-properties panel must have appeared at least once
      expect(myPropsPanelSeen, "#myPropsPanel never appeared — human may not have owned property in 150 turns").toBe(true);

      // Non-modal: chat was interactive while panel was open
      expect(nonModalConfirmed, "Chat input was not interactive while #myPropsPanel was open").toBe(true);

      // Mortgage was exercised
      expect(mortgageClicked, "No Hypothek button found in #myPropsPanel — property may have had buildings or been already mortgaged").toBe(true);

      // Mortgage event appeared in log ("verpfändet" is the German i18n text)
      expect(mortgageLogSeen, "Event log did not contain 'verpfändet' after mortgage action").toBe(true);

      // Money increased after mortgage (player received mortgage value)
      if (moneyBeforeMortgage > 0 && moneyAfterMortgage > 0) {
        expect(moneyAfterMortgage).toBeGreaterThan(moneyBeforeMortgage);
      }

      // No errors
      const serverErrors = await page.evaluate(
        () => ((window as Record<string, unknown>)["_serverErrors"] ?? []) as string[],
      );
      expect(consoleErrors, `Console errors: ${consoleErrors.join(", ")}`).toHaveLength(0);
      expect(pageErrors, `Page errors: ${pageErrors.join(", ")}`).toHaveLength(0);
      expect(serverErrors, `Server errors: ${serverErrors.join(", ")}`).toHaveLength(0);

      console.log(`myPropsPanel seen: ${myPropsPanelSeen}`);
      console.log(`non-modal confirmed: ${nonModalConfirmed}`);
      console.log(`mortgage clicked: ${mortgageClicked}`);
      console.log(`mortgage in log: ${mortgageLogSeen}`);
      console.log(`money before: ${moneyBeforeMortgage}, after: ${moneyAfterMortgage}`);
    },
  );
});
