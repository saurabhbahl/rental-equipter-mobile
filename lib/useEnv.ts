/**
 * ENVIRONMENT / CONFIG
 * Central place for URLs and API base. Reads from EXPO_PUBLIC_* env vars with fallbacks.
 * - EQUIPTER_BASE_URL / EQUIPTER_RENT_URL: used for "About" and "Find Location" links.
 * - FORMS_SUBMIT_URL: Equipter-Sanity frontend base URL for form submit/entry (rental flow).
 * - API_BASE: optional; only for debugApi (legacy). Rental flow uses Sanity + FORMS_SUBMIT_URL.
 * - Sanity: same project/dataset as Equipter-Sanity studio (frontend). Set in .env.
 */
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "";
export const EQUIPTER_BASE_URL = process.env.EXPO_PUBLIC_EQUIPTER_BASE_URL || "https://equipter.com";
export const EQUIPTER_RENT_URL = process.env.EXPO_PUBLIC_EQUIPTER_RENT_URL || "https://equipter.com/rent";

/** Equipter-Sanity frontend base URL – used for form submit and entry APIs (same as web rental flow). */
export const FORMS_SUBMIT_URL = process.env.EXPO_PUBLIC_FORMS_SUBMIT_URL || "";

/** Sanity (Equipter-Sanity studio). Use same projectId/dataset as Equipter-Sanity/frontend. */
export const SANITY_PROJECT_ID = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID || "";
export const SANITY_DATASET = process.env.EXPO_PUBLIC_SANITY_DATASET || "production";
export const SANITY_API_VERSION = process.env.EXPO_PUBLIC_SANITY_API_VERSION || "2025-09-25";
/** Optional: read token. Use if you get 403 (e.g. private dataset or CORS). Create at sanity.io/manage → API → Tokens. */
export const SANITY_API_READ_TOKEN = process.env.EXPO_PUBLIC_SANITY_API_READ_TOKEN || "";

