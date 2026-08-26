/// <reference types="vitest" />

import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

// Safari 9 / iOS 9 dedicated legacy build
// Entry: src-legacy/index.html  →  Output: dist/legacy/
export default defineConfig({
  root: path.resolve(__dirname, "src-legacy"),
  base: "/legacy/",
  plugins: [
    react(),
    legacy({
      targets: ["safari 9", "ios_saf 9"],
      polyfills: false,
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
      modernPolyfills: false,
      renderLegacyChunks: true,
      renderModernChunks: false,
    }),
  ],
  resolve: {
    alias: {
      // Allow src-legacy files to import from src/ with "../../src" path
      "../../src": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/legacy"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "src-legacy/index.html"),
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "vendor-react";
          if (id.includes("node_modules/react-router")) return "vendor-router";
        },
      },
    },
  },
});

