import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { StreamInstance } from "../models/stream-instance.model";
import { Model } from "mongoose";
import { StreamCrudService } from "./stream-crud.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class StreamMgrService {
  constructor(
    @InjectModel(StreamInstance.name)
    private streamModel: Model<StreamInstance>,
    private readonly crudService: StreamCrudService,
    private eventEmitter: EventEmitter2,
  ) {
  }

  async startStream(id: string) {
    const stream = await this.crudService.getStream(id);
    if (!stream) {
      Logger.log(`Stream not found for start. Id:  ${id}`, "StreamManager");
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
      {_id: stream._id},
      {$set: {state: "Waiting"}},
    );

    this.eventEmitter.emit('stream.start', id);
    Logger.log(`Started stream ${id}`, "StreamManager");
  }

  async stopStream(id: string) {
    const stream = await this.crudService.getStream(id);
    if (!stream) {
      Logger.log(`Stream not found for stop. Id: ${id}`, "StreamManager");
      return;
    }

    if (stream.state === "Stopped") {
      // Stream already stopped
      return;
    }

    // Update stream state to "Stopped"
    await this.streamModel.updateOne(
      {_id: stream._id},
      {$set: {state: "Stopped"}},
    );

    this.eventEmitter.emit('stream.stop', id);
    Logger.log(`Stopped stream ${id}`, "StreamManager");
  }
}
