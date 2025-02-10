import { Global, Module } from "@nestjs/common";
import { StreamCrudController } from "./stream-crud.controller";
import { StreamCrudService } from "./stream-crud.service";
import { StreamMgrController } from "./stream-mgr.controller";
import { StreamMgrService } from "./stream-mgr.service";
import { StreamRelayService } from "./stream-relay.service";
import { MongooseModule } from "@nestjs/mongoose";
import { StreamInstance, StreamInstanceSchema, } from "src/models/stream-instance.model";
import { StreamRelayController } from "./stream-relay.controller";
import { StreamRelayDestination, StreamRelayDestinationSchema } from "../models/stream-relay-destination.model";
import { StreamRelayRunnerService } from "./stream-relay-runner.service";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {name: StreamInstance.name, schema: StreamInstanceSchema},
      {name: StreamRelayDestination.name, schema: StreamRelayDestinationSchema},
    ]),
  ],
  controllers: [
    StreamCrudController,
    StreamMgrController,
    StreamRelayController,
  ],
  providers: [StreamCrudService, StreamMgrService, StreamRelayService, StreamRelayRunnerService],
  exports: [],
})
export class StreamModule {}
