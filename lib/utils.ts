/**
 * AXIOS CLIENT (API)
 * Shared axios instance for all API calls. Base URL is API_BASE + "/api/v1".
 * - Request interceptor: adds a unique x-request-signature-id and User-Agent for each request.
 * - Response interceptor: logs errors to the console and rethrows so callers can handle them.
 * Only used by debugApi now; rental flow uses Sanity + FORMS_SUBMIT_URL.
 */
import axios, { AxiosResponse, AxiosError } from "axios";
import { Platform } from "react-native";
import { generateRequestId } from "./getRequestId";
import { API_BASE } from "./useEnv";

const axiosClient = axios.create({
  baseURL: API_BASE ? `${API_BASE.replace(/\/$/, "")}/api/v1` : "",
  timeout: 30000, // Increased timeout for mobile networks
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "mobile-app", // Custom header to identify mobile app
    "X-Platform": Platform.OS, // iOS or Android
  },
});

// Request interceptor: add request ID and User-Agent to every request
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

// Response interceptor: log errors and rethrow so callers can handle
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

