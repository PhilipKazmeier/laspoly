import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  resolve: {
    alias: {
      "@laspoly/shared": resolve(__dirname, "../shared/src/index.ts"),
    },
  },
  server: {
    proxy: {
      "/ws": {
        target: "ws://localhost:8080",
        ws: true,
        rewrite: (path) => path.replace(/^\/ws/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
