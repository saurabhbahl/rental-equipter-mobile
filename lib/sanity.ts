/**
 * Sanity client for the mobile app.
 * Uses the same project/dataset as Equipter-Sanity studio (see Equipter-Sanity/frontend and studio).
 * Configure via EXPO_PUBLIC_SANITY_PROJECT_ID and EXPO_PUBLIC_SANITY_DATASET in .env (local)
 * or EAS environment / eas.json env (release builds).
 */

import { createClient, type SanityClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import {
  SANITY_PROJECT_ID,
  SANITY_DATASET,
  SANITY_API_VERSION,
  SANITY_API_READ_TOKEN,
} from "./useEnv";

export function isSanityConfigured(): boolean {
  return Boolean(SANITY_PROJECT_ID && SANITY_DATASET);
}

let _client: SanityClient | null = null;

/** Lazily create the client so a missing projectId does not crash the app at import time. */
export function getSanityClient(): SanityClient {
  if (!SANITY_PROJECT_ID) {
    throw new Error(
      "Missing EXPO_PUBLIC_SANITY_PROJECT_ID. Set it in .env for local runs, or in EAS env / eas.json for builds."
    );
  }
  if (!_client) {
    _client = createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: SANITY_API_VERSION,
      useCdn: !SANITY_API_READ_TOKEN,
      perspective: "published",
      ...(SANITY_API_READ_TOKEN ? { token: SANITY_API_READ_TOKEN } : {}),
    });
  }
  return _client;
}

/** Build image URLs for Sanity image refs (e.g. productHero.backgroundImage). */
export function getSanityImageBuilder() {
  return imageUrlBuilder(getSanityClient());
}
