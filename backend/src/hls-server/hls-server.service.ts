import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { OnEvent } from "@nestjs/event-emitter";
import { StreamCrudService } from "../stream/stream-crud.service";
import * as fs from "fs";
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from "path";
import { TheConfig } from "../../config";

/**
 * A hastily implemented hacky service just to preview streams in frontend.
 * TODO: Completely rework properly
 */
@Injectable()
export class HlsServerService {
  private readonly cacheDirectory = './cache/hls-streams';

  // Map of running ffmpegs by stream Id
  private readonly runningFfmpegs = new Map<string, ffmpeg.FfmpegCommand>();

  constructor(private readonly streamCrud: StreamCrudService) {
  }

  async onModuleInit() {
    if (!fs.existsSync(this.cacheDirectory)) {
      fs.mkdirSync(this.cacheDirectory, {recursive: true});
      return;
    }

    // Clean directory
    const files = fs.readdirSync(this.cacheDirectory);
    for (const file of files) {
      fs.rmSync(path.join(this.cacheDirectory, file), {
        recursive: true,
        force: true
      });
    }

    if (!TheConfig.hlsPreviewEnabled) {
      Logger.log("HLS SERVER previews disabled", "HlsServer")
    }
  }

  onModuleDestroy() {
    for (const item of this.runningFfmpegs.values()) {
      item.kill("SIGKILL");
    }

    this.runningFfmpegs.clear();
  }

  async servePlaylist(streamId: string): Promise<StreamableFile> {
    // TODO: Remainder: Validate stream ID
    const playlistPath = path.join(this.cacheDirectory, streamId, "playlist.m3u8");
    const file = fs.createReadStream(playlistPath);
    return new StreamableFile(file);
  }

  isRunning(streamId: string): boolean {
    return this.runningFfmpegs.has(streamId);
  }

  serveSegment(streamId: string, segment: string): StreamableFile {
    // TODO: Again, validate stream ID here
    const sgPath = path.join(this.cacheDirectory, streamId, segment);
    const file = fs.createReadStream(sgPath);
    return new StreamableFile(file);
  }

  @OnEvent("stream.live.start")
  async onStreamStarted(streamId: string) {
    if (!TheConfig.hlsPreviewEnabled) {
      return;
    }

    const stream = this.streamCrud.getStream(streamId);
    if (!stream) {
      Logger.debug(`Could not find stream onStreamStarted ${streamId}`, "HlsServer");
      return;
    }

    Logger.log(`HLS server hooked on new stream ${streamId}`, "HlsServer");

    const sourceUrl = `rtmp://localhost:${TheConfig.nodeMediaServer.rtmp.port}${TheConfig.nodeMediaServer.watchRoot}/${streamId}`;
    const destPath = path.join(this.cacheDirectory, streamId);

    this.assureDestPath(destPath);

    const ffmpegCommand = this.generateFfmpegCommand(sourceUrl, destPath);

    // Starts ffmpeg
    // REMAINDER: There are no safety checks for this... if it fails, it failed forever....
    ffmpegCommand.run();
    this.runningFfmpegs.set(streamId, ffmpegCommand);
  }

  @OnEvent("stream.live.stop")
  async onStreamEnded(streamId: string) {
    if (!TheConfig.hlsPreviewEnabled) {
      return;
    }

    const ffmpegCommand = this.runningFfmpegs.get(streamId);
    if (!ffmpegCommand) {
      return;
    }

    ffmpegCommand.kill("SIGKILL")
    this.runningFfmpegs.delete(streamId);
  }


  private assureDestPath(destPath: string) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, {recursive: true});
      return;
    }

    const files = fs.readdirSync(destPath);
    for (const file of files) {
      fs.rmSync(path.join(destPath, file), {
        recursive: true,
        force: true
      });
    }
  }

  private generateFfmpegCommand(sourceUrl: string, targetDirectory: string) {
    return ffmpeg(sourceUrl)
      .inputOptions([
        '-threads 1',
        '-err_detect ignore_err',    // Be more tolerant of input errors
        '-re',                       // Read input at native framerate
        '-analyzeduration 1000000',  // Increase analyze duration
        '-fflags nobuffer',          // Reduce latency
        '-flags low_delay',          // Reduce latency
        '-strict experimental'       // Allow experimental features
      ])
      .outputOptions([
        '-c:v libx264',             // Video codec
        '-c:a aac',                 // Audio codec
        '-b:v 500k',                // Video bitrate
        '-b:a 64k',                 // Audio bitrate
        '-vf fps=2,scale=640:360', // FPS and resolution
        '-preset ultrafast',        // Fastest encoding
        '-tune zerolatency',        // Minimize latency
        '-g 4',                    // Keyframe interval
        '-hls_time 2',              // Segment duration
        '-hls_list_size 2',         // Number of segments in playlist
        '-hls_flags delete_segments+omit_endlist+append_list', // Important flags
        '-hls_segment_type mpegts',
        '-hls_segment_filename', path.join(targetDirectory, 'segment%03d.ts'), // Segment naming
        '-f hls'                    // HLS format
      ])
      .output(path.join(targetDirectory, 'playlist.m3u8'))
      .on('start', () => {
        Logger.log(`HLS generator started for stream ${sourceUrl}`, 'HlsServer');
      })
      .on('error', (err) => {
        Logger.error(`HLS generator error for stream ${sourceUrl}: ${err.message}`, 'HlsServer');
      })
      .on('end', () => {
        Logger.log(`HLS generator ended for stream ${sourceUrl}`, 'HlsServer');
      });
  }
}
