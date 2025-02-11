import { Module } from "@nestjs/common";
import { HlsServerController } from "./hls-server.controller";
import { HlsServerService } from "./hls-server.service";

@Module({
  imports: [],
  controllers: [HlsServerController],
  providers: [HlsServerService],
})
export class HldServerModule {}
