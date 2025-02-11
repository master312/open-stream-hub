import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { StreamRelayDestination } from "../models/stream-relay-destination.model";
import * as Ffmpeg from 'fluent-ffmpeg';
import { RelayStatusEvent } from "./relay-status.event";
import { RelayInstanceRunInfo } from "./relay-run-instance-info.type";
import { TheConfig } from "../../config";

/**
 * This service basically only manages running of ffmpeg instances that serve as stream relays,
 * and fires related events.
 * Should not do anything more than that.
 */
@Injectable()
export class StreamRelayRunnerService {

  // Map of all currently running instances
  // <streamId> < <destinationId, RelayInstanceRunInfo> >
  private activeStreams: Map<string, Map<string, RelayInstanceRunInfo>>;

  constructor(private eventEmitter: EventEmitter2) {
    this.activeStreams = new Map();
  }

  async onModuleInit() {
  }

  isRelayRunning(streamId: string, destinationId: string): boolean {
    const activeDestinations = this.activeStreams.get(streamId);
    if (!activeDestinations) {
      return false;
    }

    return activeDestinations.has(destinationId);
  }

  public startRelay(streamId: string, destination: StreamRelayDestination): boolean {
    const destId = (destination._id as any).toString();
    const command = Ffmpeg()
      .input(`rtmp://localhost:${TheConfig.nodeMediaServer.rtmp.port}${TheConfig.nodeMediaServer.watchRoot}/${streamId}`)
      .outputOptions([
        '-c:v copy', // Copy video codec
        '-c:a aac',  // Transcode audio to AAC
        '-f flv'     // Force FLV format
      ]);

    const ffmpegFlags = destination.ffmpegFlags;
    if (ffmpegFlags && ffmpegFlags.length > 0) {
      command.outputOptions(ffmpegFlags.split(' '));
    }

    let activeDestinations = this.activeStreams.get(streamId);
    if (!activeDestinations) {
      activeDestinations = new Map<string, RelayInstanceRunInfo>();
      this.activeStreams.set(streamId, activeDestinations);
    }

    const existingStream = activeDestinations.get(destId);
    if (existingStream) {
      Logger.error(`Tried to start relay, but it's ffmpeg instance already exists. Relay: ${destId} streamID: ${streamId}`, "RelayRunner");
      return false;
    }

    const runner = command.save(`${destination.serverUrl}/${destination.streamKey}`);
    runner
      .on('start', () => this.onFfmpegStart(runner, streamId, destId))
      .on('error', (err: Error) => this.onFfmpegError(runner, err, streamId, destId))
      .on('end', () => this.onFfmpegStop(runner, streamId, destId));

    activeDestinations.set(destId, new RelayInstanceRunInfo(streamId, destId, runner));
    return true;
  }

  public stopRelay(streamId: string, destinationId: string) {
    const activeDestinations = this.activeStreams.get(streamId);
    if (!activeDestinations) {
      // Logger.warn(`Tried to stop relay, but no active destinations found for stream ${streamId}`, "RelayRunner");
      return;
    }

    const instanceRunInfo = activeDestinations.get(destinationId);
    if (!instanceRunInfo) {
      // Logger.warn(`Tried to stop relay, but no ffmpeg instance found for destination ${destinationId}`, "RelayRunner");
      return;
    }

    if (instanceRunInfo.isExiting) {
      return;
    }

    instanceRunInfo.isExiting = true;
    this.eventEmitter.emit("stream.relay.runner.stop", new RelayStatusEvent(streamId, destinationId));
    activeDestinations.delete(destinationId);
    instanceRunInfo.runner.kill("SIGKILL");
  }

  private onFfmpegStart(runner: Ffmpeg.FfmpegCommand, streamId: string, destinationId: string) {
    Logger.log(`Ffmpeg relay started. StreamID: ${streamId}, RelayID: ${destinationId}`, "RelayRunner");
    this.eventEmitter.emit("stream.relay.runner.start", new RelayStatusEvent(streamId, destinationId));
  }

  private onFfmpegStop(runner: Ffmpeg.FfmpegCommand, streamId: string, destinationId: string) {
    Logger.log(`Ffmpeg relay stopped. StreamID: ${streamId}, RelayID: ${destinationId}`, "RelayRunner");
    this.stopRelay(streamId, destinationId);
  }

  private onFfmpegError(runner: Ffmpeg.FfmpegCommand, error: Error, streamId: string, destinationId: string) {
    Logger.error(`Ffmpeg relay error. StreamID: ${streamId}, RelayID: ${destinationId}`, "RelayRunner");
    Logger.error(error, "RelayRunner");
    this.eventEmitter.emit("stream.relay.runner.error", new RelayStatusEvent(streamId, destinationId));
    this.stopRelay(streamId, destinationId);
  }
}
