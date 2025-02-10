import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { StreamRelayDestination } from "../models/stream-relay-destination.model";
import { StreamRelayService } from "./stream-relay.service";

@Controller("stream/relay")
export class StreamRelayController {

  constructor(private readonly relayService: StreamRelayService) {
  }

  @Get("/:streamId")
  async getRelays(@Param("streamId") streamId: string) {
    return await this.relayService.getRelays(streamId);
  }

  @Post("new/:streamId")
  async addNewRelay(@Param("streamId") streamId: string, @Body("relay") relay: Partial<StreamRelayDestination>) {
    if (!relay) {
      throw new Error("No relay data");
    }

    await this.relayService.addNewRelay(streamId, relay);
  }

  @Delete("/:streamId/:relayId")
  async removeRelay(@Param("streamId") streamId: string, @Param("relayId") relayId: string) {
    await this.relayService.removeRelay(streamId, relayId);
  }

  @Post("/restart/:streamId/:relayId")
  async restartRelay(@Param("streamId") streamId: string, @Param("relayId") relayId: string) {
    // TODO: ....
  }
}
