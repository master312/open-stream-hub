import { IService } from "./ServiceInterface.ts";
import { streamsRepository } from "../repository/index.ts";
import { ffmpegRunnerService } from "./index.ts";
import { rtmpInjestService } from "./index.ts";
import { StreamInstance } from "../models/stream.ts";
import { FfmpegProcess } from "../models/ffmpegRunner.ts";

/**
 * This class is high level management of all stream instances.
 * It takes care of starting, stopping, tracking, and state management of stream instances.
 */

export class StreamMgrService implements IService {
  constructor() {}

  async initialize(): Promise<void> {
    rtmpInjestService.eventEmitter.on(
      "injest:start",
      this.onInjestStarted.bind(this),
    );

    rtmpInjestService.eventEmitter.on(
      "injest:stopped",
      this.onInjestStopped.bind(this),
    );

    ffmpegRunnerService.eventEmitter.on(
      "process:status",
      this.onFfmpegProcessStatusUpdated.bind(this),
    );

    new Promise((resolve) => setTimeout(resolve, 500)).then(async () => {
      // Resore all streams
      const streams = await streamsRepository.findAll();
      for (const stream of streams) {
        if (stream.state === "Stopped") continue;
        stream.state = "Stopped";
        // REMAINDER: Might be too much for DB to handle with large number of streams
        await streamsRepository.update(stream.id, stream);
        await this.startStream(stream.id);
      }

      rtmpInjestService.setAcceptEnabled(true);
    });
  }

  async shutdown(): Promise<void> {
    await this.stopAllStreams();
  }

  async startStream(streamId: string): Promise<void> {
    const stream = await streamsRepository.findById(streamId);
    if (!stream) {
      throw new Error(`Stream with id ${streamId} not found`);
    }

    // Falidate state
    if (stream.state !== "Stopped") {
      throw new Error(
        `Tried to start stream ${streamId} but it's in state ${stream.state}`,
      );
    }

    // Restore destination to default state
    for (var i = 0; i < stream.destinations.length; i++) {
      stream.destinations[i].state = "Disconnected";
      stream.destinations[i].error = undefined;
    }

    const newStream: StreamInstance = { ...stream, state: "Waiting" };
    await streamsRepository.update(streamId, newStream);
  }

  async stopStream(streamId: string): Promise<void> {
    const stream = await streamsRepository.findById(streamId);
    if (!stream) {
      throw new Error(`Stream with id ${streamId} not found`);
    }

    if (stream.state === "Stopped") {
      throw new Error(
        `Tried to stop stream ${streamId} but it's alreadt stopped`,
      );
    }

    const newStream: StreamInstance = { ...stream, state: "Stopped" };
    await streamsRepository.update(streamId, newStream);
    rtmpInjestService.kickClient(streamId);
    ffmpegRunnerService.stopStream(streamId);
  }

  // Invoked when actial stream data start flowing in from the user's source
  private async onInjestStarted(stream: StreamInstance): Promise<void> {
    if (!stream) {
      throw new Error(`Could not start inject.. Stream is NULL`);
    }

    if (stream.state !== "Waiting") {
      throw new Error(
        `Tried to start stream ${stream.id} but it's in state ${stream.state}`,
      );
    }

    console.log(`Stream inject ${stream.id} started`);
    const newStream: StreamInstance = { ...stream, state: "Live" };
    await streamsRepository.update(stream.id, newStream);
    ffmpegRunnerService.startStream(stream);
  }

  // Invoked when actual data injection from thje client stops
  private async onInjestStopped(streamId: string) {
    const stream = await streamsRepository.findById(streamId);
    if (!stream) {
      throw new Error(`Stream with id ${streamId} not found`);
    }

    if (stream.state !== "Live") {
      // Not en error. No even need to log except in some extreme dev cases
      // throw new Error(`On inject stopped, invalid state ${stream.state}`);
      return;
    }

    await ffmpegRunnerService.stopStream(streamId);
    await streamsRepository.update(streamId, { state: "Waiting" });
  }

  private async stopAllStreams(): Promise<void> {
    const streams = await streamsRepository.findAll();
    const stopPromises = streams.map((stream) => {
      if (stream.state !== "Stopped") {
        this.stopStream(stream.id);
      }
    });
    await Promise.all(stopPromises);
  }

  private async onFfmpegProcessStatusUpdated(ffmpegProcess: FfmpegProcess) {
    const streamId = ffmpegProcess.stream;
    const destinationId = ffmpegProcess.destination;

    const stream = await streamsRepository.findById(streamId);
    if (!stream) return;
    const destination = stream?.destinations.find(
      (dest) => dest.id === destinationId,
    );
    if (!destination) return;

    switch (ffmpegProcess.status) {
      case "Starting":
        destination.state = "Connecting";
        break;
      case "Running":
        destination.state = "Live";
        break;
      default:
        destination.state = "Disconnected";
        break;
    }

    await streamsRepository.update(stream.id, {
      destinations: stream.destinations,
    });
  }
}
