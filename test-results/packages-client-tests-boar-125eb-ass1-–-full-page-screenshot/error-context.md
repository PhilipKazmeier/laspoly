# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: packages/client/tests/board-pass1.spec.ts >> board pass1 – full page screenshot
- Location: packages/client/tests/board-pass1.spec.ts:15:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { fileURLToPath } from "url";
  3  | import * as path from "path";
  4  | import * as fs from "fs";
  5  | 
  6  | const __filename = fileURLToPath(import.meta.url);
  7  | const __dirname = path.dirname(__filename);
  8  | 
  9  | const SCREENSHOTS_DIR = path.join(__dirname, "__screenshots__");
  10 | 
  11 | test.beforeAll(() => {
  12 |   fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  13 | });
  14 | 
  15 | test("board pass1 – full page screenshot", async ({ page }) => {
  16 |   const errors: string[] = [];
  17 |   page.on("console", (msg) => {
  18 |     if (msg.type() === "error") errors.push(msg.text());
  19 |   });
  20 |   page.on("pageerror", (err) => errors.push(err.message));
  21 | 
> 22 |   await page.goto("/");
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  23 |   await expect(page.locator("#renderCanvas")).toBeVisible();
  24 | 
  25 |   // Start a game with 3 bots
  26 |   await page.locator("#nickname").fill("ScreenTest");
  27 |   await page.locator("#botCount").selectOption("3");
  28 |   await page.locator("#createRoom").click();
  29 |   await page.locator("#startGame").click();
  30 | 
  31 |   // Wait for Roll button = game started
  32 |   await expect(page.locator("#rollBtn")).toBeVisible({ timeout: 30_000 });
  33 | 
  34 |   // Give the 3D board time to render tiles/textures
  35 |   await page.waitForTimeout(2_000);
  36 | 
  37 |   // Full-page screenshot
  38 |   await page.screenshot({
  39 |     path: path.join(SCREENSHOTS_DIR, "board-pass1.png"),
  40 |     fullPage: true,
  41 |   });
  42 | 
  43 |   // Canvas-only screenshot (board close-up)
  44 |   const canvas = page.locator("#renderCanvas");
  45 |   await canvas.screenshot({
  46 |     path: path.join(SCREENSHOTS_DIR, "board-pass1-canvas.png"),
  47 |   });
  48 | 
  49 |   // No fatal JS errors (underground.obj may 404 — that's OK)
  50 |   const fatal = errors.filter(
  51 |     (e) => !e.includes("favicon") && !e.includes("underground.obj")
  52 |   );
  53 |   expect(fatal).toHaveLength(0);
  54 | });
  55 | 
```