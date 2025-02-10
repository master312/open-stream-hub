import { Module } from "@nestjs/common";
import { DatabaseModule } from "./mongodb.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { StreamModule } from "../stream/stream.module";
import { RtmpServerService } from "./rtmp-server.service";

@Module({
  imports: [DatabaseModule, StreamModule],
  controllers: [AppController],
  providers: [AppService, RtmpServerService],
})
export class AppModule {}
