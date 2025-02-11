import { Injectable, Logger } from '@nestjs/common';
import * as NodeMediaServer from 'node-media-server';
import { TheConfig } from "../../config";
import { StreamCrudService } from "../stream/stream-crud.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class RtmpServerService {
  private nms: NodeMediaServer;

  /**
   * NodeMediaServer session ID mapped by the stream's ID, for easier access
   * <stream _id, nms session id>
   */
  private activeSessions: Map<string, string> = new Map();

  /**
   * Used to quickly map play url to the actual streams url
   * <stream _id, stream's api_key>
   */
  private activeKeyMap: Map<string, string> = new Map();

  constructor(private readonly streamCrudService: StreamCrudService,
              private eventEmitter: EventEmitter2) {
  }

  async onModuleInit() {
    console.log('Rtmp server boot-up');
    // Delay 1 seconds, to allow rest of the app to load properly before enabling connections
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.startRtmpServer();
  }

  private async startRtmpServer() {
    this.nms = new NodeMediaServer(TheConfig.nodeMediaServer);

    this.nms.on("preConnect", this.onPreConnect.bind(this));
    this.nms.on("prePublish", this.onPrePublish.bind(this));
    this.nms.on("postPublish", this.onPostPublish.bind(this));
    this.nms.on("donePublish", this.onDonePublish.bind(this));
    this.nms.on("prePlay", this.onPrePlay.bind(this));

    await this.nms.run();
  }

  private async onPreConnect(id: string, params: any): Promise<void> {
    // TODO: Chekc IPs and shit, and do first line of defence and denial
  }

  /**
   * Invoked when video source client is requesting to start streaming content to the server
   */
  private async onPrePublish(id: string, streamPath: string, params: any): Promise<void> {
    const info = await this.extractSessionAndKey(id, streamPath);
    if (info.apiKey == "" || !info.apiKey) {
      await info.session?.reject();
      return;
    }

    if (!RtmpServerService.ValidateInjectUrlAndApp(info.session)) {
      Logger.error(`Tried to inject form forbidden URL ${info.session.connectCmdObj.tcUrl}`, "RtmpServer");
      await info.session.reject();
      return;
    }

    const stream = await this.streamCrudService.getByApiKey(info.apiKey);
    if (!stream) {
      await info.session.reject(); // Only streams in waiting state are accepted
      Logger.log("Rejected. Reason: Stream not found. ", "RtmpServer");
      return;
    }

    if (stream.state !== "Waiting") {
      await info.session.reject();
      Logger.log("Rejected. Reason: Stream not in waiting state", "RtmpServer");
      return;
    }
  }

  /**
   * Invoked when source has just started delivering content to rtmp server
   */
  private async onPostPublish(id: string, streamPath: string, params: any): Promise<void> {
    const info = await this.extractSessionAndKey(id, streamPath);
    if (info.apiKey == "" || !info.apiKey) {
      // Check this again, just to be safe
      await info.session?.reject();
      return;
    }

    if (!RtmpServerService.ValidateInjectUrlAndApp(info.session)) {
      return;
    }

    const stream = await this.streamCrudService.getByApiKey(info.apiKey);
    if (!stream || stream.state !== "Waiting") {
      // This kinda should never happen, but node media server sometimes fuck this up,
      // and reaches this line even if session was already rejected before
      await info.session.reject();
      return;
    }

    // All good. We have a healthy content stream.
    const streamId = (stream._id as any).toString();
    this.activeSessions.set(streamId, id);
    this.activeKeyMap.set(streamId, info.apiKey);
    this.eventEmitter.emit("rtmp.inject.start", streamId);
  }

  /**
   * Invoked when video source client stop's streaming
   */
  private async onDonePublish(id: string, streamPath: string, params: any): Promise<void> {
    const info = await this.extractSessionAndKey(id, streamPath);
    if (info.apiKey == "" || !info.apiKey) {
      await info.session?.reject();
      return;
    }

    const stream = await this.streamCrudService.getByApiKey(info.apiKey);
    if (!stream || stream.state !== "Live") {
      // This kinda should never happen, but node media server sometimes fuck this up,
      // and reaches this line even if session was already rejected before
      await info.session.reject();
      return;
    }

    const streamId = (stream._id as any).toString();
    this.activeSessions.delete(streamId);
    this.eventEmitter.emit("rtmp.inject.stop", (stream._id as any).toString());
    Logger.log(`Stream done publish: ${streamId}`, "RtmpServer");
  }

  /**
   * Invoked when client tryes to connect to stream
   * !!!!!!!!! REMAINDER !!!!!!!!!
   * Can not use async in this method, since it will fuck up node media server and not update links properly
   */
  private async onPrePlay(id: string, streamPath: string, params: any): Promise<void> {
    const session = this.nms.getSession(id);
    if (!session || !streamPath) {
      await session?.reject();
      return;
    }

    // On localhost, we ignore all link checks
    const rawUrl = session.connectCmdObj.tcUrl.toString();
    const isLocal: boolean = rawUrl.startsWith("rtmp://127.0.0.1") || rawUrl.startsWith("rtmp://localhost");

    if (!isLocal && !RtmpServerService.ValidateWatchUrlAndApp(session)) {
      Logger.error(`Tried to watch form forbidden URL ${rawUrl}`, "RtmpServer");
      await session.reject();
      return;
    }

    const streamId = RtmpServerService.ExtractStreamKey(streamPath);
    if (!streamId) {
      await session.reject();
      return;
    }

    const streamApiKey = this.activeKeyMap.get(streamId);
    if (!streamApiKey) {
      Logger.log(`Tried to watch stream while it was not running. StreamID: ${streamId}`, "RtmpServer");
      await session.reject();
      return;
    }

    // We have found stream. Now we need to redirect user to propper play link
    session.playStreamPath = `/${TheConfig.nodeMediaServer.injectRoot}/${streamApiKey}`.replace(/\/+/g, '/');
  }

  /**
   * Extracts session and stream api key
   */
  private async extractSessionAndKey(id: string, streamPath: string): Promise<{
    apiKey: string;
    session: any
  }> {
    const session = this.nms.getSession(id);
    if (!session || !streamPath) {
      Logger.log(`Could not extract session or stream path ${streamPath}`, "RtmpServer");
      return {apiKey: "", session: session};
    }

    const streamKey = RtmpServerService.ExtractStreamKey(streamPath)
    if (!streamKey) {
      Logger.log(`Could not extract api key ${streamPath}`, "RtmpServer");
      return {apiKey: "", session: session};
    }

    return {apiKey: streamKey, session: session};
  }

  /**
   * Extracts stream key form stream path (full link)
   * Just finds last '/' and gets everything that comes after it.
   * So make sure there are no '/' characters in the key it self
   *
   * @returns empty string if not found
   */
  private static ExtractStreamKey(streamPath: string): string {
    const lastSlashPlace = streamPath.lastIndexOf("/");
    if (lastSlashPlace <= 0 || lastSlashPlace >= streamPath.length) {
      return "";
    }

    return streamPath.substring(lastSlashPlace + 1);
  }

  private static ValidateInjectUrlAndApp(nmsSession: any): boolean {
    const toTest =
      `${TheConfig.nodeMediaServer.injectHost}:${TheConfig.nodeMediaServer.rtmp.port}` +
      `/${TheConfig.nodeMediaServer.injectRoot}`.replace(/\/+/g, '/');

    return nmsSession.connectCmdObj.tcUrl.startsWith(toTest);
  }

  private static ValidateWatchUrlAndApp(nmsSession: any): boolean {
    const toTest =
      `${TheConfig.nodeMediaServer.rtmp.port}` +
      `/${TheConfig.nodeMediaServer.watchRoot}`.replace(/\/+/g, '/');

    return nmsSession.connectCmdObj.tcUrl.includes(toTest);

  }
}