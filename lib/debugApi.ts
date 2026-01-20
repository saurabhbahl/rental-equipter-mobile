// Debug utility to test API connectivity
import axiosClient from "./utils";
import { API_BASE } from "./useEnv";

export async function testApiConnection() {
  try {
    console.log("🔍 Testing API Connection...");
    console.log("📍 API Base URL:", API_BASE);
    
    const response = await axiosClient.get("/models");
    console.log("✅ API Connection Successful!");
    console.log("📦 Response:", response.data);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("❌ API Connection Failed!");
    console.error("📋 Error Details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      headers: error.config?.headers,
    });
    
    if (error.code === "NETWORK_ERROR" || error.message.includes("Network")) {
      console.error("🌐 Network Error: Check your internet connection");
    }
    
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.error("🔒 Authentication/CORS Error: Server may be blocking mobile requests");
    }
    
    return { success: false, error };
  }
}

