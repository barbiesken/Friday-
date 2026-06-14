import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the same bundle works inside the Tauri shell (Phase 2).
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { port: 5173, strictPort: false },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 1500,
    outDir: "dist",
  },
});
