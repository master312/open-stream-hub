export type StreamStatus = "Live" | "Waiting" | "Error" | "Stopped";

export interface StreamInstance {
  id: string;
  name: string;
  apiKey: string;
  rtmpEndpoint: string;
  status: StreamStatus;
  statusMessage?: string; // For error details
  createdAt: Date;
  destinations: StreamDestination[];
}

export interface StreamDestination {
  id: string;
  platform: "youtube" | "twitch" | "custom_rtmp";
  streamKey: string;
  serverUrl: string;
  status: "connected" | "disconnected" | "error";
  enabled: boolean;
}

export interface IDatabase {
  findOne(collection: string, query: object): Promise<any>;
  find(collection: string, query: object): Promise<any[]>;
  insertOne(collection: string, data: any): Promise<any>;
  updateOne(collection: string, query: object, data: any): Promise<any>;
  deleteOne(collection: string, query: object): Promise<boolean>;
}
