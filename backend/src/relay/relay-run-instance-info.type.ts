import { FfmpegCommand } from "fluent-ffmpeg";

export class RelayInstanceRunInfo {
  constructor(public readonly streamId: string,
              public readonly destinationId: string,
              public readonly runner: FfmpegCommand,
              public isExiting: boolean = false) {
  }
}