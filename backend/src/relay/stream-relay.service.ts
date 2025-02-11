import { Injectable, Logger } from "@nestjs/common";
import { StreamDestinationState, StreamRelayDestination } from "../models/stream-relay-destination.model";
import { StreamCrudService } from "../stream/stream-crud.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { OnEvent } from "@nestjs/event-emitter";
import { StreamRelayRunnerService } from "./stream-relay-runner.service";
import { RelayStatusEvent } from "./relay-status.event";

/**
 * Used for high-level management of relay state and CRUD.
 * Dose not do any ffmpeg related logic
 */

@Injectable()
export class StreamRelayService {
  constructor(
    @InjectModel(StreamRelayDestination.name)
    private relayDestinationModel: Model<StreamRelayDestination>,
    private readonly crudService: StreamCrudService,
    private readonly relayRunnerService: StreamRelayRunnerService
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
    // This will populate _id and default fields and Validate using mongoose
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
      (value) => value._id == relayId,
    );
    if (!destination) {
      return;
    }

    if (destination.state !== "Disconnected") {
      throw new Error("Relay can only be removed when in Disconnected state.");
    }

    stream.destinations = stream.destinations.filter(
      (value) => value._id != relayId,
    );
    await this.crudService.updateStream(stream);
  }

  async restartRelay(streamId: string, relayId: string) {
    // TODO: ....
  }

  @OnEvent('stream.live.start')
  async startAllRelay(streamId: string) {
    Logger.log(`Starting all relays for stream: ${streamId}`, "RelayService");

    const destinations = await this.getRelays(streamId);
    if (!destinations || destinations.length == 0) {
      Logger.log(`Stream ${streamId} has no destinations`, "RelayRunner");
      return;
    }

    // First, stop all running relays just in case
    await this.stopAllRelay(streamId);

    let startedCount = 0;
    for (const item of destinations) {
      if (!item.enabled || !item._id) {
        continue;
      }

      if (item.state == "Live") {
        // This should never happen, but just in case
        Logger.warn(`Trying to start all relays, while relay was already in Live state: ${item.id} streamID: ${streamId}`, "RelayService");
        const relayId = item._id.toString();
        if (this.relayRunnerService.isRelayRunning(streamId, relayId)) {
          this.relayRunnerService.stopRelay(streamId, relayId);
        }
      }

      const result = this.relayRunnerService.startRelay(streamId, item)
      if (!result) {
        Logger.debug("Failed to start relay runner", "RelayService");
        continue;
      }

      startedCount++;
    }

    Logger.log(`Started ${startedCount}/${destinations.length} relays for stream: ${streamId}`, "RelayService");
  }

  @OnEvent("stream.live.stop")
  async stopAllRelay(streamId: string) {
    Logger.log(`Stopping all relays for stream: ${streamId}`, "RelayService");
    const stream = await this.crudService.getStream(streamId);
    if (!stream) {
      return;
    }

    for (const item of stream.destinations) {
      if (!item.enabled || !item._id || item.state == "Disconnected") {
        continue;
      }

      this.relayRunnerService.stopRelay(streamId, (item._id as any).toString());
    }
  }

  @OnEvent("stream.relay.runner.start")
  async onRunnerStarted(info: RelayStatusEvent) {
    Logger.log(`Relay Runner Started: ${info.relayId}`, "RelayService");
    await this.updateRelayState(info.streamId, info.relayId, "Live");
  }

  @OnEvent("stream.relay.runner.stop")
  async onRunnerStopped(info: RelayStatusEvent) {
    Logger.log(`Relay Runner Stopped: ${info.relayId}`, "RelayService");
    await this.updateRelayState(info.streamId, info.relayId, "Disconnected");
  }

  private async updateRelayState(streamId: string, relayId: string, state: StreamDestinationState) {
    const stream = await this.crudService.getStream(streamId);
    if (!stream) {
      return;
    }

    for (let i = 0; i < stream.destinations.length; i++) {
      const destination = stream.destinations[i];
      if ((destination._id as any).toString() != relayId) {
        continue;
      }

      stream.destinations[i].state = state;
      break;
    }

    await this.crudService.updateStream(stream);
  }
}
