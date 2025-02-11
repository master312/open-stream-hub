import { StreamDestination, StreamInstance } from "../../types/stream.ts";
import { CreateStreamRequest } from "../../types/dto.ts";
import { apiClient } from "./client";

export const streamsApi = {
  getPublicIngestUrl: async (): Promise<{ injectUrl: string; watchUrl: string }> => {
    const response = await apiClient.get<{ injectUrl: string; watchUrl: string }>("/pub_injest_url");
    return response.data;
  },

  getStreams: async (): Promise<StreamInstance[]> => {
    const response = await apiClient.get<StreamInstance[]>("/stream");
    return response.data;
  },

  getStream: async (id: string): Promise<StreamInstance> => {
    const response = await apiClient.get<StreamInstance>(`/stream/${id}`);
    return response.data;
  },

  getHlsPreviewUrl: (streamId: string): string => {
    return `${apiClient.defaults.baseURL}/hls/${streamId}/playlist.m3u8`;
  },

  createStream: async (data: CreateStreamRequest): Promise<StreamInstance> => {
    const response = await apiClient.post<StreamInstance>("/stream", data);
    return response.data;
  },

  startStream: async (id: string): Promise<StreamInstance> => {
    const response = await apiClient.post<StreamInstance>(`/stream/start/${id}`);
    return response.data;
  },

  stopStream: async (id: string): Promise<StreamInstance> => {
    const response = await apiClient.post<StreamInstance>(`/stream/stop/${id}`);
    return response.data;
  },

  deleteStream: async (id: string): Promise<void> => {
    await apiClient.delete(`/stream/${id}`);
  },

  addDestination: async (streamId: string, destination: Omit<StreamDestination, "id">): Promise<StreamInstance> => {
    const response = await apiClient.post<StreamInstance>(`/stream/relay/new/${streamId}`, {
      "relay": destination
    });
    return response.data;
  },

  restartDestination: async (streamId: string, destinationId: string): Promise<StreamInstance> => {
    const response = await apiClient.post(`/stream/${streamId}/destinations/${destinationId}/restart`);
    return response.data;
  },

  removeDestination: async (streamId: string, destinationId: string): Promise<StreamInstance> => {
    console.log("Removing destination " + destinationId + " from stream " + streamId);
    const response = await apiClient.delete<StreamInstance>(`/stream/relay/${streamId}/${destinationId}`);
    return response.data;
  },
};
