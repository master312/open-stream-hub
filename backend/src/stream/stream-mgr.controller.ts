import { Controller, Param, Post } from "@nestjs/common";
import { StreamMgrService } from "./stream-mgr.service";
import { StreamCrudService } from "./stream-crud.service";

@Controller("stream")
export class StreamMgrController {

  constructor(
    private readonly streamMgr: StreamMgrService,
    private readonly streamCrud: StreamCrudService) {
  }

  @Post("/start/:id")
  async startStream(@Param("id") id: string) {
    if (!id || id.length <= 20) {
      throw new Error("Invalid ID format");
    }

    await this.streamMgr.startStream(id);
    return await this.streamCrud.getStream(id);
  }

  @Post("/stop/:id")
  async stopStream(@Param("id") id: string) {
    if (!id || id.length <= 20) {
      throw new Error("Invalid ID format");
    }

    await this.streamMgr.stopStream(id);
    return await this.streamCrud.getStream(id);
  }
}
