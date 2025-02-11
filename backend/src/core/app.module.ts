import { Module } from "@nestjs/common";
import { DatabaseModule } from "./mongodb.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { StreamModule } from "../stream/stream.module";
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RtmpServerModule } from "../rtmp-server/rtmp-server.module";
import { RelayModule } from "../relay/relay.module";
import { HldServerModule } from "../hls-server/hls-server.module";

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DatabaseModule,
    RtmpServerModule,
    RelayModule,
    StreamModule,
    HldServerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
