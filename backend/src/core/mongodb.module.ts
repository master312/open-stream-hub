import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TheConfig } from "../../config";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: TheConfig.database.mongo.uri,
        ...TheConfig.database.mongo.options,
      }),
    }),
  ],
})
export class DatabaseModule {}
