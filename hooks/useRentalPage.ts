/**
 * React Query hook for rental page content from Sanity (Equipter-Sanity API).
 * Use when Sanity is configured (EXPO_PUBLIC_SANITY_* in .env).
 */

import { useQuery } from "@tanstack/react-query";
import { fetchRentalPage } from "@/lib/sanityQueries";

export const RENTAL_PAGE_QUERY_KEY = ["sanity", "rentalPage"] as const;

export function useRentalPage() {
  return useQuery({
    queryKey: RENTAL_PAGE_QUERY_KEY,
    queryFn: fetchRentalPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
