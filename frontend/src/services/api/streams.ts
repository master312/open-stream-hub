import {
  Stream,
  CreateStreamRequest,
  StreamDestination,
} from "../../types/stream.ts";
import { apiClient } from "./client";

export const streamsApi = {
  getStreams: async (): Promise<Stream[]> => {
    const response = await apiClient.get<Stream[]>("/streams");
    return response.data;
  },

  getStream: async (id: string): Promise<Stream> => {
    const response = await apiClient.get<Stream>(`/streams/${id}`);
    return response.data;
  },

  createStream: async (data: CreateStreamRequest): Promise<Stream> => {
    const response = await apiClient.post<Stream>("/streams", data);
    return response.data;
  },

  startStream: async (id: string): Promise<Stream> => {
    const response = await apiClient.post<Stream>(`/streams/${id}/start`);
    return response.data;
  },

  stopStream: async (id: string): Promise<Stream> => {
    const response = await apiClient.post<Stream>(`/streams/${id}/stop`);
    return response.data;
  },

  deleteStream: async (id: string): Promise<void> => {
    await apiClient.delete(`/streams/${id}`);
  },

  addDestination: async (
    streamId: string,
    destination: Omit<StreamDestination, "id">,
  ): Promise<Stream> => {
    const response = await apiClient.post<Stream>(
      `/streams/${streamId}/destinations`,
      destination,
    );
    return response.data;
  },

  removeDestination: async (
    streamId: string,
    destinationId: string,
  ): Promise<Stream> => {
    console.log(
      "Removing destination " + destinationId + " from stream " + streamId,
    );
    const response = await apiClient.delete<Stream>(
      `/streams/${streamId}/destinations/${destinationId}`,
    );
    return response.data;
  },

  getStreamThumbnailUrl: (streamId: string): string => {
    return `${apiClient.defaults.baseURL}/streams/${streamId}/thumbnail`;
  },

  getStreamThumbnail: async (streamId: string): Promise<Blob> => {
    const response = await apiClient.get(`/streams/${streamId}/thumbnail`, {
      responseType: "blob",
    });
    return response.data;
  },
};
