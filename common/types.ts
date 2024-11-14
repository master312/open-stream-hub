export type StreamStatus = "Live" | "Waiting" | "Error" | "Stopped";

export interface StreamDestination {
  id: string;
  platform: "youtube" | "twitch" | "custom_rtmp";
  streamKey: string;
  serverUrl: string;
  status: "connected" | "disconnected" | "error";
  enabled: boolean;
}

export interface Stream {
  id: string;
  name: string;
  apiKey: string;
  rtmpEndpoint: string;
  status: StreamStatus;
  statusMessage?: string;
  createdAt: string | Date;
  startedAt: string; // When did we go live
  destinations: StreamDestination[];
}

export interface CreateStreamRequest {
  name: string;
}

export interface StreamAnalytics {
  runtime: string;
  viewers: number;
  bandwidth: string;
  cpuUsage: number;
  viewerHistory: Array<{
    time: string;
    count: number;
  }>;
}
