import { BehaviorSubject } from "rxjs";
import { StreamInstance, StreamDestination } from "../types/stream.ts";
import { CreateStreamRequest } from "../types/dto.ts";
import { interval } from "rxjs";
import { switchMap } from "rxjs/operators";

import { streamsApi } from "./api/streams";

class StreamsService {
  // Shitty polling sollution  for now... TODO: Implement websockets in the future
  private pollingInterval = 4000; // 4 sec

  private streams = new BehaviorSubject<StreamInstance[]>([]);
  private currentStream = new BehaviorSubject<StreamInstance | null>(null);
  private loading = new BehaviorSubject<boolean>(false);
  private error = new BehaviorSubject<Error | null>(null);
  private publicInjestUrl: string = "";

  constructor() {
    this.fetchPublicInjestUrl();
    interval(this.pollingInterval)
      .pipe(
        switchMap(async () => {
          console.log("Polling streams...");
          await this.fetchStreams();
        }),
      )
      .subscribe();
  }

  // Getters for state
  getStreams() {
    return this.streams.value;
  }

  getCurrentStream() {
    return this.currentStream.value;
  }

  getFullPublicInjestUrl(streamRtmpEndpoint: string) {
    // Replace the double slashes with single slashes, but perserve the protocol
    return `${this.publicInjestUrl}/${streamRtmpEndpoint}`.replace(
      /(?<!:)\/\//g,
      "",
    );
  }

  isLoading() {
    return this.loading.value;
  }

  getError() {
    return this.error.value;
  }

  // Observables for reactive updates
  streams$ = this.streams.asObservable();
  currentStream$ = this.currentStream.asObservable();
  loading$ = this.loading.asObservable();
  error$ = this.error.asObservable();

  async fetchStreams() {
    await this.fetchPublicInjestUrl();
    try {
      this.loading.next(true);
      this.error.next(null);

      const streams = await streamsApi.getStreams();
      this.streams.next(streams);

      return streams;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch streams");
      this.error.next(error);
      throw error;
    } finally {
      this.loading.next(false);
    }
  }

  async fetchStreamById(id: string) {
    await this.fetchPublicInjestUrl();
    try {
      this.loading.next(true);
      this.error.next(null);

      const stream = await streamsApi.getStream(id);
      this.currentStream.next(stream);

      return stream;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch stream");
      this.error.next(error);
      throw error;
    } finally {
      this.loading.next(false);
    }
  }

  async createStream(request: CreateStreamRequest) {
    try {
      this.loading.next(true);
      this.error.next(null);

      const stream = await streamsApi.createStream(request);
      const currentStreams = this.streams.value;
      this.streams.next([...currentStreams, stream]);

      return stream;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to create stream");
      this.error.next(error);
      throw error;
    } finally {
      this.loading.next(false);
    }
  }

  async startStream(id: string) {
    try {
      this.loading.next(true);
      this.error.next(null);

      console.log("Starting stream");
      const stream = await streamsApi.startStream(id);
      this.updateStreamInList(stream);

      if (this.currentStream.value?.id === id) {
        this.currentStream.next(stream);
      }

      console.log("Stream started " + stream.id);
      return stream;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to start stream");
      this.error.next(error);
      throw error;
    } finally {
      this.loading.next(false);
    }
  }

  async stopStream(id: string) {
    try {
      this.loading.next(true);
      this.error.next(null);

      const stream = await streamsApi.stopStream(id);
      this.updateStreamInList(stream);

      if (this.currentStream.value?.id === id) {
        this.currentStream.next(stream);
      }

      return stream;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to stop stream");
      this.error.next(error);
      throw error;
    } finally {
      this.loading.next(false);
    }
  }

  async removeStream(id: string) {
    try {
      this.loading.next(true);
      this.error.next(null);

      await streamsApi.deleteStream(id);

      // Remove from streams list
      const currentStreams = this.streams.value;
      this.streams.next(currentStreams.filter((stream) => stream.id !== id));

      // Clear current stream if it was the one removed
      if (this.currentStream.value?.id === id) {
        this.currentStream.next(null);
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to delete stream");
      this.error.next(error);
      throw error;
    } finally {
      this.loading.next(false);
    }
  }

  async addDestination(
    streamId: string,
    destination: Omit<StreamDestination, "id">,
  ) {
    try {
      this.loading.next(true);
      this.error.next(null);

      const stream = await streamsApi.addDestination(streamId, destination);
      this.updateStreamInList(stream);

      if (this.currentStream.value?.id === streamId) {
        this.currentStream.next(stream);
      }

      console.log("Stream added destination " + stream.id);
      return stream;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to add destination");
      this.error.next(error);
      throw error;
    } finally {
      this.loading.next(false);
    }
  }

  async removeDestination(streamId: string, destinationId: string) {
    try {
      this.loading.next(true);
      this.error.next(null);

      const stream = await streamsApi.removeDestination(
        streamId,
        destinationId,
      );
      this.updateStreamInList(stream);

      if (this.currentStream.value?.id === streamId) {
        this.currentStream.next(stream);
      }

      console.log("Stream removed destination " + stream.id);
      return stream;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to remove destination");
      this.error.next(error);
      throw error;
    } finally {
      this.loading.next(false);
    }
  }

  private updateStreamInList(updatedStream: StreamInstance) {
    const currentStreams = this.streams.value;
    const updatedStreams = currentStreams.map((stream) =>
      stream.id === updatedStream.id ? updatedStream : stream,
    );
    this.streams.next(updatedStreams);
  }

  async fetchThumbnail(streamId: string): Promise<Blob> {
    try {
      return await streamsApi.getStreamThumbnail(streamId);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch thumbnail");
      this.error.next(error);
      throw error;
    }
  }

  // Helper method to get appropriate thumbnail URL based on stream status
  getStreamThumbnailOrPlaceholder(stream: StreamInstance): string {
    if (stream.state === "Live") {
      return streamsApi.getStreamThumbnailUrl(stream.id);
    }

    // Status-specific placeholder images
    const statusPlaceholders = {
      Waiting: "/stream-status-waiting.mp4", // Clock/waiting icon image
      // Error: "/stream-status-error.png", // Error/warning icon image
      Stopped: "/stream-status-stopped.png", // Stop/pause icon image
    };

    return (
      statusPlaceholders[stream.state] || "/stream-status-invalid-state.png  "
    );
  }

  private async fetchPublicInjestUrl() {
    if (this.publicInjestUrl && this.publicInjestUrl !== "") return;
    try {
      const url = await streamsApi.getPublicIngestUrl();
      this.publicInjestUrl = url;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch public url");
      this.error.next(error);
      throw error;
    } finally {
      this.loading.next(false);
    }
  }
}

export const streamsService = new StreamsService();
