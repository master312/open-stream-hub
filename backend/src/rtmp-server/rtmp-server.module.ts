import { Module } from "@nestjs/common";
import { RtmpServerService } from "../rtmp-server/rtmp-server.service";
import { StreamModule } from "../stream/stream.module";

@Module({
  imports: [StreamModule],
  controllers: [],
  providers: [RtmpServerService],
  exports: [RtmpServerService],
})
export class RtmpServerModule {}
