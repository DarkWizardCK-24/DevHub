"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * `false` during server render and hydration, `true` afterwards. Use it to
 * render values that depend on the browser (its clock, its time zone)
 * without a hydration mismatch and without setState-in-effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
