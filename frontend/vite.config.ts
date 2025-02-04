import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { getConfig } from "./hack_config";

const config = getConfig();

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    host: true,
    port: parseInt(config.FRONTEND_PORT),
  },
  define: {
    "import.meta.env.REST_API_HOST": JSON.stringify(config.REST_API_HOST),
    "import.meta.env.REST_API_PORT": JSON.stringify(config.REST_API_PORT),
  },
});

// Restrictive CORS configuration for Deno production
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// });
