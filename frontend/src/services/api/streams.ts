import { StreamInstance, StreamDestination } from "../../types/stream.ts";
import { CreateStreamRequest } from "../../types/dto.ts";
import { apiClient } from "./client";

export const streamsApi = {
  getPublicIngestUrl: async (): Promise<string> => {
    const response = await apiClient.get<{ url: string }>("/pub_injest_url");
    return response.data.url;
  },

  getStreams: async (): Promise<StreamInstance[]> => {
    const response = await apiClient.get<StreamInstance[]>("/streams");
    return response.data;
  },

  getStream: async (id: string): Promise<StreamInstance> => {
    const response = await apiClient.get<StreamInstance>(`/streams/${id}`);
    return response.data;
  },

  getStreamThumbnailUrl: (streamId: string): string => {
    return `${apiClient.defaults.baseURL}/streams/${streamId}/thumbnail`;
  },

  createStream: async (data: CreateStreamRequest): Promise<StreamInstance> => {
    const response = await apiClient.post<StreamInstance>("/streams", data);
    return response.data;
  },

  startStream: async (id: string): Promise<StreamInstance> => {
    const response = await apiClient.post<StreamInstance>(`/streams/${id}/start`);
    return response.data;
  },

  stopStream: async (id: string): Promise<StreamInstance> => {
    const response = await apiClient.post<StreamInstance>(`/streams/${id}/stop`);
    return response.data;
  },

  deleteStream: async (id: string): Promise<void> => {
    await apiClient.delete(`/streams/${id}`);
  },

  addDestination: async (streamId: string, destination: Omit<StreamDestination, "id">): Promise<StreamInstance> => {
    const response = await apiClient.post<StreamInstance>(`/streams/${streamId}/destinations`, destination);
    return response.data;
  },

  removeDestination: async (streamId: string, destinationId: string): Promise<StreamInstance> => {
    console.log("Removing destination " + destinationId + " from stream " + streamId);
    const response = await apiClient.delete<StreamInstance>(`/streams/${streamId}/destinations/${destinationId}`);
    return response.data;
  },
};
