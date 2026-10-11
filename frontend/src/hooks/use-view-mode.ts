"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ViewMode = "grid" | "list" | "compact";

const listeners = new Set<() => void>();
const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

/**
 * The chosen layout for a screen, remembered per screen in localStorage.
 * Server render and hydration use `fallback`; the saved choice applies after.
 */
export function useViewMode(key: string, fallback: ViewMode = "list"): [ViewMode, (mode: ViewMode) => void] {
  const storageKey = `devhub:view:${key}`;
  const mode = useSyncExternalStore(
    subscribe,
    () => {
      try {
        const saved = localStorage.getItem(storageKey);
        return saved === "grid" || saved === "list" || saved === "compact" ? saved : fallback;
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );
  const set = useCallback(
    (next: ViewMode) => {
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Storage blocked: the choice just won't persist.
      }
      listeners.forEach((callback) => callback());
    },
    [storageKey],
  );
  return [mode, set];
}
