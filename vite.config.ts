import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api/notion": {
        target: "https://api.notion.com/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/notion/, ""),
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log("🔄 Vite proxy: Forwarding request to Notion API");
            // Add Notion API headers
            proxyReq.setHeader("Notion-Version", "2022-06-28");
            // Add API key from environment
            const apiKey = process.env.VITE_NOTION_API_KEY;
            if (apiKey) {
              proxyReq.setHeader("Authorization", `Bearer ${apiKey}`);
            }
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            console.log(
              "📥 Vite proxy: Received response from Notion API:",
              proxyRes.statusCode,
            );
          });
          proxy.on("error", (err, req, res) => {
            console.error("❌ Vite proxy error:", err);
          });
        },
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
