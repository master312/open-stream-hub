import { Injectable, Logger } from "@nestjs/common";
import { StreamRelayService } from "./stream-relay.service";
import { OnEvent } from "@nestjs/event-emitter";
import { StreamRelayDestination } from "../models/stream-relay-destination.model";

@Injectable()
export class StreamRelayRunnerService {

  constructor(private readonly streamRelayService: StreamRelayService) {
  }

  @OnEvent('stream.start')
  async startAllRelay(streamId: string) {
    Logger.log(`Starting all realys for stream: ${streamId}`, "RelayRunner");

    const destinations = await this.streamRelayService.getRelays(streamId);
    if (!destinations || destinations.length == 0) {
      Logger.log(`Stream ${streamId} has no destinations`, "RelayRunner");
      return;
    }

    const promiseAll: Promise<boolean>[] = [];
    for (const item of destinations) {
      if (!item.enabled || !item._id) {
        continue;
      }

      promiseAll.push(this.startRelay(item));
    }

    await Promise.all(promiseAll);
    Logger.log(`Started ${promiseAll.length} realys for stream: ${streamId}`, "RelayRunner");
  }

  @OnEvent('stream.stop')
  async stopAllRelay(streamId: string) {
    // TODO: .... implement
    Logger.log(`Stopping all realys for stream: ${streamId}`, "RelayRunner");
  }

  private async startRelay(relayDestination: StreamRelayDestination) {
    return false;
  }

  private async stopRelay(destinationId: string) {
    return false;
  }
}
