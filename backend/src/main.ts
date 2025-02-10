import * as dotenv from "dotenv";
dotenv.config({ path: process.cwd() + `/.env.${process.env.NODE_ENV}` });

console.log("Using env: ", process.env.NODE_ENV);

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./core/app.module";

import { TheConfig } from "../config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow cors from all origins... for now
  app.enableCors();

  app.setGlobalPrefix("api");
  const port = Number(TheConfig.port);
  console.log("API listening on port:", port);
  await app.listen(port);
}

bootstrap();
