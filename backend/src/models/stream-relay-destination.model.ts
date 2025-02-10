import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { StreamInstance } from "./stream-instance.model";
import { Document } from "mongoose";

export type StreamDestinationPlatform = "youtube" | "twitch" | "facebook" | "custom_rtmp";
export type StreamDestinationState = "Disconnected" | "Connecting" | "Live";

// A shitty double definition, but fine for now...
const StreamDestinationPlatforms: StreamDestinationPlatform[] = [
  "youtube", "twitch", "facebook", "custom_rtmp"
];

@Schema({timestamps: true})
export class StreamRelayDestination extends Document {
  @Prop({ required: true, enum: StreamDestinationPlatforms })
  platform: StreamDestinationPlatform;

  @Prop({ required: true })
  streamKey: string;

  @Prop({ required: true })
  serverUrl: string;

  @Prop({ required: true, default: "Disconnected", enum: ["Disconnected", "Connecting", "Live"] })
  state: StreamDestinationState;

  @Prop()
  error?: Error;

  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop()
  ffmpegFlags?: string;

  constructor(data: Partial<StreamRelayDestination>) {
    super();
    Object.assign(this, data);
  }
}

export const StreamRelayDestinationSchema = SchemaFactory.createForClass(StreamRelayDestination);
