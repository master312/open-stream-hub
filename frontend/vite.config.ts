import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    host: true, // Listen on all network interfaces
    port: 3000,
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
