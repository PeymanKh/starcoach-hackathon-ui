import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      // Local dev: the browser calls /api on the Vite server, Vite forwards it to Django.
      // Same origin for the browser, so no CORS is needed locally.
      proxy: {
        "/api": {
          target: env.API_PROXY_TARGET || "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
