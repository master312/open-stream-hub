import { Injectable } from "@nestjs/common";
import { StreamRelayDestination } from "../models/stream-relay-destination.model";
import { StreamCrudService } from "./stream-crud.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { validate, validateOrReject } from "class-validator";

@Injectable()
export class StreamRelayService {
  constructor(
    @InjectModel(StreamRelayDestination.name)
    private relayDestinationModel: Model<StreamRelayDestination>,
    private readonly crudService: StreamCrudService,
  ) {
  }

  async getRelays(streamId: string): Promise<StreamRelayDestination[] | null> {
    const stream = await this.crudService.getStream(streamId);
    if (!stream) {
      return null;
    }

    return stream.destinations;
  }

  async addNewRelay(streamId: string, relay: Partial<StreamRelayDestination>) {
    const stream = await this.crudService.getStream(streamId);
    if (!stream) {
      return;
    }

    const destination = new this.relayDestinationModel(relay);
    // This will populate _id and default fields    // Validate using mongoose
    destination.init(destination.toObject());
    const validationError = destination.validateSync();
    if (validationError) {
      throw new Error(validationError.message);
    }

    stream.destinations.push(destination);
    await this.crudService.updateStream(stream);
  }

  async removeRelay(streamId: string, relayId: string) {
    const stream = await this.crudService.getStream(streamId);
    if (!stream) {
      return;
    }

    const destination = stream.destinations.find(
      value => value._id == relayId,
    );
    if (!destination) {
      return;
    }

    if (destination.state !== "Disconnected") {
      throw new Error(
        "Relay destionation can only be removed when in Disconnected state.",
      );
    }

    stream.destinations = stream.destinations.filter(
      value => value._id != relayId,
    );
    await this.crudService.updateStream(stream);
  }

  async restartRelay(streamId: string, relayId: string) {
    // TODO: ....
  }
}
