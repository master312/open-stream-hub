import express from "npm:express";
import cors from "npm:cors";
import { serviceManager } from "./service/index.ts";
import { createStreamRoutes } from "./routes/streamRoutes.ts";

async function main() {
  const app = new express();

  // Enable CORS
  // app.use(
  //   oakCors({
  //     origin: "*", // Allow all origins (not recommended for production)
  //     // origin: "http://localhost:5173", // Your frontend URL
  //     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  //     allowedHeaders: ["Content-Type", "Authorization"],
  //     credentials: true,
  //   }),
  // );

  await serviceManager.initialize();
  if (!serviceManager.isInitialized()) {
    throw new Error("Service manager failed to initialize!");
  }

  // Setup routes
  const router = express.Router();
  createStreamRoutes(router);

  // Use router
  app.use(cors());
  app.use(express.json());
  app.use(router);

  // Start HTTP server
  const PORT = Deno.env.get("PORT") || 3000;
  console.log(`Starting server on port ${PORT}....`);

  await app.listen({ port: Number(PORT) });
}

main().catch(console.error);
