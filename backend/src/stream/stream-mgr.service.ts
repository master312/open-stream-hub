import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { StreamInstance, StreamStatus } from "../models/stream-instance.model";
import { Model } from "mongoose";
import { StreamCrudService } from "./stream-crud.service";
import { Logger } from "@nestjs/common";

@Injectable()
export class StreamMgrService {
  constructor(
    @InjectModel(StreamInstance.name)
    private streamModel: Model<StreamInstance>,
    private readonly crudService: StreamCrudService,
  ) {}

  async startStream(id: string) {
    const stream = await this.crudService.getStream(id);
    if (!stream) {
      Logger.log("Stream not found for start. Id: " + id);
      return;
    }

    if (stream.state !== "Stopped") {
      // Streams can only be started from stopped state
      throw new Error(
        `Tried to start stream ${id} but it's in state ${stream.state}`,
      );
    }

    // Restore destination to default state
    // TODO: Reset all destinations
    // for (var i = 0; i < stream.destinations.length; i++) {
    //   stream.destinations[i].state = "Disconnected";
    //   stream.destinations[i].error = undefined;
    // }

    // Update stream state to "Waiting"
    await this.streamModel.updateOne(
      { _id: stream._id },
      { $set: { state: "Waiting" } },
    );

    Logger.log(`Started stream ${id}`);
  }

  async stopStream(id: string) {
    const stream = await this.crudService.getStream(id);
    if (!stream) {
      Logger.log("Stream not found for stop. Id: " + id);
      return;
    }

    if (stream.state === "Stopped") {
      // Stream already stopped
      return;
    }

    // Update stream state to "Stopped"
    await this.streamModel.updateOne(
      { _id: stream._id },
      { $set: { state: "Stopped" } },
    );

    Logger.log(`Stopped stream ${id}`);
    // TODO: Emit signal to kill all ffmpeg stuff related to this stream
  }
}
