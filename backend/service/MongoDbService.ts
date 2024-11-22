import { IService } from "./ServiceInterface.ts";
import { process } from "node:process";
import { MongoClient, Database, ObjectId } from "npm:mongodb@5.6.0";
import { config } from "../config.ts";

export class MongoDbService implements IService {
  private client: MongoClient;
  private db: Database;
  private readonly dbName: string;
  private uri: string;

  constructor(dbName: string = "open-stream-hub") {
    this.uri = config.mongodbUrl;
    this.dbName = dbName;
  }

  async initialize(): Promise<void> {
    try {
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.log("Successfully connected to MongoDB.");
      this.createIndexes();
      console.log("Database indexes created successfully");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.client.close();
      console.log("Successfully disconnected from MongoDB.");
    } catch (error) {
      console.error("Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  private getCollection(collectionName: string) {
    return this.db.collection(collectionName);
  }

  async findOne(collection: string, query: object): Promise<any> {
    try {
      const result = await this.getCollection(collection).findOne(
        this.processQuery(query),
      );
      return this.processResult(result);
    } catch (error) {
      console.error(`Error in findOne operation for ${collection}:`, error);
      throw error;
    }
  }

  async find(collection: string, query: object): Promise<any[]> {
    try {
      const results = await this.getCollection(collection)
        .find(this.processQuery(query))
        .toArray();
      return results.map(this.processResult);
    } catch (error) {
      console.error(`Error in find operation for ${collection}:`, error);
      throw error;
    }
  }

  async insertOne(collection: string, data: any): Promise<any> {
    try {
      const result = await this.getCollection(collection).insertOne(
        this.processDataForInsert(data),
      );
      return { ...data, id: result.insertedId.toString() };
    } catch (error) {
      console.error(`Error in insertOne operation for ${collection}:`, error);
      throw error;
    }
  }

  async updateOne(collection: string, query: object, data: any): Promise<any> {
    try {
      const result = await this.getCollection(collection).updateOne(
        this.processQuery(query),
        { $set: this.processDataForUpdate(data) },
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`Error in updateOne operation for ${collection}:`, error);
      throw error;
    }
  }

  async deleteOne(collection: string, query: object): Promise<boolean> {
    try {
      const result = await this.getCollection(collection).deleteOne(
        this.processQuery(query),
      );
      return result.deletedCount > 0;
    } catch (error) {
      console.error(`Error in deleteOne operation for ${collection}:`, error);
      throw error;
    }
  }

  async createIndexes(): Promise<void> {
    // TODO: This....
    // try {
    //   await this.db
    //     .collection("streams")
    //     .createIndex({ apiKey: 1 }, { unique: true });
    //   await this.db.collection("streams").createIndex({ state: 1 });
    //   await this.db.collection("streams").createIndex({ createdAt: 1 });
    // } catch (error) {
    //   console.error("Error creating indexes:", error);
    //   throw error;
    // }
  }

  private processQuery(query: object): object {
    const processedQuery = { ...query };
    if ("id" in processedQuery) {
      processedQuery._id = new ObjectId(processedQuery.id);
      delete processedQuery.id;
    }
    return processedQuery;
  }

  private processDataForInsert(data: any): object {
    const processedData = { ...data };
    delete processedData.id;
    return processedData;
  }

  private processDataForUpdate(data: any): object {
    const processedData = { ...data };
    delete processedData.id;
    delete processedData._id;
    return processedData;
  }

  private processResult(result: any): any {
    if (!result) return null;

    const processed = { ...result };
    if (processed._id) {
      processed.id = processed._id.toString();
      delete processed._id;
    }
    return processed;
  }
}
