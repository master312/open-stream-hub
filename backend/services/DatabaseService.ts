import { IDatabase } from "../models/interfaces.ts";

export class DatabaseService implements IDatabase {
  private data: { [key: string]: any[] };
  private filePath: string;

  constructor(filePath = "./db.json") {
    this.filePath = filePath;
    this.data = { streams: [] };
    this.loadData();
  }

  private async loadData() {
    try {
      const text = await Deno.readTextFile(this.filePath);
      this.data = JSON.parse(text);
    } catch {
      await this.saveData();
    }
  }

  private async saveData() {
    await Deno.writeTextFile(this.filePath, JSON.stringify(this.data, null, 2));
  }

  async findOne(collection: string, query: object): Promise<any> {
    return this.data[collection].find((item: any) =>
      Object.entries(query).every(([key, value]) => item[key] === value),
    );
  }

  async find(collection: string, query: object): Promise<any[]> {
    return this.data[collection].filter((item: any) =>
      Object.entries(query).every(([key, value]) => item[key] === value),
    );
  }

  async insertOne(collection: string, data: any): Promise<any> {
    this.data[collection].push(data);
    await this.saveData();
    return data;
  }

  async updateOne(collection: string, query: object, data: any): Promise<any> {
    const index = this.data[collection].findIndex((item: any) =>
      Object.entries(query).every(([key, value]) => item[key] === value),
    );
    if (index !== -1) {
      this.data[collection][index] = {
        ...this.data[collection][index],
        ...data,
      };
      await this.saveData();
      return this.data[collection][index];
    }
    return null;
  }

  async deleteOne(collection: string, query: object): Promise<boolean> {
    const initialLength = this.data[collection].length;
    this.data[collection] = this.data[collection].filter(
      (item: any) =>
        !Object.entries(query).every(([key, value]) => item[key] === value),
    );
    await this.saveData();
    return initialLength > this.data[collection].length;
  }
}
