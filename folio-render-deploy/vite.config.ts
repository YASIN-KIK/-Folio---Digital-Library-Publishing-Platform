import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const backendPort = process.env.ALO_APP_BACKEND_PORT || process.env.BACKEND_PORT || "8080";
const backendTarget = `http://127.0.0.1:${backendPort}`;
const publicHost = process.env.ALO_APP_PUBLIC_HOST;

// Relative assets respect the base href injected by the auth gateway.
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    allowedHosts: publicHost ? [publicHost] : [],
    proxy: {
      "/api": { target: backendTarget, changeOrigin: true, ws: true },
      "/health": { target: backendTarget, changeOrigin: true },
    },
  },
});
