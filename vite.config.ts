import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "/helpdesk/",
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": { target: env.VITE_BACKEND_ORIGIN || "http://127.0.0.1:5050", changeOrigin: true },
        "/helpdesk/api": { target: env.VITE_BACKEND_ORIGIN || "http://127.0.0.1:5050", changeOrigin: true, rewrite: (path) => path.replace(/^\/helpdesk\/api/, "/api") },
      },
    },
  };
});
