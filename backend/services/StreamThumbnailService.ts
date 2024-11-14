import { ChildProcess } from "node:child_process";
import { join } from "node:path";
import { mkdir, readFile } from "node:fs/promises";

export class StreamThumbnailService {
  private thumbnailDir: string;
  private thumbnailIntervals: Map<string, number> = new Map();
  private readonly UPDATE_INTERVAL = 60000; // 1 minute in milliseconds

  constructor(thumbnailDir = "./thumbnails") {
    this.thumbnailDir = thumbnailDir;
    this.initializeDirectory();
  }

  private async initializeDirectory() {
    try {
      await mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      console.error("Error creating thumbnail directory:", error);
    }
  }

  async startThumbnailCapture(
    streamId: string,
    rtmpUrl: string,
  ): Promise<void> {
    // Stop any existing capture for this stream
    this.stopThumbnailCapture(streamId);

    // Start periodic capture
    const intervalId = setInterval(() => {
      this.captureStreamThumbnail(streamId, rtmpUrl).catch((error) => {
        console.error(
          `Error capturing thumbnail for stream ${streamId}:`,
          error,
        );
      });
    }, this.UPDATE_INTERVAL);

    // Store the interval ID
    this.thumbnailIntervals.set(streamId, intervalId);

    // Capture initial thumbnail
    await this.captureStreamThumbnail(streamId, rtmpUrl);
  }

  stopThumbnailCapture(streamId: string): void {
    const intervalId = this.thumbnailIntervals.get(streamId);
    if (intervalId) {
      clearInterval(intervalId);
      this.thumbnailIntervals.delete(streamId);
    }
  }

  async getThumbnailPath(streamId: string): Promise<string | null> {
    const thumbnailPath = join(this.thumbnailDir, `${streamId}.jpg`);
    try {
      const stat = await Deno.stat(thumbnailPath);
      return stat.isFile ? thumbnailPath : null;
    } catch {
      return null;
    }
  }

  private async captureStreamThumbnail(
    streamId: string,
    rtmpUrl: string,
  ): Promise<boolean> {
    const outputPath = join(this.thumbnailDir, `${streamId}.jpg`);
    console.log(`Capturing thumbnail for stream ${streamId} to ${outputPath}`);
    return new Promise((resolve, reject) => {
      const ffmpegArgs = [
        "-y", // Overwrite output files without asking
        "-i",
        rtmpUrl,
        "-vframes",
        "1", // Capture only one frame
        "-an", // Disable audio
        "-s",
        "1280x720", // Thumbnail size
        "-f",
        "image2", // Force image2 format
        outputPath,
      ];

      let process: ChildProcess;
      try {
        process = Deno.run({
          cmd: ["ffmpeg", ...ffmpegArgs],
          stderr: "piped",
        });
      } catch (error) {
        console.error("Failed to spawn FFmpeg process:", error);
        reject(error);
        return;
      }

      // Handle process completion
      process.status().then((status) => {
        if (status.success) {
          console.log(`Thumbnail captured successfully for stream ${streamId}`);
          resolve(true);
        } else {
          process.stderr.read().then((stderr) => {
            const errorOutput = new TextDecoder().decode(stderr);
            console.error(
              `Failed to capture thumbnail for stream ${streamId}. FFmpeg output: ${errorOutput}`,
            );
            reject(new Error(`FFmpeg process exited with code ${status.code}`));
          });
        }
        process.close();
      });

      // Set a timeout to kill the process if it takes too long
      setTimeout(() => {
        try {
          process.kill();
        } catch {
          // Process might have already completed
        }
        reject(new Error("Thumbnail capture timeout"));
      }, 10000); // 10 second timeout
    });
  }

  // Clean up resources
  dispose(): void {
    for (const streamId of this.thumbnailIntervals.keys()) {
      this.stopThumbnailCapture(streamId);
    }
  }

  // Helper method to get thumbnail URLs for API responses
  getThumbnailUrl(streamId: string, baseUrl: string): string {
    return `${baseUrl}/thumbnails/${streamId}.jpg`;
  }

  async getThumbnail(streamId: string): Promise<{
    data: Uint8Array;
    contentType: string;
  } | null> {
    try {
      const thumbnailPath = await this.getThumbnailPath(streamId);

      if (!thumbnailPath) {
        return null;
      }

      const data = await readFile(thumbnailPath);
      return {
        data,
        contentType: "image/jpeg",
      };
    } catch (error) {
      console.error(`Error reading thumbnail for stream ${streamId}:`, error);
      return null;
    }
  }
}
