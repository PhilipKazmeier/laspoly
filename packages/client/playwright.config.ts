import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Resolve repo paths relative to this config file so the suite runs on any
// checkout (the paths were previously hardcoded to a developer machine).
const clientDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(clientDir, "../..");

export default defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  use: { baseURL: "http://localhost:4173" },
  webServer: [
    {
      command: "npx tsx packages/server/src/index.ts",
      port: 8080,
      reuseExistingServer: true,
      cwd: repoRoot,
      timeout: 30_000,
    },
    {
      // preview runs on :4173 but the game server is on :8080, so bake the ws target.
      command: "VITE_WS_URL=ws://localhost:8080 npm run build && npm run preview",
      port: 4173,
      reuseExistingServer: true,
      cwd: clientDir,
      timeout: 90_000,
    },
  ],
});
