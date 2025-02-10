import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { StreamInstance } from "src/models/stream-instance.model";
import { Model } from "mongoose";

@Injectable()
export class StreamCrudService {
  constructor(
    @InjectModel(StreamInstance.name)
    private streamModel: Model<StreamInstance>,
  ) {}

  async createStream(name: string): Promise<StreamInstance> {
    const apiKey = await this.generateUniqueApiKey();

    const stream = new this.streamModel({
      name: name,
      apiKey,
      state: "Stopped",
    });

    await stream.save();
    return stream;
  }

  async deleteStream(id: string): Promise<void> {
    await this.streamModel.findByIdAndDelete(id);
  }

  async getStream(id: string): Promise<StreamInstance | null> {
    return await this.streamModel.findById(id).exec();
  }

  async getStreams(): Promise<StreamInstance[]> {
    return await this.streamModel.find().exec();
  }

  async updateStream(stream: StreamInstance): Promise<void> {
    await this.streamModel.updateOne(
      { _id: stream._id },
      { $set: stream },
      { upsert: false },
    );
  }

  private async generateUniqueApiKey(): Promise<string> {
    while (true) {
      // Generate a random 24-byte buffer and convert it to a hex string
      const buffer = new Uint8Array(24);
      crypto.getRandomValues(buffer);
      const apiKey = Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Check if the API key already exists in the database
      if (!(await this.streamModel.findOne({ apiKey: apiKey }).exec())) {
        return apiKey;
      }
    }
  }
}
