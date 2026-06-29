import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "**/node_modules/**",
      "**/packages/client/tests/**",
      "**/.claude/**", // stale agent worktrees must not pollute the test run
    ],
  },
});
