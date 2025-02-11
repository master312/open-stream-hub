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
