import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ if needed) from .env files
  const env = loadEnv(mode, process.cwd(), "");

  return {
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
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              console.log("🔄 Vite proxy: Forwarding request to Notion API");
              // Add Notion API headers
              proxyReq.setHeader("Notion-Version", "2022-06-28");

              // Add API key from environment (local dev)
              const apiKey = env.VITE_NOTION_API_KEY;
              if (apiKey) {
                proxyReq.setHeader("Authorization", `Bearer ${apiKey}`);
              } else {
                console.warn(
                  "⚠️ VITE_NOTION_API_KEY is not set. Notion requests will likely return 401.",
                );
              }
            });

            proxy.on("proxyRes", (proxyRes) => {
              console.log(
                "📥 Vite proxy: Received response from Notion API:",
                proxyRes.statusCode,
              );
            });

            proxy.on("error", (err) => {
              console.error("❌ Vite proxy error:", err);
            });
          },
        },
      },
    },
    build: {
      outDir: "dist",
    },
  };
});
