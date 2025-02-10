import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { StreamCrudService } from "./stream-crud.service";

@Controller("stream")
export class StreamCrudController {
  constructor(private readonly crudService: StreamCrudService) {
  }

  @Get()
  async getStreams() {
    return await this.crudService.getStreams();
  }

  @Get("/:id")
  async getStream(@Param("id") id: string) {
    return await this.crudService.getStream(id);
  }

  @Post()
  async createStream(@Body("name") name: string) {
    if (!name || typeof name !== "string" || name.length < 2) {
      throw new Error("Invalid stream name");
    }

    return this.crudService.createStream(name);
  }

  @Delete("/:id")
  async deleteStream(@Param("id") id: string) {
    await this.crudService.deleteStream(id);
  }
}
