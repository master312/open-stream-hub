import axios from "axios";

const API_BASE_URL = import.meta.env.REST_API_HOST + ":" + import.meta.env.REST_API_PORT + "/api";

console.log("CONFIG - Api base url: ", API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases here
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  },
);
