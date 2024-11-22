import { IService } from "./ServiceInterface.ts";
import EventEmitter from "node:events";
import { streamMgrService } from "./index.ts";
import NodeMediaServer from "node-media-server";
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
    this.nms.on("preConnect", this.nmsOnPreConnect.bind(this));
    this.nms.on("postPublish", this.nmsOnPostPublish.bind(this));
    this.nms.on("donePublish", this.nmsOnDonePublish.bind(this));

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

  private async nmsOnPreConnect(id: string, params: any): Promise<void> {
    const session = this.nms.getSession(id);
    if (!this.acceptEnabled || !params["app"]) {
      session.reject();
      return;
    }

    const isPublisher = params.flashVer?.includes("FMLE");

    const streamKey = this.extractStreamKey(params["app"]);
    if (!streamKey) {
      session.reject();
      return;
    }

    const stream = await streamsRepository.findByApiKey(streamKey);
    if (!stream) {
      session.reject(); // Only streams in waiting state are accepted
      return;
    }

    if (isPublisher && stream.state !== "Waiting") {
      session.reject();
      return;
    } else if (!isPublisher && stream.state !== "Live") {
      session.reject();
      return;
    }
  }

  private async nmsOnPostPublish(
    id: string,
    streamPath: string,
    params: any,
  ): Promise<void> {
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

  private async nmsOnDonePublish(
    id: string,
    streamPath: string,
    params: any,
  ): Promise<void> {
    const streamKey = this.extractStreamKey(streamPath);
    if (!streamKey) return;
    const stream = await streamsRepository.findByApiKey(streamKey);
    if (!stream) {
      throw new Error(`onDonePublish stream not found ${streamKey}`);
    }

    this.streamIdSessionIdMap.delete(id);
    this.eventEmitter.emit("injest:stopped", stream.id);
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
