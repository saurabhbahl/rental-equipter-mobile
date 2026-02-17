/**
 * Sanity client for the mobile app.
 * Uses the same project/dataset as Equipter-Sanity studio (see Equipter-Sanity/frontend and studio).
 * Configure via EXPO_PUBLIC_SANITY_PROJECT_ID and EXPO_PUBLIC_SANITY_DATASET in .env.
 */

import { createClient, type SanityClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import {
  SANITY_PROJECT_ID,
  SANITY_DATASET,
  SANITY_API_VERSION,
  SANITY_API_READ_TOKEN,
} from "./useEnv";

export const sanityClient: SanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: !SANITY_API_READ_TOKEN, // token requests often bypass CDN
  perspective: "published",
  ...(SANITY_API_READ_TOKEN
    ? { token: SANITY_API_READ_TOKEN }
    : {}),
});

/** Build image URLs for Sanity image refs (e.g. productHero.backgroundImage). */
export const sanityImageBuilder = imageUrlBuilder(sanityClient);

export function isSanityConfigured(): boolean {
  return Boolean(SANITY_PROJECT_ID && SANITY_DATASET);
}
