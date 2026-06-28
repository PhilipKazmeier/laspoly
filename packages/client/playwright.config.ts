import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  use: { baseURL: "http://localhost:4173" },
  webServer: [
    {
      command: "npx tsx /Users/philip/Work/Other/laspoly/packages/server/src/index.ts",
      port: 8080,
      reuseExistingServer: false,
      cwd: "/Users/philip/Work/Other/laspoly",
      timeout: 30_000,
    },
    {
      command: "npm run build && npm run preview",
      port: 4173,
      reuseExistingServer: false,
      cwd: "/Users/philip/Work/Other/laspoly/packages/client",
      timeout: 60_000,
    },
  ],
});
