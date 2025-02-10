import { Injectable } from '@nestjs/common';
import * as NodeMediaServer from 'node-media-server';
import { TheConfig } from "../../config";

@Injectable()
export class RtmpServerService {
  private nms: NodeMediaServer;

  constructor() {
  }

  async onModuleInit() {
    console.log('Rtmp server bootup');
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

  private async onPrePublish(id: string, streamPath: string, params: any): Promise<void> {
  }

  private async onPostPublish(id: string, streamPath: string, params: any): Promise<void> {
  }

  private async onDonePublish(id: string, streamPath: string, params: any): Promise<void> {
  }

  private async onPrePlay(id: string, streamPath: string, params: any): Promise<void> {
  }
}