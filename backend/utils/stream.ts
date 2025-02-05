import { StreamInstance } from "../models/stream.ts";
import { config } from "../config.ts";

// This method is used to generate RTMP url for the internal FFMPEG processes
export function getStreamInstanceInternalRtmpUrl(streamApiKey: string): string {
  return `rtmp://localhost:${config.injestRtmpServer.rtmp.port}/${config.injestRtmpServer.linkRoot}/${streamApiKey}`;
}
