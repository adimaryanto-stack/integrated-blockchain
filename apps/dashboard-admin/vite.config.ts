import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 2026,
    proxy: {
      "/api/admin": {
        target: "http://localhost:2028",
        changeOrigin: true,
      },
    },
  },
});
