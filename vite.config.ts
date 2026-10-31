import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  // The router plugin must run before React so it can generate src/routeTree.gen.ts.
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    // The WebGL stack (~250 kB gzip) is lazy-loaded, off the critical path.
    chunkSizeWarningLimit: 1000,
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
