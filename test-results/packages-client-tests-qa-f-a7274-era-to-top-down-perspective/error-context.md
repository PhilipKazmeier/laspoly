# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: packages/client/tests/qa-full-game.spec.ts >> QA Full-Game Playthrough >> view toggle switches camera to top-down perspective
- Location: packages/client/tests/qa-full-game.spec.ts:815:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
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
  790 |       return;
  791 |     }
  792 | 
  793 |     // Reload
  794 |     await page.reload({ waitUntil: "domcontentloaded" });
  795 |     await page.waitForTimeout(3_000);
  796 | 
  797 |     // Should reconnect: lobby should NOT persist, game HUD or room panel should appear
  798 |     const lobbyAfterReload = await page.locator("#lobby").isVisible().catch(() => false);
  799 |     const hudAfterReload = await page.locator("#gameHud").isVisible().catch(() => false);
  800 |     const roomAfterReload = await page.locator("#roomPanel").isVisible().catch(() => false);
  801 | 
  802 |     console.log(`After reload — lobby=${lobbyAfterReload}, hud=${hudAfterReload}, room=${roomAfterReload}`);
  803 |     await shot(page, "reconnect-after-reload");
  804 | 
  805 |     // Either HUD or room panel must be visible (not lobby from scratch)
  806 |     expect(hudAfterReload || roomAfterReload, "After reload, should be back in game/room, not at lobby").toBe(true);
  807 | 
  808 |     const fatal = errors.filter((e) => !e.includes("favicon"));
  809 |     expect(fatal).toHaveLength(0);
  810 |   });
  811 | 
  812 |   // -------------------------------------------------------------------------
  813 |   // Supplemental: Top-down view renders different camera angle
  814 |   // -------------------------------------------------------------------------
  815 |   test("view toggle switches camera to top-down perspective", async ({ page }) => {
  816 |     test.setTimeout(60_000);
  817 |     const errors: string[] = [];
  818 |     page.on("pageerror", (err) => errors.push(err.message));
> 819 |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  820 | 
  821 |     await page.locator("#nickname").fill("ViewToggle");
  822 |     await page.locator("#botCount").selectOption("3");
  823 |     await page.locator("#createRoom").click();
  824 |     await page.locator("#startGame").click();
  825 |     await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  826 | 
  827 |     // Roll and wait for scene to settle
  828 |     await page.locator("#rollBtn").click();
  829 |     await page.waitForTimeout(3_000);
  830 |     const buyNow = await page.locator("#buyOfferPanel").isVisible().catch(() => false);
  831 |     if (buyNow) await page.locator("#buyOfferDeclineBtn").click();
  832 | 
  833 |     // Standard view screenshot
  834 |     await shot(page, "view-standard", { canvas: true });
  835 | 
  836 |     // Toggle to top-down
  837 |     const viewBtn = page.locator("#headerViewBtn");
  838 |     await expect(viewBtn).toBeVisible();
  839 |     const textBefore = await viewBtn.textContent();
  840 |     await viewBtn.click();
  841 |     await page.waitForTimeout(800);
  842 |     const textAfter = await viewBtn.textContent();
  843 |     console.log(`View button: before="${textBefore}" after="${textAfter}"`);
  844 |     expect(textAfter).toMatch(/Vogel/);
  845 | 
  846 |     // Top-down screenshot
  847 |     await shot(page, "view-topdown", { canvas: true });
  848 | 
  849 |     // Toggle back
  850 |     await viewBtn.click();
  851 |     await page.waitForTimeout(400);
  852 |     const textBack = await viewBtn.textContent();
  853 |     expect(textBack).toMatch(/Standard/);
  854 | 
  855 |     const fatal = errors.filter((e) => !e.includes("favicon"));
  856 |     expect(fatal).toHaveLength(0);
  857 |   });
  858 | 
  859 |   // -------------------------------------------------------------------------
  860 |   // Supplemental: Leave room from header (no crash)
  861 |   // -------------------------------------------------------------------------
  862 |   test("leave room from header returns to lobby", async ({ page }) => {
  863 |     test.setTimeout(60_000);
  864 |     const errors: string[] = [];
  865 |     page.on("pageerror", (err) => errors.push(err.message));
  866 |     await page.goto("/");
  867 | 
  868 |     await page.locator("#nickname").fill("LeaveTester");
  869 |     await page.locator("#botCount").selectOption("3");
  870 |     await page.locator("#createRoom").click();
  871 |     await page.locator("#startGame").click();
  872 |     await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  873 | 
  874 |     // Click the "✕ Verlassen" button in the header
  875 |     const leaveBtn = page.locator("#gameHeader button").filter({ hasText: "Verlassen" });
  876 |     await expect(leaveBtn).toBeVisible();
  877 |     await leaveBtn.click();
  878 |     await page.waitForTimeout(1_000);
  879 | 
  880 |     // Should be back at lobby
  881 |     await expect(page.locator("#lobby")).toBeVisible({ timeout: 10_000 });
  882 |     await shot(page, "leave-room-to-lobby");
  883 | 
  884 |     const fatal = errors.filter((e) => !e.includes("favicon"));
  885 |     expect(fatal).toHaveLength(0);
  886 |   });
  887 | });
  888 | 
```