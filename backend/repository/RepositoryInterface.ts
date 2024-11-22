import { MongoDbService } from "../service/MongoDbService.ts";

export interface IRepository<T> {
  constructor(db: MongoDbService);
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Omit<T, "id">): Promise<T>;
  update(id: string, data: Partial<T>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
