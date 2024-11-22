import { StreamInstance } from "../models/stream.ts";
import { config } from "../config.ts";

export function getStreamInstanceInternalRtmpUrl(streamApiKey: string): string {
  return `rtmp://localhost:${config.injestRtmpServer.rtmp.port}/${config.injestRtmpServer.linkRoot.replace("/", "")}${streamApiKey}`;
}
