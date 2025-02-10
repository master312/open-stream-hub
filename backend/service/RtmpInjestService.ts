import { IService } from "./ServiceInterface.ts";
import EventEmitter from "node:events";
import { streamMgrService } from "./index.ts";
import NodeMediaServer from "npm:node-media-server";
import { config } from "../config.ts";
import { streamsRepository } from "../repository/index.ts";

/**
 * This service is responsible for hosting and managing
 * RTMP injest links to be used by user to stream data to.
 */

export class RtmpInjestService implements IService {
  public eventEmitter: EventEmitter;
  private acceptEnabled: boolean;
  private nms: NodeMediaServer;
  private streamIdSessionIdMap: Map<string, string>;

  constructor() {
    this.acceptEnabled = false;
    this.eventEmitter = new EventEmitter();
    this.streamIdSessionIdMap = new Map<string, string>();
  }

  async initialize(): Promise<void> {
    this.nms = new NodeMediaServer(config.injestRtmpServer);

    // Setup event handlers
    // this.nms.on("preConnect", (id, args) // TODO: Check blacklist and stuff here
    // this.nms.on("prePlay", (id, StreamPath, args) // TODO: Check if watching from allowed path
    this.nms.on("prePublish", this.nmsOnPrePublish.bind(this));
    this.nms.on("postPublish", this.nmsOnPostPublish.bind(this));
    this.nms.on("donePublish", this.nmsOnDonePublish.bind(this));
    this.nms.on("prePlay", this.nmsOnPrePlay.bind(this));

    await this.nms.run();
  }

  async shutdown(): Promise<void> {
    await this.nms.close();
  }

  setAcceptEnabled(enabled: boolean): void {
    this.acceptEnabled = enabled;
  }

  // Kicks client currently injesting data for the streamId
  async kickClient(streamId: string): Promise<void> {
    const sessionId = this.streamIdSessionIdMap[streamId];
    if (!sessionId) return;
    const session = this.nms.getSession(sessionId);
    if (!session) return;
    session.reject();
  }

  private async nmsOnPrePublish(id: string, streamPath: string, params: any): Promise<void> {
    const session = this.nms.getSession(id);
    if (!this.acceptEnabled || !streamPath) {
      console.log("Rejected. Reason: ", this.acceptEnabled, " | ", streamPath);
      session.reject();
      return;
    }

    const streamKey = this.extractStreamKey(streamPath);
    if (!streamKey) {
      session.reject();
      console.log("Rejected. Reason: Invalid stream key");
      return;
    }

    const stream = await streamsRepository.findByApiKey(streamKey);
    if (!stream) {
      session.reject(); // Only streams in waiting state are accepted
      console.log("Rejected. Reason: Stream not found");
      return;
    }

    if (stream.state !== "Waiting") {
      session.reject();
      console.log("Rejected. Reason: Stream not in waiting state");
      return;
    }
  }

  private async nmsOnPostPublish(id: string, streamPath: string, params: any): Promise<void> {
    const session = this.nms.getSession(id);
    const streamKey = this.extractStreamKey(streamPath);
    if (!streamKey) {
      session.reject();
      return;
    }

    const stream = await streamsRepository.findByApiKey(streamKey);
    if (!stream || stream.state !== "Waiting") {
      session.reject();
      return;
    }

    // We are getting video data from the client!
    this.streamIdSessionIdMap[stream.id] = id;
    this.eventEmitter.emit("injest:start", stream);
  }

  private async nmsOnDonePublish(id: string, streamPath: string, params: any): Promise<void> {
    const streamKey = this.extractStreamKey(streamPath);
    if (!streamKey) return;
    const stream = await streamsRepository.findByApiKey(streamKey);
    if (!stream) {
      throw new Error(`onDonePublish stream not found ${streamKey}`);
    }

    this.streamIdSessionIdMap.delete(id);
    this.eventEmitter.emit("injest:stopped", stream.id);
  }

  private async nmsOnPrePlay(id: string, streamPath: string, params: any): Promise<void> {
    const session = this.nms.getSession(id);
    const fromUrl = session.connectCmdObj.tcUrl;
    if (fromUrl.startsWith("rtmp://localhost") || fromUrl.startsWith("rtmp://127.0.0.1")) {
      // We skip secret checking for localhost clients
      console.log("Skipping validation for localhost client.");
      return;
    }

    if (!config.rtmpPlaySecret || config.rtmpPlaySecret === "") {
      console.log("RTMP Play secret is not set. Skipping validation.");
      return;
    }

    const streamKey = this.extractStreamKey(streamPath);
    if (!streamKey || !params) {
      session.reject();
      return;
    }

    const secret = params.secret;
    if (!secret || config.rtmpPlaySecret !== secret) {
      console.log("Invalid secret. ", fromUrl, " ", secret);
      session.reject();
      return;
    }

    const stream = await streamsRepository.findByApiKey(streamKey);
    if (!stream) {
      session.reject();
      return;
    }

    if (stream.state !== "Live") {
      session.reject();
      return;
    }
  }

  // Extracts the stream key from the stream path
  private extractStreamKey(streamPath: string): string | null {
    const cleanRoot = config.injestRtmpServer.linkRoot.replace("/", "");
    const path = streamPath.replace(cleanRoot, "");
    // Remove any leading or trailing slashes and return the key
    const streamKey = path.replace(/^\/+|\/+$/g, "");
    return streamKey || null;
  }
}
