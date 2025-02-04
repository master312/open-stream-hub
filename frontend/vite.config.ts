import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    host: true, // Listen on all network interfaces
    port: parseInt(Deno.env.get("FRONTEND_PORT")),
  },
  define: {
    "import.meta.env.REST_API_HOST": JSON.stringify(Deno.env.get("REST_API_HOST")),
    "import.meta.env.REST_API_PORT": JSON.stringify(Deno.env.get("REST_API_PORT")),
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
