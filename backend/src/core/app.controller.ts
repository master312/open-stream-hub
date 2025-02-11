import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { TheConfig } from "../../config";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("/pub_injest_url")
  getPublicInjecstUrl() {
    return {
      "url": TheConfig.nodeMediaServer.injectHost + ":" + TheConfig.nodeMediaServer.rtmp.port + "/" + TheConfig.nodeMediaServer.injectRoot
    }
  }
}
