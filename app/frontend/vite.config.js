import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The PC Assist backend listens on this address on the same computer.
const backend = "http://127.0.0.1:9140";

export default defineConfig({
  plugins: [react()],
  // Relative paths, so the built files also open correctly from a plain
  // file (as the desktop app does). Makes no difference when served from
  // a web server, as npm run dev / preview already do.
  base: "./",
  server: { port: 5173, proxy: { "/api": backend } },
  preview: { port: 4173, proxy: { "/api": backend } },
});
