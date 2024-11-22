import { MongoDbService } from "../service/MongoDbService.ts";
import { StreamInstance } from "../models/stream.ts";
import { IRepository } from "./RepositoryInterface.ts";

export class StreamsRepository implements IRepository<StreamInstance> {
  constructor(private db: MongoDbService) {}

  private readonly COLLECTION = "streams";

  async findById(id: string): Promise<StreamInstance | null> {
    return await this.db.findOne(this.COLLECTION, { id });
  }

  async findAll(): Promise<StreamInstance[]> {
    return await this.db.find(this.COLLECTION, {});
  }

  async create(stream: Omit<StreamInstance, "id">): Promise<StreamInstance> {
    return await this.db.insertOne(this.COLLECTION, {
      ...stream,
      createdAt: new Date(),
    });
  }

  async update(id: string, stream: Partial<StreamInstance>): Promise<boolean> {
    return await this.db.updateOne(this.COLLECTION, { id }, stream);
  }

  async delete(id: string): Promise<boolean> {
    return await this.db.deleteOne(this.COLLECTION, { id });
  }

  // Stream-specific methods can be added here
  async findByApiKey(apiKey: string): Promise<StreamInstance | null> {
    return await this.db.findOne(this.COLLECTION, { apiKey });
  }
}
