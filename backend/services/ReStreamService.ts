import { StreamInstance, StreamDestination } from "../models/interfaces.ts";
import { spawn, ChildProcess } from "node:child_process";

interface FFmpegProcess {
  process: ChildProcess;
  streamId: string;
  destinationId: string;
  startTime: Date;
  restartCount: number;
}

export class ReStreamService {
  private ffmpegProcesses: Map<string, FFmpegProcess> = new Map();
  private readonly MAX_RESTART_ATTEMPTS = 3;
  private readonly RESTART_COOLDOWN_MS = 5000;

  async startReStream(
    stream: StreamInstance,
    destination: StreamDestination,
  ): Promise<boolean> {
    const processKey = `${stream.id}-${destination.id}`;

    // Check if already running
    if (this.ffmpegProcesses.has(processKey)) {
      return true;
    }

    try {
      const ffmpegProcess = await this.createFFmpegProcess(stream, destination);

      this.ffmpegProcesses.set(processKey, {
        process: ffmpegProcess,
        streamId: stream.id,
        destinationId: destination.id,
        startTime: new Date(),
        restartCount: 0,
      });

      this.setupProcessMonitoring(processKey, stream, destination);

      return true;
    } catch (error) {
      console.error(`Failed to start restream for ${processKey}:`, error);
      return false;
    }
  }

  async stopReStream(streamId: string, destinationId: string): Promise<void> {
    const processKey = `${streamId}-${destinationId}`;
    const processInfo = this.ffmpegProcesses.get(processKey);

    if (processInfo) {
      processInfo.process.kill();
      this.ffmpegProcesses.delete(processKey);
    }
  }

  async stopAllStreams(streamId: string): Promise<void> {
    for (const [key, processInfo] of this.ffmpegProcesses.entries()) {
      if (processInfo.streamId === streamId) {
        await this.stopReStream(streamId, processInfo.destinationId);
      }
    }
  }

  private createFFmpegProcess(
    stream: StreamInstance,
    destination: StreamDestination,
  ): ChildProcess {
    const inputUrl = stream.rtmpEndpoint;
    const outputUrl = `${destination.serverUrl}/${destination.streamKey}`;

    const ffmpegArgs = [
      "-i",
      inputUrl,
      "-c",
      "copy", // Copy without re-encoding
      "-f",
      "flv",
      "-flags",
      "+global_header",
      outputUrl,
    ];

    const ffmpeg = spawn("ffmpeg", ffmpegArgs);

    // Basic logging
    ffmpeg.stdout.on("data", (data) => {
      console.log(`FFmpeg ${stream.id}-${destination.id} stdout: ${data}`);
    });

    ffmpeg.stderr.on("data", (data) => {
      console.log(`FFmpeg ${stream.id}-${destination.id} stderr: ${data}`);
    });

    return ffmpeg;
  }

  private setupProcessMonitoring(
    processKey: string,
    stream: StreamInstance,
    destination: StreamDestination,
  ): void {
    const processInfo = this.ffmpegProcesses.get(processKey);
    if (!processInfo) return;

    processInfo.process.on("exit", async (code, signal) => {
      console.log(
        `FFmpeg process ${processKey} exited with code ${code} and signal ${signal}`,
      );

      if (code !== 0 && processInfo.restartCount < this.MAX_RESTART_ATTEMPTS) {
        console.log(`Attempting to restart stream ${processKey}`);

        // Implement exponential backoff
        const backoffTime =
          this.RESTART_COOLDOWN_MS * Math.pow(2, processInfo.restartCount);

        await new Promise((resolve) => setTimeout(resolve, backoffTime));

        try {
          const newProcess = await this.createFFmpegProcess(
            stream,
            destination,
          );

          this.ffmpegProcesses.set(processKey, {
            process: newProcess,
            streamId: stream.id,
            destinationId: destination.id,
            startTime: new Date(),
            restartCount: processInfo.restartCount + 1,
          });

          this.setupProcessMonitoring(processKey, stream, destination);
        } catch (error) {
          console.error(`Failed to restart stream ${processKey}:`, error);
          this.ffmpegProcesses.delete(processKey);
        }
      } else {
        this.ffmpegProcesses.delete(processKey);
      }
    });
  }

  getStreamStatus(
    streamId: string,
    destinationId: string,
  ): {
    isRunning: boolean;
    uptime?: number;
    restartCount: number;
  } {
    const processKey = `${streamId}-${destinationId}`;
    const processInfo = this.ffmpegProcesses.get(processKey);

    if (!processInfo) {
      return { isRunning: false, restartCount: 0 };
    }

    return {
      isRunning: true,
      uptime: Date.now() - processInfo.startTime.getTime(),
      restartCount: processInfo.restartCount,
    };
  }
}
