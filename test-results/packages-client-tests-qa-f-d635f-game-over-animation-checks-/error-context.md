# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: packages/client/tests/qa-full-game.spec.ts >> QA Full-Game Playthrough >> comprehensive autopilot (lobby→game→bankruptcy→game-over + animation checks)
- Location: packages/client/tests/qa-full-game.spec.ts:129:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  54  |             }
  55  |             if (msg.t === "error") {
  56  |               const errs =
  57  |                 ((window as Record<string, unknown>)["_serverErrors"] as string[] | undefined) ?? [];
  58  |               errs.push(msg.message as string);
  59  |               (window as Record<string, unknown>)["_serverErrors"] = errs;
  60  |             }
  61  |           } catch {
  62  |             /* ignore */
  63  |           }
  64  |         });
  65  |       }
  66  |     }
  67  |     window.WebSocket = PatchedWS as typeof WebSocket;
  68  |   });
  69  | }
  70  | 
  71  | /** Returns current state snapshot from the relay element, or null. */
  72  | async function getState(page: Page): Promise<Record<string, unknown> | null> {
  73  |   return page.evaluate(() => {
  74  |     const el = document.getElementById("_lastState");
  75  |     if (!el?.dataset["state"]) return null;
  76  |     try {
  77  |       return JSON.parse(el.dataset["state"] as string) as Record<string, unknown>;
  78  |     } catch {
  79  |       return null;
  80  |     }
  81  |   });
  82  | }
  83  | 
  84  | type ActionResult = "roll" | "buy" | "ransom" | "gameover" | "spectator" | "timeout";
  85  | 
  86  | /** Wait for the next actionable state or terminal condition. */
  87  | async function waitForAction(page: Page, timeout = 60_000): Promise<ActionResult> {
  88  |   try {
  89  |     const result = await page.waitForFunction(
  90  |       () => {
  91  |         const vis = (id: string) => {
  92  |           const el = document.getElementById(id);
  93  |           return el ? el.style.display !== "none" && el.style.display !== "" : false;
  94  |         };
  95  |         const govEl = document.getElementById("gameOverBanner");
  96  |         if (govEl && govEl.style.display === "flex") return "gameover";
  97  |         if (vis("spectatorBanner")) return "spectator";
  98  |         if (vis("rollBtn")) return "roll";
  99  |         if (vis("buyOfferPanel")) return "buy";
  100 |         if (vis("ransomBtn")) return "ransom";
  101 |         return null;
  102 |       },
  103 |       undefined,
  104 |       { timeout },
  105 |     );
  106 |     const val = await result.jsonValue() as string | null;
  107 |     return (val ?? "timeout") as ActionResult;
  108 |   } catch {
  109 |     return "timeout";
  110 |   }
  111 | }
  112 | 
  113 | /** Screenshot helper with consistent naming. */
  114 | async function shot(page: Page, name: string, options: { canvas?: boolean } = {}) {
  115 |   const p = path.join(SCREENSHOTS_DIR, `qa-${name}.png`);
  116 |   if (options.canvas) {
  117 |     await page.locator("#renderCanvas").screenshot({ path: p });
  118 |   } else {
  119 |     await page.screenshot({ path: p, fullPage: true });
  120 |   }
  121 |   return p;
  122 | }
  123 | 
  124 | // ---------------------------------------------------------------------------
  125 | // Main comprehensive QA test
  126 | // ---------------------------------------------------------------------------
  127 | 
  128 | test.describe("QA Full-Game Playthrough", () => {
  129 |   test(
  130 |     "comprehensive autopilot (lobby→game→bankruptcy→game-over + animation checks)",
  131 |     async ({ page }) => {
  132 |       test.setTimeout(180_000);
  133 | 
  134 |       // -----------------------------------------------------------------------
  135 |       // 0. Error collectors
  136 |       // -----------------------------------------------------------------------
  137 |       const consoleErrors: string[] = [];
  138 |       const pageErrors: string[] = [];
  139 | 
  140 |       page.on("console", (msg: ConsoleMessage) => {
  141 |         if (msg.type() === "error" && !msg.text().includes("favicon")) {
  142 |           consoleErrors.push(`[console.error] ${msg.text()}`);
  143 |         }
  144 |       });
  145 |       page.on("pageerror", (err: Error) => {
  146 |         pageErrors.push(`[pageerror] ${err.message}`);
  147 |       });
  148 | 
  149 |       await injectStateRelay(page);
  150 | 
  151 |       // -----------------------------------------------------------------------
  152 |       // 1. LOBBY – navigate, fill form, create room
  153 |       // -----------------------------------------------------------------------
> 154 |       await page.goto("/");
      |                  ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  155 | 
  156 |       // Version badge visible
  157 |       const versionBadge = page.locator("#versionBadge");
  158 |       await expect(versionBadge).toBeVisible({ timeout: 10_000 });
  159 |       const versionText = await versionBadge.textContent();
  160 |       console.log(`Version badge: "${versionText}"`);
  161 | 
  162 |       // Canvas rendered
  163 |       await expect(page.locator("#renderCanvas")).toBeVisible({ timeout: 10_000 });
  164 | 
  165 |       // Lobby screenshot
  166 |       await shot(page, "01-lobby");
  167 | 
  168 |       // Fill lobby form
  169 |       await page.locator("#nickname").fill("QATester");
  170 |       await page.locator("#botCount").selectOption("3");
  171 | 
  172 |       // Board selector must be populated
  173 |       const boardOpts = await page.locator("#boardId option").count();
  174 |       console.log(`Board selector options: ${boardOpts}`);
  175 |       expect(boardOpts).toBeGreaterThan(0);
  176 | 
  177 |       await page.locator("#createRoom").click();
  178 | 
  179 |       // -----------------------------------------------------------------------
  180 |       // 2. ROOM PANEL – host sees start button
  181 |       // -----------------------------------------------------------------------
  182 |       await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
  183 |       const roomPanelText = await page.locator("#roomInfo").textContent();
  184 |       console.log(`Room panel text: "${roomPanelText}"`);
  185 | 
  186 |       await shot(page, "02-room-panel");
  187 | 
  188 |       await page.locator("#startGame").click();
  189 | 
  190 |       // -----------------------------------------------------------------------
  191 |       // 3. GAME HUD – wait for HUD and player rows
  192 |       // -----------------------------------------------------------------------
  193 |       await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });
  194 |       await page.waitForFunction(
  195 |         () => document.querySelectorAll(".player-row").length >= 4,
  196 |         undefined,
  197 |         { timeout: 30_000 },
  198 |       );
  199 | 
  200 |       // Header bar checks
  201 |       await expect(page.locator("#gameHeader")).toBeVisible();
  202 |       const turnStatus = await page.locator("#headerTurnStatus").textContent();
  203 |       console.log(`Header turn status: "${turnStatus}"`);
  204 |       expect(turnStatus).toMatch(/am Zug/);
  205 | 
  206 |       const headerVersion = await page.locator("#headerVersion").textContent();
  207 |       console.log(`Header version: "${headerVersion}"`);
  208 |       expect(headerVersion).toMatch(/^v\d/);
  209 | 
  210 |       await shot(page, "03-game-start");
  211 | 
  212 |       // -----------------------------------------------------------------------
  213 |       // 4. AUTO-PILOT LOOP
  214 |       // -----------------------------------------------------------------------
  215 |       // Tracking flags
  216 |       const flags = {
  217 |         rentObserved: false,
  218 |         buyPhaseEncountered: false,
  219 |         buyPhaseDeclined: false,
  220 |         ransomUsed: false,
  221 |         jailObserved: false,
  222 |         spectatorObserved: false,
  223 |         gameOverObserved: false,
  224 |         actionCardPopupSeen: false,
  225 |         specialEventBannerSeen: false,
  226 |         negativeMoneyFound: false,
  227 |         badLogLineFound: false,
  228 |         badLogLines: [] as string[],
  229 |         actionCardMoment: false,
  230 |         screenshotsTaken: {
  231 |           dice: false,
  232 |           buyOffer: false,
  233 |           actionCard: false,
  234 |           jail: false,
  235 |           spectator: false,
  236 |           gameOver: false,
  237 |           topView: false,
  238 |           buildingBuilt: false,
  239 |         },
  240 |       };
  241 | 
  242 |       const MAX_TURNS = 250;
  243 |       let humanTurns = 0;
  244 |       // Track when buildings first appeared (for screenshot)
  245 |       let hadBuildings = false;
  246 | 
  247 |       // After a few turns take an angled-view 3D board shot with tokens
  248 |       let earlyCanvasShot = false;
  249 | 
  250 |       for (let i = 0; i < MAX_TURNS; i++) {
  251 |         const arrived = await waitForAction(page, 60_000);
  252 | 
  253 |         // -- Terminal conditions --
  254 |         if (arrived === "timeout") {
```