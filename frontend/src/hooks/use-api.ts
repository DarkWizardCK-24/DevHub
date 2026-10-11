"use client";

import useSWR, { mutate as globalMutate, type SWRConfiguration } from "swr";
import { api } from "@/lib/api/client";
import type { RequestOptions } from "@/lib/api/core";

type Query = RequestOptions["query"];

/**
 * Data fetching for client components (via SWR): caches responses, dedupes
 * identical requests, and revalidates when the tab regains focus.
 * Pass `null` as the path to skip fetching (e.g. until an id is known).
 */
export function useApi<T>(path: string | null, query?: Query, config?: SWRConfiguration<T>) {
  return useSWR<T>(path ? [path, query ?? {}] : null, ([p, q]: [string, Query]) => api.get<T>(p, q), {
    keepPreviousData: true,
    ...config,
  });
}

/**
 * Refetch every cached request whose path starts with one of the prefixes.
 * Call after a mutation, e.g. refresh("/tasks", "/dashboard").
 */
export function refresh(...prefixes: string[]) {
  return globalMutate(
    (key) => Array.isArray(key) && typeof key[0] === "string" && prefixes.some((prefix) => key[0].startsWith(prefix)),
  );
}
