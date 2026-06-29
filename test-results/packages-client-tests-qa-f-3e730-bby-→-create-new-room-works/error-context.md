# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: packages/client/tests/qa-full-game.spec.ts >> QA Full-Game Playthrough >> game-over → back to lobby → create new room works
- Location: packages/client/tests/qa-full-game.spec.ts:684:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  589 |           await page.waitForTimeout(200);
  590 |         }
  591 |       }
  592 | 
  593 |       // -----------------------------------------------------------------------
  594 |       // 11. SERVER ERRORS CHECK
  595 |       // -----------------------------------------------------------------------
  596 |       const serverErrors = await page.evaluate(
  597 |         () => ((window as Record<string, unknown>)["_serverErrors"] ?? []) as string[],
  598 |       );
  599 | 
  600 |       // -----------------------------------------------------------------------
  601 |       // FINAL SUMMARY
  602 |       // -----------------------------------------------------------------------
  603 |       console.log("=== QA SUMMARY ===");
  604 |       console.log(`Human turns taken: ${humanTurns}`);
  605 |       console.log(`Buy phase encountered: ${flags.buyPhaseEncountered}`);
  606 |       console.log(`Buy phase declined at least once: ${flags.buyPhaseDeclined}`);
  607 |       console.log(`Rent observed in log: ${flags.rentObserved}`);
  608 |       console.log(`Ransom (jail pay) used: ${flags.ransomUsed}`);
  609 |       console.log(`Jail observed in player list: ${flags.jailObserved}`);
  610 |       console.log(`Spectator banner shown: ${flags.spectatorObserved}`);
  611 |       console.log(`Game over reached: ${flags.gameOverObserved}`);
  612 |       console.log(`Action-card popup seen: ${flags.actionCardPopupSeen}`);
  613 |       console.log(`Special event in header: ${flags.specialEventBannerSeen}`);
  614 |       console.log(`Negative money found: ${flags.negativeMoneyFound}`);
  615 |       console.log(`Bad log lines: ${flags.badLogLines.length}`);
  616 |       if (flags.badLogLines.length > 0) console.log(flags.badLogLines.join("\n"));
  617 |       console.log(`Console errors: ${consoleErrors.length}`);
  618 |       consoleErrors.forEach((e) => console.log(e));
  619 |       console.log(`Page errors: ${pageErrors.length}`);
  620 |       pageErrors.forEach((e) => console.log(e));
  621 |       console.log(`Server errors: ${serverErrors.length}`);
  622 |       serverErrors.forEach((e: string) => console.log(`[server] ${e}`));
  623 |       console.log(`Screenshots taken:`, JSON.stringify(flags.screenshotsTaken, null, 2));
  624 | 
  625 |       // -----------------------------------------------------------------------
  626 |       // ASSERTIONS
  627 |       // -----------------------------------------------------------------------
  628 |       // All log lines must be properly formatted
  629 |       expect(
  630 |         flags.badLogLines,
  631 |         `Bad event log lines found:\n${flags.badLogLines.join("\n")}`,
  632 |       ).toHaveLength(0);
  633 | 
  634 |       // No negative money
  635 |       expect(flags.negativeMoneyFound, "A player showed negative money in the UI").toBe(false);
  636 | 
  637 |       // Console/page/server errors — none expected
  638 |       const filteredConsoleErrors = consoleErrors.filter(
  639 |         (e) => !e.includes("favicon") && !e.includes("underground.obj"),
  640 |       );
  641 |       expect(filteredConsoleErrors, `Console errors:\n${filteredConsoleErrors.join("\n")}`).toHaveLength(0);
  642 |       expect(pageErrors, `Page errors:\n${pageErrors.join("\n")}`).toHaveLength(0);
  643 |       expect(serverErrors, `Server errors:\n${serverErrors.join("\n")}`).toHaveLength(0);
  644 |     },
  645 |   );
  646 | 
  647 |   // -------------------------------------------------------------------------
  648 |   // Supplemental: Chat test
  649 |   // -------------------------------------------------------------------------
  650 |   test("chat messages are echoed to event log", async ({ page }) => {
  651 |     test.setTimeout(90_000);
  652 |     const errors: string[] = [];
  653 |     page.on("pageerror", (err) => errors.push(err.message));
  654 |     await injectStateRelay(page);
  655 |     await page.goto("/");
  656 | 
  657 |     await page.locator("#nickname").fill("ChatTester");
  658 |     await page.locator("#botCount").selectOption("3");
  659 |     await page.locator("#createRoom").click();
  660 |     await page.locator("#startGame").click();
  661 |     await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });
  662 | 
  663 |     // Wait for our first turn
  664 |     const arrived = await waitForAction(page, 45_000);
  665 |     if (arrived === "roll" || arrived === "buy" || arrived === "ransom") {
  666 |       await page.locator("#chatInput").fill("Hello from QA");
  667 |       await page.locator("#chatSendBtn").click();
  668 |       await page.waitForTimeout(700);
  669 |       const logHtml = await page.locator("#eventLog").innerHTML();
  670 |       const chatEchoed = logHtml.includes("Hello from QA");
  671 |       console.log(`Chat echoed in log: ${chatEchoed}`);
  672 |       expect(chatEchoed).toBe(true);
  673 | 
  674 |       await shot(page, "chat-echo");
  675 |     }
  676 | 
  677 |     const fatal = errors.filter((e) => !e.includes("favicon"));
  678 |     expect(fatal).toHaveLength(0);
  679 |   });
  680 | 
  681 |   // -------------------------------------------------------------------------
  682 |   // Supplemental: Game-Over → return to lobby → can create another room
  683 |   // -------------------------------------------------------------------------
  684 |   test("game-over → back to lobby → create new room works", async ({ page }) => {
  685 |     test.setTimeout(180_000);
  686 |     const errors: string[] = [];
  687 |     page.on("pageerror", (err) => errors.push(err.message));
  688 |     await injectStateRelay(page);
> 689 |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  690 | 
  691 |     await page.locator("#nickname").fill("LoopTester");
  692 |     await page.locator("#botCount").selectOption("3");
  693 |     await page.locator("#createRoom").click();
  694 |     await page.locator("#startGame").click();
  695 |     await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });
  696 | 
  697 |     // Drive to game over (auto-pilot, just roll and decline everything)
  698 |     for (let i = 0; i < 250; i++) {
  699 |       const arrived = await waitForAction(page, 60_000);
  700 |       if (arrived === "gameover") break;
  701 |       if (arrived === "timeout") break;
  702 |       if (arrived === "spectator") {
  703 |         // wait for game over
  704 |         await page.waitForFunction(
  705 |           () => (document.getElementById("gameOverBanner") as HTMLElement | null)?.style.display === "flex",
  706 |           undefined,
  707 |           { timeout: 90_000 },
  708 |         ).catch(() => null);
  709 |         break;
  710 |       }
  711 |       if (arrived === "ransom") {
  712 |         await page.locator("#ransomBtn").click();
  713 |       } else if (arrived === "buy") {
  714 |         await page.locator("#buyOfferDeclineBtn").click();
  715 |       } else {
  716 |         await page.locator("#rollBtn").click();
  717 |         await page.waitForTimeout(300);
  718 |         const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
  719 |         if (buyNow) await page.locator("#buyOfferDeclineBtn").click();
  720 |       }
  721 |       // Dismiss action card if it appears
  722 |       const ac = await page.locator("#actionCardPopup").isVisible().catch(() => false);
  723 |       if (ac) await page.locator("#actionCardConfirmBtn").click().catch(() => {});
  724 |       await page.waitForTimeout(150);
  725 |     }
  726 | 
  727 |     const goVisible = await page.locator("#gameOverBanner").isVisible().catch(() => false);
  728 |     if (!goVisible) {
  729 |       console.log("Game over not reached in allotted turns — skipping post-game assertions");
  730 |       return;
  731 |     }
  732 | 
  733 |     // Click "Zurück zur Lobby"
  734 |     await page.locator("#gameOverRestart").click();
  735 |     await page.waitForTimeout(1_000);
  736 | 
  737 |     // Lobby must be visible again
  738 |     await expect(page.locator("#lobby")).toBeVisible({ timeout: 10_000 });
  739 |     await shot(page, "back-to-lobby-after-game-over");
  740 | 
  741 |     // Can create a second room
  742 |     await page.locator("#nickname").fill("SecondGame");
  743 |     await page.locator("#botCount").selectOption("3");
  744 |     await page.locator("#createRoom").click();
  745 |     await expect(page.locator("#startGame")).toBeVisible({ timeout: 10_000 });
  746 |     console.log("Second room created successfully after game-over return");
  747 | 
  748 |     const fatal = errors.filter((e) => !e.includes("favicon"));
  749 |     expect(fatal).toHaveLength(0);
  750 |   });
  751 | 
  752 |   // -------------------------------------------------------------------------
  753 |   // Supplemental: Reconnect after reload
  754 |   // -------------------------------------------------------------------------
  755 |   test("session persists across page reload", async ({ page }) => {
  756 |     test.setTimeout(120_000);
  757 |     const errors: string[] = [];
  758 |     page.on("pageerror", (err) => errors.push(err.message));
  759 |     await injectStateRelay(page);
  760 |     await page.goto("/");
  761 | 
  762 |     await page.locator("#nickname").fill("ReconnectTester");
  763 |     await page.locator("#botCount").selectOption("3");
  764 |     await page.locator("#createRoom").click();
  765 |     await page.locator("#startGame").click();
  766 |     await expect(page.locator("#gameHud")).toBeVisible({ timeout: 15_000 });
  767 | 
  768 |     // Play a few turns to ensure game is active
  769 |     for (let i = 0; i < 5; i++) {
  770 |       const arrived = await waitForAction(page, 30_000);
  771 |       if (arrived === "gameover" || arrived === "spectator" || arrived === "timeout") break;
  772 |       if (arrived === "ransom") {
  773 |         await page.locator("#ransomBtn").click();
  774 |       } else if (arrived === "buy") {
  775 |         await page.locator("#buyOfferDeclineBtn").click();
  776 |       } else {
  777 |         await page.locator("#rollBtn").click();
  778 |         await page.waitForTimeout(300);
  779 |         const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
  780 |         if (buyNow) await page.locator("#buyOfferDeclineBtn").click();
  781 |       }
  782 |       await page.waitForTimeout(200);
  783 |     }
  784 | 
  785 |     // Check that session is saved
  786 |     const session = await page.evaluate(() => localStorage.getItem("laspoly_session"));
  787 |     console.log(`Session in localStorage: ${session ? "yes" : "no"}`);
  788 |     if (!session) {
  789 |       console.log("No session — skipping reconnect test");
```