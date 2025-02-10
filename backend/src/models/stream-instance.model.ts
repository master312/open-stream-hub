import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { StreamRelayDestination, StreamRelayDestinationSchema } from "./stream-relay-destination.model";

export type StreamStatus = "Live" | "Waiting" | "Stopped";

@Schema({
  timestamps: true,
  toJSON: {virtuals: true},
  toObject: {virtuals: true},
})
export class StreamInstance extends Document {
  @Prop({required: true})
  name: string;

  @Prop({required: true})
  apiKey: string;

  @Prop({required: true, enum: ["Live", "Waiting", "Stopped"]})
  state: StreamStatus;

  @Prop()
  error?: Error;

  @Prop({default: Date.now})
  createdAt: Date;

  @Prop()
  startedAt?: Date;

  @Prop({type: [StreamRelayDestinationSchema], default: []})
  destinations: StreamRelayDestination[];

  @Prop()
  ffmpegFlags?: string;

  constructor(data: Partial<StreamInstance>) {
    super();
    Object.assign(this, data);
  }
}

export const StreamInstanceSchema = SchemaFactory.createForClass(StreamInstance);

// Add indexes if needed
StreamInstanceSchema.index({apiKey: 1});
StreamInstanceSchema.index({state: 1});