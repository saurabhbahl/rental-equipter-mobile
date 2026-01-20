import axios, { AxiosResponse, AxiosError } from "axios";
import { Platform } from "react-native";
import { generateRequestId } from "./getRequestId";
import { API_BASE } from "./useEnv";

// Axios instance
const axiosClient = axios.create({
  baseURL: API_BASE + "/api/v1",
  timeout: 30000, // Increased timeout for mobile networks
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "mobile-app", // Custom header to identify mobile app
    "X-Platform": Platform.OS, // iOS or Android
  },
});

// Request interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    config.headers["x-request-signature-id"] = generateRequestId();
    // Add User-Agent for mobile identification
    config.headers["User-Agent"] = `EquipterRentalApp/${Platform.OS}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Log error for debugging
    if (error.response) {
      console.error("API Error Response:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        url: error.config?.url,
      });
    } else if (error.request) {
      console.error("API Error Request:", {
        message: error.message,
        code: error.code,
        url: error.config?.url,
      });
    } else {
      console.error("API Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

