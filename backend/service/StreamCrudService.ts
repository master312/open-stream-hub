import { StreamInstance, StreamDestination } from "../models/stream.ts";
import { IService } from "./ServiceInterface.ts";
import { streamsRepository } from "../repository/index.ts";
import { crypto } from "crypto";
import { config } from "../config.ts";

export class StreamCrudService implements IService {
  async initialize(): Promise<void> {
    // Nothing to do here...
  }

  async shutdown(): Promise<void> {
    // Nothing to do here...
  }

  private async generateUniqueApiKey(): Promise<string> {
    while (true) {
      // Generate a random 32-byte buffer and convert it to a hex string
      const buffer = new Uint8Array(32);
      crypto.getRandomValues(buffer);
      const apiKey = Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (!(await streamsRepository.findByApiKey(apiKey))) {
        return apiKey;
      }
    }
  }

  private validateStreamState(stream: StreamInstance, operation: string): void {
    if (stream.state !== "Stopped") {
      throw new Error(
        `Cannot ${operation} stream "${stream.name}" because it is not in Stopped state (current state: ${stream.state})`,
      );
    }
  }

  private validateDestinations(_destinations: StreamDestination[]): void {
    // PH. Just throw here if destination is invalid.
  }

  async createStream(
    data: Omit<StreamInstance, "id" | "apiKey" | "state" | "createdAt">,
  ): Promise<StreamInstance> {
    const apiKey = await this.generateUniqueApiKey();

    // Validate destinations if any
    if (data.destinations) {
      this.validateDestinations(data.destinations);
    }

    // Create new stream instance
    const streamData: Omit<StreamInstance, "id"> = {
      ...data,
      apiKey,
      rtmpEndpoint: `${config.injestRtmpServer.publicUrl}/${config.injestRtmpServer.linkRoot}/${apiKey}`,
      state: "Stopped",
      createdAt: new Date(),
    };

    return await streamsRepository.create(streamData);
  }

  async updateStream(
    id: string,
    data: Partial<StreamInstance>,
  ): Promise<boolean> {
    const existingStream = await streamsRepository.findById(id);
    if (!existingStream) {
      throw new Error(`Stream with id ${id} not found`);
    }

    this.validateStreamState(existingStream, "update");

    // Prevent updating of theese fields
    const protectedFields = ["id", "apiKey", "createdAt"];
    for (const field of protectedFields) {
      if (field in data) {
        delete data[field as keyof StreamInstance];
      }
    }

    if (data.destinations) {
      this.validateDestinations(data.destinations);
    }

    return await streamsRepository.update(id, data);
  }

  async deleteStream(id: string): Promise<boolean> {
    const existingStream = await streamsRepository.findById(id);
    if (!existingStream) {
      throw new Error(`Stream with id ${id} not found`);
    }

    this.validateStreamState(existingStream, "delete");
    return await streamsRepository.delete(id);
  }

  async getStream(id: string): Promise<StreamInstance | null> {
    return await streamsRepository.findById(id);
  }

  async getAllStreams(): Promise<StreamInstance[]> {
    return await streamsRepository.findAll();
  }

  async getStreamByApiKey(apiKey: string): Promise<StreamInstance | null> {
    return await streamsRepository.findByApiKey(apiKey);
  }

  async addDestination(
    streamId: string,
    destination: Omit<StreamDestination, "id">,
  ): Promise<StreamInstance> {
    const stream = await streamsRepository.findById(streamId);
    if (!stream) {
      throw new Error(`Stream with id ${streamId} not found`);
    }

    this.validateStreamState(stream, "add destination to");

    // Generate a unique ID for the destination within this stream
    let newDestinationId: string;
    do {
      newDestinationId = crypto.randomUUID();
    } while (stream.destinations.some((d) => d.id === newDestinationId));

    const newDestination: StreamDestination = {
      ...destination,
      id: newDestinationId,
      state: "Disconnected",
    };

    this.validateDestinations([newDestination]);

    // Add destination to the stream
    const updatedDestinations = [...stream.destinations, newDestination];

    // Update stream with new destinations
    const updated = await streamsRepository.update(streamId, {
      destinations: updatedDestinations,
    });

    if (!updated) {
      throw new Error("Failed to add destination");
    }

    const updatedStream = await streamsRepository.findById(streamId);
    if (!updatedStream) {
      throw new Error("Failed to retrieve updated stream");
    }

    return updatedStream;
  }

  async removeDestination(
    streamId: string,
    destinationId: string,
  ): Promise<StreamInstance> {
    const stream = await streamsRepository.findById(streamId);
    if (!stream) {
      throw new Error(`Stream with id ${streamId} not found`);
    }

    this.validateStreamState(stream, "remove destination from");
    const destinationIndex = stream.destinations.findIndex(
      (d) => d.id === destinationId,
    );

    if (destinationIndex === -1) {
      throw new Error(
        `Destination with id ${destinationId} not found in stream`,
      );
    }

    // Remove destination
    const updatedDestinations = stream.destinations.filter(
      (d) => d.id !== destinationId,
    );

    // Update stream with new destinations
    const updated = await streamsRepository.update(streamId, {
      destinations: updatedDestinations,
    });

    if (!updated) {
      throw new Error("Failed to remove destination");
    }

    const updatedStream = await streamsRepository.findById(streamId);
    if (!updatedStream) {
      throw new Error("Failed to retrieve updated stream");
    }

    return updatedStream;
  }

  async updateDestination(
    streamId: string,
    destinationId: string,
    updates: Partial<Omit<StreamDestination, "id">>,
  ): Promise<StreamInstance> {
    const stream = await streamsRepository.findById(streamId);
    if (!stream) {
      throw new Error(`Stream with id ${streamId} not found`);
    }

    this.validateStreamState(stream, "update destination in");

    const destinationIndex = stream.destinations.findIndex(
      (d) => d.id === destinationId,
    );

    if (destinationIndex === -1) {
      throw new Error(
        `Destination with id ${destinationId} not found in stream`,
      );
    }

    const updatedDestination = {
      ...stream.destinations[destinationIndex],
      ...updates,
    };

    this.validateDestinations([updatedDestination]);

    // Update destination in the array
    const updatedDestinations = [...stream.destinations];
    updatedDestinations[destinationIndex] = updatedDestination;

    const updated = await streamsRepository.update(streamId, {
      destinations: updatedDestinations,
    });

    if (!updated) {
      throw new Error("Failed to update destination");
    }

    const updatedStream = await streamsRepository.findById(streamId);
    if (!updatedStream) {
      throw new Error("Failed to retrieve updated stream");
    }

    return updatedStream;
  }
}
