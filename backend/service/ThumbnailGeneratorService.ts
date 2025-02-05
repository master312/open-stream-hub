import { IService } from "./ServiceInterface.ts";
import { spawn, ChildProcess } from "node:child_process";
import { rtmpInjestService } from "./index.ts";
import { getStreamInstanceInternalRtmpUrl } from "../utils/stream.ts";
import { ensureDir } from "https://deno.land/std/fs/ensure_dir.ts";
import { readFile } from "node:fs/promises";
import { config } from "../config.ts";

const THUMBNAIL_UPDATE_INTERVAL = 2000; // 2 seconds
const THUMBNAILS_DIR = "./thumbnails"; // Directory to store thumbnails

interface ThumbnailProcess {
  process: ChildProcess;
}

export class ThumbnailGeneratorService implements IService {
  private activeProcesses: Map<string, ThumbnailProcess>;

  constructor() {
    this.activeProcesses = new Map();
  }

  async initialize(): Promise<void> {
    // Check if service is disabled, and if so, exit
    if (config.realtimeThumbnailDisabled) {
      console.log("[ThumbnailGenerator] Service is disabled, exiting");
      return;
    }

    console.log("[ThumbnailGenerator] Initializing service");

    // Ensure thumbnails directory exists
    await ensureDir(THUMBNAILS_DIR);

    rtmpInjestService.eventEmitter.on("injest:start", async (stream) => {
      console.log(`[ThumbnailGenerator] Starting generation for stream ${stream.id}`);
      await this.startThumbnailGeneration(stream.id, stream.apiKey);
    });

    rtmpInjestService.eventEmitter.on("injest:stopped", async (streamId) => {
      console.log(`[ThumbnailGenerator] Stopping generation for stream ${streamId}`);
      await this.stopThumbnailGeneration(streamId);
    });

    console.log("[ThumbnailGenerator] Service initialized");
  }

  async shutdown(): Promise<void> {
    console.log("[ThumbnailGenerator] Shutting down service");

    for (const [streamId] of this.activeProcesses) {
      console.log(`[ThumbnailGenerator] Stopping generation for stream ${streamId}`);
      await this.stopThumbnailGeneration(streamId);
    }

    console.log("[ThumbnailGenerator] Service shut down");
  }

  async getThumbnail(streamId: string): Promise<Uint8Array | null> {
    try {
      if (!config.realtimeThumbnailDisabled) {
        const thumbnailPath = `${THUMBNAILS_DIR}/${streamId}.png`;
        return await readFile(thumbnailPath);
      } else {
        return await readFile("./thumbnails_disabled.png");
      }
    } catch (error) {
      // console.log(`[ThumbnailGenerator] No thumbnail found for stream ${streamId}`);
      return null;
    }
  }

  private async startThumbnailGeneration(streamId: string, apiKey: string): Promise<void> {
    await this.stopThumbnailGeneration(streamId);

    const inputUrl = getStreamInstanceInternalRtmpUrl(apiKey);
    const outputPath = `${THUMBNAILS_DIR}/${streamId}.png`;
    console.log(`[ThumbnailGenerator] Starting FFmpeg process for stream ${streamId}`);

    const ffmpegArgs = [
      "-y", // Overwrite output file
      "-threads",
      "1", // Use single thread
      "-loglevel",
      "error", // Reduce logging overhead
      "-re", // Read input at native framerate
      "-i",
      inputUrl,
      "-vf",
      "fps=1/" + THUMBNAIL_UPDATE_INTERVAL / 1000 + ",scale=-1:320", // First reduce fps, then scale
      "-an", // Disable audio processing
      "-sn", // Disable subtitle processing
      "-dn", // Disable data stream processing
      "-preset",
      "ultrafast", // Fastest processing
      "-q:v",
      "31", // Lowest quality
      "-f",
      "image2",
      "-update",
      "1",
      "-max_muxing_queue_size",
      "1024",
      "-tune",
      "zerolatency",
      "-probesize",
      "32768", // Reduce probing size
      "-analyzeduration",
      "0",
      outputPath,
    ];

    const process = spawn("ffmpeg", ffmpegArgs);

    // Handle FFmpeg logs and errors
    // process.stderr.on("data", (data: Uint8Array) => {
    //   const message = new TextDecoder().decode(data);
    //   if (message.includes("Error") || message.includes("error")) {
    //     console.error(`[ThumbnailGenerator] FFmpeg error for stream ${streamId}:`, message);
    //   }
    // });

    process.on("exit", (code) => {
      console.log(`[ThumbnailGenerator] FFmpeg process exited for stream ${streamId} with code ${code}`);
      this.activeProcesses.delete(streamId);
    });

    this.activeProcesses.set(streamId, { process });
    console.log(`[ThumbnailGenerator] Started thumbnail generation for stream ${streamId}`);
  }

  private async stopThumbnailGeneration(streamId: string): Promise<void> {
    const proc = this.activeProcesses.get(streamId);
    if (proc) {
      console.log(`[ThumbnailGenerator] Stopping FFmpeg process for stream ${streamId}`);
      proc.process.kill("SIGTERM");
      this.activeProcesses.delete(streamId);

      // Clean up the thumbnail file
      try {
        await Deno.remove(`${THUMBNAILS_DIR}/${streamId}.png`);
      } catch (_error) {
        // Ignore if file doesn't exist
      }

      console.log(`[ThumbnailGenerator] Stopped thumbnail generation for stream ${streamId}`);
    }
  }
}
