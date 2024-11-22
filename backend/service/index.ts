import { IService } from "./ServiceInterface.ts";
import { MongoDbService } from "./MongoDbService.ts";
import { StreamMgrService } from "./StreamMgrService.ts";
import { StreamCrudService } from "./StreamCrudService.ts";
import { FfmpegRunnerService } from "./FfmpegRunnerService.ts";
import { RtmpInjestService } from "./RtmpInjestService.ts";
import { initRepositories } from "../repository/index.ts";

class ServiceManager {
  private static instance: ServiceManager;
  private initialized = false;
  private services: Map<string, IService> = new Map();

  private constructor() {
    // Register all services here
    this.registerService("database", new MongoDbService());
    this.registerService("streamMgr", new StreamMgrService());
    this.registerService("streamCrud", new StreamCrudService());
    this.registerService("ffmpegRunner", new FfmpegRunnerService());
    this.registerService("rtmpInjest", new RtmpInjestService());
  }

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  private registerService(name: string, service: IService): void {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }
    this.services.set(name, service);
  }

  public getService<T extends IService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service as T;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize all services in sequence
      for (const [name, service] of this.services) {
        await service.initialize();
        console.log(`${name} initialized successfully`);
      }

      // Initialize repositories after all services
      await initRepositories(this.getService<MongoDbService>("database"));
      console.log("Repositories initialized successfully");

      this.initialized = true;
      console.log("Services initialized successfully");
    } catch (error) {
      console.error("Failed to initialize services:", error);
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      // Shutdown services in reverse order
      const services = Array.from(this.services.entries()).reverse();
      for (const [name, service] of services) {
        await service.shutdown();
        console.log(`${name} shut down successfully`);
      }

      this.initialized = false;
      console.log("Services shut down successfully");
    } catch (error) {
      console.error("Failed to shutdown services:", error);
      throw error;
    }
  }
}

export const serviceManager = ServiceManager.getInstance();

// A shitty manual export for all services.. Fine for now
export const databaseService =
  serviceManager.getService<MongoDbService>("database");
export const streamMgrService =
  serviceManager.getService<StreamMgrService>("streamMgr");
export const streamCrudService =
  serviceManager.getService<StreamCrudService>("streamCrud");
export const ffmpegRunnerService =
  serviceManager.getService<FfmpegRunnerService>("ffmpegRunner");
export const rtmpInjestService =
  serviceManager.getService<RtmpInjestService>("rtmpInjest");
