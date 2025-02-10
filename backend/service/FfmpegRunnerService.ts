import { IService } from "./ServiceInterface.ts";
import { StreamInstance, StreamDestination } from "../models/stream.ts";
import EventEmitter from "node:events";
import { spawn, ChildProcess } from "node:child_process";
import { FfmpegProcess } from "../models/ffmpegRunner.ts";
import { getStreamInstanceInternalRtmpUrl } from "../utils/stream.ts";

/**
 * This class is responsible for managing ffmpeg processes for each stream instance.
 * It takes care of starting, stopping, and monitoring ffmpeg processes for each stream instance.
 * Events:
 *   - process:status: <FfmpegProcess>  Emitted when the status of a ffmpeg process changes
 */

export class FfmpegRunnerService implements IService {
  public eventEmitter: EventEmitter;

  // Map running ffmpeg processes mapped by streamId
  private activeStreams: Map<string, FfmpegProcess[]>;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.activeStreams = new Map();
  }

  async initialize(): Promise<void> {
    try {
      // Check if ffmpeg process exists
      const process = spawn("ffmpeg", ["-version"]);
      await new Promise((resolve, reject) => {
        process.on("exit", (code) => {
          if (code === 0) resolve(undefined);
          else reject(new Error("FFmpeg check failed"));
        });
      });
    } catch (error) {
      throw new Error("FFmpeg is not installed or not accessible");
    }
  }

  async shutdown(): Promise<void> {
    for (const process of this.activeStreams.values()) {
      for (const ffmpegProcess of process) {
        this.killFfmpegProcess(ffmpegProcess);
      }
    }

    // Await untill this.activeStreams is empty
    await new Promise<void>((resolve) => {
      const checkArray = () => {
        if (this.activeStreams.size === 0) {
          resolve();
        } else {
          setTimeout(checkArray, 100);
        }
      };
      checkArray();
    });
  }

  // Will start stream for all destinations
  async startStream(stream: StreamInstance): Promise<void> {
    var existingStreams = this.activeStreams.get(stream.id);
    if (existingStreams && existingStreams.length > 0) {
      throw new Error("Destination already active. StreamID:" + stream.id + " ActiveStreams:" + existingStreams.length);
    }

    const processes: FfmpegProcess[] = [];
    this.activeStreams.set(stream.id, []);
    console.log("Starting ffmpeg processes for stream", stream.id);
    for (const destination of stream.destinations) {
      const process = await this.startFfmpegProcess(stream, destination);
      processes.push(process);
    }

    console.log(`Started '${processes.length}' ffmpeg processes for stream`, stream.id);

    this.activeStreams.set(stream.id, processes);
  }

  async stopStream(streamId: string): Promise<void> {
    if (!this.activeStreams.has(streamId)) {
      return;
    }

    const processes = this.activeStreams.get(streamId);
    if (!processes) return;
    await Promise.all(processes.map((process) => this.killFfmpegProcess(process)));
  }

  private async startFfmpegProcess(stream: StreamInstance, destination: StreamDestination): Promise<FfmpegProcess> {
    const ffmpegProcess: FfmpegProcess = {
      process: null,
      stream: stream.id,
      destination: destination.id,
      status: "Starting",
      lastHeartbeat: new Date(),
    };

    const args = FfmpegRunnerService.BuildFfmpegArgs(stream, destination);
    if (!args || args.length === 0) {
      throw new Error(`Error building ffmpeg args for ${stream.id} ${destination.id}`);
    }

    console.log(`Starting ffmpeg process wit args ${args.join(" ")}`);
    ffmpegProcess.process = spawn("ffmpeg", args);
    this.setupProcesEventListeners(ffmpegProcess);
    this.eventEmitter.emit("process:status", ffmpegProcess);
    return ffmpegProcess;
  }

  private async killFfmpegProcess(ffmpegProcess: FfmpegProcess): Promise<void> {
    const status = ffmpegProcess.status;
    if (status !== "Running" && status !== "Starting") {
      console.log("Debug: KillFFmpegProcess: process status: " + status + " Destination: " + ffmpegProcess.destination);
      return;
    }
    ffmpegProcess.status = "Stopping";
    ffmpegProcess.process.kill("SIGTERM");
    await this.eventEmitter.emit("process:status", ffmpegProcess);
  }

  private onProcessError(ffmpegProcess: FfmpegProcess, error: Error): void {
    if (ffmpegProcess.status !== "Stopping" && ffmpegProcess.status !== "Stopped") return;

    ffmpegProcess.error = error;
    console.error("FFMPEG-ERROR, Destination:", ffmpegProcess.destination, error);
  }

  private onProcessUpdate(ffmpegProcess: FfmpegProcess, message: string): void {
    if (ffmpegProcess.status === "Starting") {
      if (message.includes("Stream mapping:")) {
        ffmpegProcess.status = "Running";
        this.eventEmitter.emit("process:status", ffmpegProcess);
      }

      return;
    }

    if (ffmpegProcess.status !== "Running") return;
    if (message.includes("frame=")) {
      ffmpegProcess.lastHeartbeat = new Date();
    }
  }

  private onProcessExit(ffmpegProcess: FfmpegProcess, code: number): void {
    // Execute after 1ms delay, just to be safe
    setTimeout(() => {
      if (ffmpegProcess.status !== "Stopping") {
        console.log(`FFmpeg process exit with code ${code} with status ${ffmpegProcess.status}`);
      }

      if (code !== 0) {
        ffmpegProcess.error = new Error(`FFmpeg process exited with code ${code}`);
      }

      const processes = this.activeStreams.get(ffmpegProcess.stream);
      if (processes && processes.length > 0) {
        processes.splice(processes.indexOf(ffmpegProcess), 1);
      }

      if (!processes || processes.length === 0) this.activeStreams.delete(ffmpegProcess.stream);

      ffmpegProcess.status = "Stopped";
      this.eventEmitter.emit("process:status", ffmpegProcess);
    }, 1);
  }

  private setupProcesEventListeners(ffmpegProcess: FfmpegProcess): void {
    const process = ffmpegProcess.process;
    const streamId = ffmpegProcess.stream;
    process.stdout.on("data", (data) => {
      console.log(`[FFmpeg stdout data ${streamId}:${ffmpegProcess.destination}] ${data}`);
    });

    // NOTE: That FFmpeg writes its regular progress updates, statistics, and informational messages to stderr rather than stdout.
    process.stderr.on("data", (data) => {
      const message = data.toString();

      if (
        message.includes("Error") ||
        message.includes("error") ||
        message.includes("Invalid") ||
        message.includes("Unable to") ||
        message.includes("Failed")
      ) {
        this.onProcessError(ffmpegProcess, new Error(message));
      } else {
        this.onProcessUpdate(ffmpegProcess, message);
      }
    });

    process.on("exit", (code) => {
      this.onProcessExit(ffmpegProcess, code);
    });
  }

  private static BuildFfmpegArgs(stream: StreamInstance, destination: StreamDestination): string[] {
    const args: string[] = [
      "-i",
      getStreamInstanceInternalRtmpUrl(stream.apiKey),
      "-c:v",
      "copy", // Copy video codec
      "-c:a",
      "aac", // Transcode audio to AAC
      "-f",
      "flv", // Force FLV format
    ];

    // Add custom FFmpeg flags if specified
    if (stream.ffmpegFlags) {
      args.push(...stream.ffmpegFlags.split(" "));
    }

    // Add output URL
    args.push(destination.serverUrl + "/" + destination.streamKey);
    return args;
  }
}
