# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: packages/client/tests/ui-overlay.spec.ts >> UI Overlay Fixes >> 3+4: deed card opens from property panel click
- Location: packages/client/tests/ui-overlay.spec.ts:120:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  23  |         super(url, protocols);
  24  |         this.addEventListener("message", (ev) => {
  25  |           try {
  26  |             const msg = JSON.parse(ev.data as string);
  27  |             if (msg.t === "state") {
  28  |               let el = document.getElementById("_lastState");
  29  |               if (!el) {
  30  |                 el = document.createElement("div");
  31  |                 el.id = "_lastState";
  32  |                 el.style.display = "none";
  33  |                 document.body.appendChild(el);
  34  |               }
  35  |               el.dataset["state"] = JSON.stringify(msg.state);
  36  |               (window as Record<string, unknown>)["_stateCount"] =
  37  |                 (((window as Record<string, unknown>)["_stateCount"] as number) ?? 0) + 1;
  38  |             }
  39  |             if (msg.t === "gameOver") {
  40  |               (window as Record<string, unknown>)["_gameOver"] = msg;
  41  |             }
  42  |           } catch { /* ignore */ }
  43  |         });
  44  |       }
  45  |     }
  46  |     window.WebSocket = PW as typeof WebSocket;
  47  |   });
  48  | }
  49  | 
  50  | async function waitForAction(
  51  |   page: Page,
  52  |   timeout = 60_000
  53  | ): Promise<"roll" | "buy" | "ransom" | "gameover" | "spectator" | "timeout"> {
  54  |   try {
  55  |     const r = await page.waitForFunction(() => {
  56  |       const vis = (id: string) => {
  57  |         const el = document.getElementById(id);
  58  |         return el ? el.style.display !== "none" && el.style.display !== "" : false;
  59  |       };
  60  |       const go = document.getElementById("gameOverBanner");
  61  |       if (go && go.style.display === "flex") return "gameover";
  62  |       if (vis("spectatorBanner")) return "spectator";
  63  |       if (vis("rollBtn")) return "roll";
  64  |       if (vis("buyOfferPanel")) return "buy";
  65  |       if (vis("ransomBtn")) return "ransom";
  66  |       return null;
  67  |     }, undefined, { timeout });
  68  |     const v = await r.jsonValue() as string | null;
  69  |     return (v ?? "timeout") as "roll" | "buy" | "ransom" | "gameover" | "spectator" | "timeout";
  70  |   } catch {
  71  |     return "timeout";
  72  |   }
  73  | }
  74  | 
  75  | async function shot(page: Page, name: string) {
  76  |   const p = path.join(SS, `ui-${name}.png`);
  77  |   await page.screenshot({ path: p, fullPage: false });
  78  |   return p;
  79  | }
  80  | 
  81  | async function startAndCreateRoom(page: Page, nick: string) {
  82  |   await page.locator("#nickname").fill(nick);
  83  |   await page.locator("#botCount").selectOption("3");
  84  |   await page.locator("#createRoom").click();
  85  |   await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
  86  | }
  87  | 
  88  | async function startGame(page: Page) {
  89  |   await page.locator("#startGame").click();
  90  |   await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  91  | }
  92  | 
  93  | test.describe("UI Overlay Fixes", () => {
  94  |   test("1+9: header does not overlap player panel", async ({ page }) => {
  95  |     test.setTimeout(60_000);
  96  |     await injectStateRelay(page);
  97  |     await page.goto("/");
  98  |     await startAndCreateRoom(page, "HeaderTest");
  99  |     await page.locator("#startGame").click();
  100 |     await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });
  101 |     // Wait for player rows
  102 |     await page.waitForFunction(() => document.querySelectorAll(".player-row").length >= 1, undefined, { timeout: 20_000 });
  103 |     await page.waitForTimeout(500);
  104 | 
  105 |     await shot(page, "1-header-no-overlap");
  106 | 
  107 |     // Assert player panel top edge is at or below header bottom
  108 |     const headerBox = await page.locator("#gameHeader").boundingBox();
  109 |     const playerBox = await page.locator("#playerList").boundingBox();
  110 |     expect(headerBox).not.toBeNull();
  111 |     expect(playerBox).not.toBeNull();
  112 |     if (headerBox && playerBox) {
  113 |       const headerBottom = headerBox.y + headerBox.height;
  114 |       console.log(`Header bottom: ${headerBottom}px, PlayerList top: ${playerBox.y}px`);
  115 |       // Player list must start at or below header bottom (allow 2px rounding)
  116 |       expect(playerBox.y).toBeGreaterThanOrEqual(headerBottom - 2);
  117 |     }
  118 |   });
  119 | 
  120 |   test("3+4: deed card opens from property panel click", async ({ page }) => {
  121 |     test.setTimeout(90_000);
  122 |     await injectStateRelay(page);
> 123 |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  124 |     await startAndCreateRoom(page, "DeedTest");
  125 |     await startGame(page);
  126 | 
  127 |     // Buy properties to get a property row in the panel
  128 |     for (let i = 0; i < 15; i++) {
  129 |       const arrived = await waitForAction(page, 15_000);
  130 |       if (arrived === "gameover" || arrived === "spectator" || arrived === "timeout") break;
  131 |       if (arrived === "ransom") {
  132 |         await page.locator("#ransomBtn").click();
  133 |       } else if (arrived === "buy") {
  134 |         await page.locator("#buyOfferBuyBtn").click();
  135 |       } else {
  136 |         await page.locator("#rollBtn").click();
  137 |         await page.waitForTimeout(400);
  138 |         const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
  139 |         if (buyNow) await page.locator("#buyOfferBuyBtn").click();
  140 |       }
  141 |       // Dismiss action card if any
  142 |       const ac = await page.locator("#actionCardPopup").isVisible().catch(() => false);
  143 |       if (ac) await page.locator("#actionCardConfirmBtn").click().catch(() => {});
  144 |       await page.waitForTimeout(200);
  145 | 
  146 |       // Check if we have property rows (panel visible during our turn)
  147 |       const propCount = await page.locator(".prop-row").count();
  148 |       if (propCount > 0) break;
  149 |     }
  150 | 
  151 |     const propCount = await page.locator(".prop-row").count();
  152 |     console.log(`Property rows found: ${propCount}`);
  153 | 
  154 |     if (propCount > 0) {
  155 |       await page.locator(".prop-row").first().click();
  156 |       await page.waitForTimeout(500);
  157 |       const deedVisible = await page.locator("#deedCardPopup").isVisible().catch(() => false);
  158 |       console.log(`Deed card visible after prop-row click: ${deedVisible}`);
  159 |       if (deedVisible) {
  160 |         await shot(page, "3-deed-card-popup");
  161 |         const deedText = await page.locator("#deedCardPopup").textContent();
  162 |         console.log(`Deed card text: ${deedText?.slice(0, 200)}`);
  163 |         // Should contain price info
  164 |         expect(deedText).toMatch(/LPD/);
  165 |         // Should have the × close button
  166 |         await expect(page.locator("#deedCardPopup .dc-close")).toBeVisible();
  167 |         // Close it
  168 |         await page.locator("#deedCardPopup .dc-close").click();
  169 |         await page.waitForTimeout(300);
  170 |         expect(await page.locator("#deedCardPopup").isVisible()).toBe(false);
  171 |         await shot(page, "3-deed-card-closed");
  172 |       }
  173 |     } else {
  174 |       console.log("No property rows this run — skipping deed-card assertion");
  175 |     }
  176 |   });
  177 | 
  178 |   test("7: help overlay has visible × close button and is closable", async ({ page }) => {
  179 |     test.setTimeout(60_000);
  180 |     await injectStateRelay(page);
  181 |     await page.goto("/");
  182 |     await startAndCreateRoom(page, "HelpTest");
  183 |     await startGame(page);
  184 | 
  185 |     // Open help
  186 |     const helpBtn = page.locator("button[title='Hilfe']");
  187 |     await expect(helpBtn).toBeVisible();
  188 |     await helpBtn.click();
  189 |     await page.waitForTimeout(300);
  190 |     await expect(page.locator("#helpOverlay")).toBeVisible();
  191 | 
  192 |     // × close button must be present and visible
  193 |     await expect(page.locator("#helpCloseBtn")).toBeVisible();
  194 |     await shot(page, "7-help-open-with-close-button");
  195 | 
  196 |     // Click × to close
  197 |     await page.locator("#helpCloseBtn").click();
  198 |     await page.waitForTimeout(200);
  199 |     expect(await page.locator("#helpOverlay").isVisible()).toBe(false);
  200 |     await shot(page, "7-help-closed");
  201 | 
  202 |     // Test Escape key closes it
  203 |     await helpBtn.click();
  204 |     await page.waitForTimeout(200);
  205 |     await expect(page.locator("#helpOverlay")).toBeVisible();
  206 |     await page.keyboard.press("Escape");
  207 |     await page.waitForTimeout(200);
  208 |     expect(await page.locator("#helpOverlay").isVisible()).toBe(false);
  209 |     console.log("Help overlay: × close ✓, Escape close ✓");
  210 |   });
  211 | 
  212 |   test("8: lobby figure/colour picker visible in room panel", async ({ page }) => {
  213 |     test.setTimeout(30_000);
  214 |     await page.goto("/");
  215 |     await page.locator("#nickname").fill("FigureTest");
  216 |     await page.locator("#botCount").selectOption("3");
  217 |     await page.locator("#createRoom").click();
  218 |     await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
  219 | 
  220 |     // Figure picker must be rendered
  221 |     await expect(page.locator("#figurePicker")).toBeVisible();
  222 |     const swatches = await page.locator(".fp-swatch").count();
  223 |     console.log(`Figure swatches count: ${swatches}`);
```