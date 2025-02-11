import { Controller, Get, Header, NotFoundException, Param } from "@nestjs/common";
import { HlsServerService } from "./hls-server.service";

@Controller("hls")
export class HlsServerController {
  constructor(private readonly hlsServerService: HlsServerService) {
  }

  @Get("/:streamId/playlist.m3u8")
  @Header("Content-Type", "application/x-mpegURL")
  async servePlaylist(@Param("streamId") streamId: string) {
    if (!streamId) {
      return null;
    }

    return this.hlsServerService.servePlaylist(streamId);
  }

  @Get('/:streamId/status')
  getStreamStatus(@Param("streamId") streamId: string) {
    return {
      isStreaming: this.hlsServerService.isRunning(streamId),
    };
  }

  @Get('/:streamId/:segment')
  @Header('Content-Type', 'video/MP2T')
  serveSegment(@Param("streamId") streamId: string, @Param('segment') segment: string) {
    if (!segment.endsWith('.ts')) {
      throw new NotFoundException();
    }

    return this.hlsServerService.serveSegment(streamId, segment);
  }

}
