export type StreamStatus = "Live" | "Waiting" | "Stopped";
export type StreamDestinationState = "Disconnected" | "Connecting" | "Live";

export type StreamDestinationPlatform = "youtube" | "twitch" | "facebook" | "custom_rtmp";

export const StreamDestinationPlatformNames: Record<StreamDestinationPlatform, string> = {
  youtube: "YouTube",
  twitch: "Twitch",
  facebook: "Facebook",
  custom_rtmp: "Custom RTMP",
} as const;

// For now, these are used for DTOs and DB Models
export interface StreamInstance {
  id: string;
  name: string;
  apiKey: string;
  state: StreamStatus;
  error?: Error;
  createdAt: Date;
  startedAt?: Date;
  thumbnail?: string;
  destinations: StreamDestination[];
  ffmpegFlags?: string; // FFmpeg flags to use for all destinations
}

export interface StreamDestination {
  id: string; // Unique per stream!
  platform: StreamDestinationPlatform;
  streamKey: string;
  serverUrl: string;
  state: StreamDestinationState;
  error?: Error;
  enabled: boolean;
  ffmpegFlags?: string; // FFmpeg flags to use for this destination
}
