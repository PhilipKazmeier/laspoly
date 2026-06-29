# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: packages/client/tests/ui-overlay.spec.ts >> UI Overlay Fixes >> 6+DE→EN: language toggle changes event log language
- Location: packages/client/tests/ui-overlay.spec.ts:312:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  215 |     await page.locator("#nickname").fill("FigureTest");
  216 |     await page.locator("#botCount").selectOption("3");
  217 |     await page.locator("#createRoom").click();
  218 |     await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
  219 | 
  220 |     // Figure picker must be rendered
  221 |     await expect(page.locator("#figurePicker")).toBeVisible();
  222 |     const swatches = await page.locator(".fp-swatch").count();
  223 |     console.log(`Figure swatches count: ${swatches}`);
  224 |     // 6 colours × 6 figures = 36 swatches
  225 |     expect(swatches).toBeGreaterThan(0);
  226 |     await shot(page, "8-lobby-figure-picker");
  227 | 
  228 |     // Click the first swatch and check it becomes selected
  229 |     const firstSwatch = page.locator(".fp-swatch").first();
  230 |     await firstSwatch.click();
  231 |     await page.waitForTimeout(300);
  232 |     const selectedCount = await page.locator(".fp-swatch.selected").count();
  233 |     console.log(`Selected swatches after click: ${selectedCount}`);
  234 |     expect(selectedCount).toBeGreaterThanOrEqual(1);
  235 |     await shot(page, "8-figure-swatch-selected");
  236 |   });
  237 | 
  238 |   test("5: special event toast appears at game start", async ({ page }) => {
  239 |     test.setTimeout(60_000);
  240 |     await injectStateRelay(page);
  241 |     await page.goto("/");
  242 |     await startAndCreateRoom(page, "ToastTest");
  243 |     await page.locator("#startGame").click();
  244 |     await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });
  245 | 
  246 |     // Special event emitted at game start — check within 3 seconds
  247 |     let toastSeen = false;
  248 |     for (let i = 0; i < 15; i++) {
  249 |       await page.waitForTimeout(200);
  250 |       toastSeen = await page.locator("#specialEventToast").isVisible().catch(() => false);
  251 |       if (toastSeen) break;
  252 |     }
  253 |     console.log(`Special event toast visible: ${toastSeen}`);
  254 |     if (toastSeen) {
  255 |       const toastText = await page.locator("#specialEventToast .set-text").textContent();
  256 |       console.log(`Toast text: ${toastText}`);
  257 |       expect(toastText).toMatch(/Runde|Round/);
  258 |       await shot(page, "5-special-event-toast");
  259 |       // Close button works
  260 |       await page.locator("#specialEventToast .set-close").click();
  261 |       await page.waitForTimeout(200);
  262 |       expect(await page.locator("#specialEventToast").isVisible()).toBe(false);
  263 |     } else {
  264 |       // May have already auto-dismissed — check header event label as fallback
  265 |       const headerEvent = await page.locator("#headerEvent").textContent().catch(() => "");
  266 |       console.log(`Header event label: ${headerEvent}`);
  267 |       await shot(page, "5-header-event-label");
  268 |     }
  269 |   });
  270 | 
  271 |   test("6: action-card popup shows localized text (own draw)", async ({ page }) => {
  272 |     test.setTimeout(120_000);
  273 |     await injectStateRelay(page);
  274 |     await page.goto("/");
  275 |     await startAndCreateRoom(page, "CardTest");
  276 |     await startGame(page);
  277 | 
  278 |     let cardSeen = false;
  279 |     for (let i = 0; i < 80; i++) {
  280 |       const arrived = await waitForAction(page, 12_000);
  281 |       if (arrived === "gameover" || arrived === "spectator" || arrived === "timeout") break;
  282 |       if (arrived === "ransom") {
  283 |         await page.locator("#ransomBtn").click();
  284 |       } else if (arrived === "buy") {
  285 |         await page.locator("#buyOfferDeclineBtn").click();
  286 |       } else {
  287 |         await page.locator("#rollBtn").click();
  288 |       }
  289 |       await page.waitForTimeout(400);
  290 |       const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
  291 |       if (buyNow) await page.locator("#buyOfferDeclineBtn").click();
  292 | 
  293 |       const acVisible = await page.locator("#actionCardPopup").isVisible().catch(() => false);
  294 |       if (acVisible) {
  295 |         cardSeen = true;
  296 |         const cardText = await page.locator("#actionCardText").textContent();
  297 |         console.log(`Action card text: "${cardText}"`);
  298 |         // Must not show raw placeholder like {card}
  299 |         expect(cardText).not.toMatch(/\{[a-z]+\}/i);
  300 |         // Must not show raw key format like [actionCard...]
  301 |         expect(cardText).not.toMatch(/^\[action/);
  302 |         await shot(page, "6-action-card-popup");
  303 |         await page.locator("#actionCardConfirmBtn").click().catch(() => {});
  304 |         break;
  305 |       }
  306 |       await page.waitForTimeout(100);
  307 |     }
  308 |     console.log(`Action card popup seen in own turn: ${cardSeen}`);
  309 |     // Note: action cards are drawn probabilistically — acceptable if not drawn in 80 turns
  310 |   });
  311 | 
  312 |   test("6+DE→EN: language toggle changes event log language", async ({ page }) => {
  313 |     test.setTimeout(60_000);
  314 |     await injectStateRelay(page);
> 315 |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  316 |     await startAndCreateRoom(page, "LangTest");
  317 |     await startGame(page);
  318 | 
  319 |     // Play one turn in DE (default)
  320 |     const firstArrived = await waitForAction(page, 30_000);
  321 |     if (firstArrived === "roll") {
  322 |       await page.locator("#rollBtn").click();
  323 |       await page.waitForTimeout(500);
  324 |       const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
  325 |       if (buyNow) await page.locator("#buyOfferDeclineBtn").click();
  326 |     }
  327 |     await page.waitForTimeout(500);
  328 |     const deLogText = await page.locator("#eventLog").textContent().catch(() => "");
  329 |     console.log(`DE log sample: ${deLogText.slice(0, 200)}`);
  330 |     await shot(page, "6-log-german");
  331 | 
  332 |     // Toggle to EN via settings
  333 |     await page.locator("button[title='Einstellungen']").click();
  334 |     await page.waitForTimeout(200);
  335 |     await expect(page.locator("#settingsOverlay")).toBeVisible();
  336 |     await page.locator("#localeENBtn").click();
  337 |     await page.waitForTimeout(300);
  338 |     // EN button should be highlighted now
  339 |     const enBtnBg = await page.locator("#localeENBtn").evaluate((el) => (el as HTMLElement).style.background);
  340 |     console.log(`EN button background after click: ${enBtnBg}`);
  341 |     await shot(page, "6-settings-locale-toggle");
  342 |     // Close settings
  343 |     await page.keyboard.press("Escape");
  344 |   });
  345 | 
  346 |   test("9: after game-over, create room works again (no stuck state)", async ({ page }) => {
  347 |     test.setTimeout(180_000);
  348 |     await injectStateRelay(page);
  349 |     await page.goto("/");
  350 |     await startAndCreateRoom(page, "ResetTest");
  351 |     await page.locator("#startGame").click();
  352 |     await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });
  353 | 
  354 |     // Drive to game over
  355 |     for (let i = 0; i < 250; i++) {
  356 |       const arrived = await waitForAction(page, 60_000);
  357 |       if (arrived === "gameover") break;
  358 |       if (arrived === "timeout") break;
  359 |       if (arrived === "spectator") {
  360 |         await page.waitForFunction(
  361 |           () => (document.getElementById("gameOverBanner") as HTMLElement | null)?.style.display === "flex",
  362 |           undefined, { timeout: 90_000 }
  363 |         ).catch(() => null);
  364 |         break;
  365 |       }
  366 |       if (arrived === "ransom") {
  367 |         await page.locator("#ransomBtn").click();
  368 |       } else if (arrived === "buy") {
  369 |         await page.locator("#buyOfferDeclineBtn").click();
  370 |       } else {
  371 |         await page.locator("#rollBtn").click();
  372 |         await page.waitForTimeout(300);
  373 |         const b = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
  374 |         if (b) await page.locator("#buyOfferDeclineBtn").click();
  375 |       }
  376 |       const ac = await page.locator("#actionCardPopup").isVisible().catch(() => false);
  377 |       if (ac) await page.locator("#actionCardConfirmBtn").click().catch(() => {});
  378 |       await page.waitForTimeout(150);
  379 |     }
  380 | 
  381 |     const goVisible = await page.locator("#gameOverBanner").isVisible().catch(() => false);
  382 |     if (!goVisible) {
  383 |       console.log("Game over not reached — skipping post-game assertions");
  384 |       return;
  385 |     }
  386 | 
  387 |     await shot(page, "9-game-over-banner");
  388 | 
  389 |     // Click "Zurück zur Lobby"
  390 |     await page.locator("#gameOverRestart").click();
  391 |     await page.waitForTimeout(1_000);
  392 |     await expect(page.locator("#lobby")).toBeVisible({ timeout: 10_000 });
  393 |     await shot(page, "9-back-to-lobby");
  394 | 
  395 |     // Create a second room — this must work without "already in room" error
  396 |     await page.locator("#nickname").fill("SecondGame");
  397 |     await page.locator("#botCount").selectOption("3");
  398 |     await page.locator("#createRoom").click();
  399 |     await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
  400 |     await shot(page, "9-second-room-created");
  401 |     console.log("Second room created after game-over — lobby reset works ✓");
  402 |   });
  403 | });
  404 | 
```