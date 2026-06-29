import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  use: { baseURL: "http://localhost:4173" },
  webServer: [
    {
      command: "npx tsx /Users/philip/Work/Other/laspoly/packages/server/src/index.ts",
      port: 8080,
      reuseExistingServer: true,
      cwd: "/Users/philip/Work/Other/laspoly",
      timeout: 30_000,
    },
    {
      // preview runs on :4173 but the game server is on :8080, so bake the ws target.
      command: "VITE_WS_URL=ws://localhost:8080 npm run build && npm run preview",
      port: 4173,
      reuseExistingServer: true,
      cwd: "/Users/philip/Work/Other/laspoly/packages/client",
      timeout: 90_000,
    },
  ],
});
