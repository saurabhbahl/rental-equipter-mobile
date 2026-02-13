/**
 * ENVIRONMENT / CONFIG
 * Central place for URLs and API base. Reads from EXPO_PUBLIC_* env vars with fallbacks.
 * - EQUIPTER_BASE_URL / EQUIPTER_RENT_URL: used for "About" and "Find Location" links.
 * - API_BASE: backend base URL; axios in utils.ts uses API_BASE + "/api/v1".
 * For production you can use expo-constants or react-native-config for different builds.
 */
export const EQUIPTER_BASE_URL = process.env.EXPO_PUBLIC_EQUIPTER_BASE_URL || "https://equipter.com";
export const EQUIPTER_RENT_URL = process.env.EXPO_PUBLIC_EQUIPTER_RENT_URL || "https://equipter.com/rent";
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://localhost:3000";

