import {
  StreamInstance,
  StreamStatus,
  StreamDestination,
  IDatabase,
} from "../models/interfaces.ts";
import { crypto } from "crypto";
import NodeMediaServer from "node-media-server";
import { ReStreamService } from "./ReStreamService.ts";
import { StreamThumbnailService } from "./StreamThumbnailService.ts";

export class StreamManager {
  private STREAM_LIVE_PATH: string = "/live";
  private db: IDatabase;
  private nms: any;
  private reStreamService: ReStreamService;
  private activeStreams: Map<string, any> = new Map(); // Track active stream sessions
  public readonly thumbnailService: StreamThumbnailService;

  private statusUpdateLocks: Map<string, Promise<void>> = new Map();

  constructor(db: IDatabase) {
    this.db = db;
    this.reStreamService = new ReStreamService(db);
    this.thumbnailService = new StreamThumbnailService();

    this.nms = new NodeMediaServer({
      rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
      },
      http: {
        port: 8000,
        allow_origin: "*",
      },
    });

    setTimeout(() => {
      this.restoreStreamStates(); // Restore stream states from DB
    }, 500); // Wait half a sec before restoring stream states
    this.setupStreamHandlers();
  }

  public getRestreamService(): ReStreamService {
    return this.reStreamService;
  }

  private async restoreStreamStates(): Promise<void> {
    try {
      const streams = await this.getAllStreams();
      console.log("Restoring stream states for " + streams.length + " streams");
      for (const stream of streams) {
        console.log(
          "Restoring stream state for " + stream.id + ": " + stream.status,
        );
        if (stream.status === "Live") {
          // Reset Live streams to Waiting since the connection was lost
          await this.updateStreamStatus(stream.id, "Waiting");
        } else if (stream.status === "Waiting") {
          // Keep Waiting streams in Waiting state
          // No action needed
        } else {
          // Reset any other state (Error, etc) to Stopped
          await this.updateStreamStatus(stream.id, "Stopped");
        }
      }

      console.log("Stream states restored successfully");
    } catch (error) {
      console.error("Error restoring stream states:", error);
    }
  }

  private setupStreamHandlers() {
    this.nms.on("preConnect", async (id: string, args: any) => {
      console.log(
        "[NodeEvent on preConnect]",
        `id=${id} args=${JSON.stringify(args)}`,
      );

      const session = this.nms.getSession(id);
      if (!args["app"]) {
        session.reject();
        console.log("REject 1");
        return;
      }

      const isPublisher = args.flashVer?.includes("FMLE");
      console.log("isPublisher: " + isPublisher);

      const streamKey: string = args["app"].replace(
        this.STREAM_LIVE_PATH.replace("/", ""),
        "",
      );

      if (!streamKey) {
        session.reject();
        console.log("REject 222");
        return;
      }
      const stream = await this.findStreamByStreamKey(streamKey);
      if (!stream) {
        session.reject();
        console.log("REject 333");
        return;
      }

      if (isPublisher && stream.status !== "Waiting") {
        session.reject();
        console.log("REject 55");
      } else if (!isPublisher && stream.status !== "Live") {
        session.reject();
        console.log("REject 66 " + stream.status);
      }
    });

    this.nms.on(
      "prePublish",
      async (id: string, StreamPath: string, args: any) => {
        const streamKey = this.extractStreamKey(StreamPath);
        if (!streamKey) return;
        const stream = await this.findStreamByStreamKey(streamKey);
        if (!stream) {
          const session = this.nms.getSession(id);
          session.reject();
          return;
        }

        if (stream.status !== "Waiting") {
          const session = this.nms.getSession(id);
          session.reject();
          return;
        }

        this.activeStreams.set(stream.id, id);
      },
    );

    this.nms.on(
      "postPublish",
      async (id: string, StreamPath: string, args: any) => {
        const streamKey = this.extractStreamKey(StreamPath);
        if (!streamKey) return;
        const stream = await this.findStreamByStreamKey(streamKey);
        if (!stream || stream.status !== "Waiting") {
          const session = this.nms.getSession(id);
          session.reject();
          return;
        }

        await this.updateStreamStatus(stream.id, "Live");
      },
    );

    this.nms.on(
      "donePublish",
      async (id: string, StreamPath: string, args: any) => {
        const streamKey = this.extractStreamKey(StreamPath);
        if (!streamKey) return;
        const stream = await this.findStreamByStreamKey(streamKey);
        if (stream && stream.status !== "Stopped") {
          await this.updateStreamStatus(stream.id, "Waiting");
          this.activeStreams.delete(stream.id);
        }
      },
    );
  }

  private async findStreamByStreamKey(
    streamKey: string,
  ): Promise<StreamInstance | null> {
    const streams = await this.getAllStreams(); // TODO: Optimize this
    return streams.find((s) => s.rtmpEndpoint.includes(streamKey)) || null;
  }

  async startStream(streamId: string): Promise<StreamInstance | null> {
    const stream = await this.getStream(streamId);
    if (!stream) {
      console.log("Stream not found " + streamId);
      return null;
    }

    try {
      await this.updateStreamStatus(streamId, "Waiting");
      return await this.getStream(streamId);
    } catch (error) {
      await this.updateStreamStatus(streamId, "Error", error.message);
      return await this.getStream(streamId);
    }
  }

  async stopStream(streamId: string): Promise<StreamInstance | null> {
    const stream = await this.getStream(streamId);
    if (!stream) return null;

    try {
      // If there's an active session, disconnect it
      const sessionId = this.activeStreams.get(streamId);

      try {
        this.reStreamService.stopAllStreams(streamId);
      } catch (e) {
        console.error("Error stopping all restreams for stream " + streamId, e);
      }

      await this.updateStreamStatus(streamId, "Stopped");

      if (sessionId) {
        const session = this.nms.getSession(sessionId);
        if (session) {
          session.reject();
        }
      }

      if (this.activeStreams.has(streamId)) {
        this.activeStreams.delete(streamId);
      }

      return await this.getStream(streamId);
    } catch (error) {
      await this.updateStreamStatus(streamId, "Error", error.message);
      return await this.getStream(streamId);
    }
  }

  async deleteStream(streamId: string): Promise<boolean> {
    const stream = await this.getStream(streamId);
    if (!stream) return false;

    // Can only delete streams that are stopped or in error state
    if (stream.status !== "Stopped" && stream.status !== "Error") {
      throw new Error("Cannot delete active stream. Stop the stream first.");
    }

    try {
      // Remove from active streams tracking if present
      if (this.activeStreams.has(streamId)) {
        this.activeStreams.delete(streamId);
      }

      // Delete the stream from database
      const deletedStream = await this.db.deleteOne("streams", {
        id: streamId,
      });
      return deletedStream;
    } catch (error) {
      console.error(`Error deleting stream ${streamId}:`, error);
      throw error;
    }
  }

  private async updateStreamStatus(
    streamId: string,
    newStatus: StreamStatus,
    statusMessage?: string,
  ): Promise<void> {
    // Wait for any previous update to complete before proceeding
    const previousLock = this.statusUpdateLocks.get(streamId);
    if (previousLock) {
      await previousLock;
    }

    // Create a new lock for this update
    let resolveLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.statusUpdateLocks.set(streamId, lockPromise);

    try {
      console.log(
        "Updating stream id: '" + streamId + "' status: '" + newStatus,
      );

      const stream = await this.getStream(streamId);
      if (!stream) return;
      let shoudlStart: boolean = false;
      if (stream.status === "Waiting" && newStatus === "Live") {
        shoudlStart = true;
      } else if (stream.status === "Live" && newStatus !== "Live") {
        shoudlStart = false;
      }

      if (newStatus === "Stopped" || newStatus == "Error") {
        // Set status of all destinations to disconnected
        for (const dest of stream.destinations) {
          dest.status = "disconnected";
        }
      }

      stream.status = newStatus;
      await this.db.updateOne("streams", { id: streamId }, stream);
      if (shoudlStart) {
        await this.reStreamService.startAllRestreams(stream);
        await this.thumbnailService.startThumbnailCapture(
          stream.id,
          ReStreamService.getStreamAccessUrl(stream),
        );
      } else {
        await this.reStreamService.stopAllStreams(streamId);
        this.thumbnailService.stopThumbnailCapture(stream.id);
      }
    } finally {
      // Release the lock
      resolveLock!();
      this.statusUpdateLocks.delete(streamId);
    }
  }

  startRtmpServer() {
    this.nms.run();
  }

  async createStream(name: string): Promise<StreamInstance> {
    const newApiKey = await this.generateStreamKey();
    const streamInstance: StreamInstance = {
      id: crypto.randomUUID(),
      name,
      apiKey: newApiKey,
      rtmpEndpoint: `rtmp://localhost:1935${this.STREAM_LIVE_PATH}/${newApiKey}`,
      status: "Stopped",
      createdAt: new Date(),
      destinations: [],
    };

    return await this.db.insertOne("streams", streamInstance);
  }

  async getStream(id: string): Promise<StreamInstance | null> {
    return await this.db.findOne("streams", { id });
  }

  async getAllStreams(): Promise<StreamInstance[]> {
    return await this.db.find("streams", {});
  }

  async addDestination(
    streamId: string,
    destination: Omit<StreamDestination, "id">,
  ): Promise<StreamInstance | null> {
    const stream = await this.getStream(streamId);
    if (!stream) return null;

    const newDestination: StreamDestination = {
      ...destination,
      id: crypto.randomUUID(),
      status: "disconnected",
      enabled: true,
    };

    stream.destinations.push(newDestination);
    return await this.db.updateOne("streams", { id: streamId }, stream);
  }

  async removeDestination(
    streamId: string,
    destinationId: string,
  ): Promise<StreamInstance | null> {
    const stream = await this.getStream(streamId);
    if (!stream) return null;

    if (stream.status !== "Stopped" && stream.status !== "Error") {
      throw new Error(
        "Cannot remove destination from active stream. Stop the stream first.",
      );
    }

    const destinationIndex = stream.destinations.findIndex(
      (d) => d.id === destinationId,
    );
    if (destinationIndex === -1) return null;

    this.reStreamService.stopReStream(streamId, destinationId);

    stream.destinations.splice(destinationIndex, 1);
    return await this.db.updateOne("streams", { id: streamId }, stream);
  }

  private async generateStreamKey(): Promise<string> {
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private extractStreamKey(streamPath: string): string | null {
    // Remove the leading STREAM_LIVE_PATH if present
    const path = streamPath.replace(this.STREAM_LIVE_PATH, "");
    // Remove any leading or trailing slashes and return the key
    const streamKey = path.replace(/^\/+|\/+$/g, "");
    return streamKey || null;
  }
}
