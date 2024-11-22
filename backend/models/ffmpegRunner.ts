import { spawn, ChildProcess } from "node:child_process";
import { StreamInstance, StreamDestination } from "./stream.ts";

export type FfmpegProcessStatus =
  | "Starting"
  | "Running"
  | "Stopping"
  | "Stopped";

export interface FfmpegProcess {
  process?: ChildProcess;
  stream: string; // Stream id
  destination: string; // Stream destination id
  status: FfmpegProcessStatus;
  error?: Error; // Last error that occured
  lastHeartbeat?: Date;
}
