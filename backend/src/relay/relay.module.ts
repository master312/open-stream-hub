import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { StreamInstance, StreamInstanceSchema } from "../models/stream-instance.model";
import { StreamRelayDestination, StreamRelayDestinationSchema } from "../models/stream-relay-destination.model";
import { StreamRelayController } from "./stream-relay.controller";
import { StreamRelayService } from "./stream-relay.service";
import { StreamRelayRunnerService } from "./stream-relay-runner.service";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {name: StreamInstance.name, schema: StreamInstanceSchema},
      {name: StreamRelayDestination.name, schema: StreamRelayDestinationSchema},
    ]),
  ],
  controllers: [StreamRelayController],
  providers: [StreamRelayService, StreamRelayRunnerService],
  exports: [StreamRelayService],
})
export class RelayModule {}
