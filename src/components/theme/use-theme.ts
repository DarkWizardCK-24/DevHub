"use client";

import { useCallback, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "./theme-script";

export type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

/** The theme lives on <html data-theme>; this hook reads and writes it. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* private mode: the theme still applies for this visit */
    }
  }, []);

  return { theme, setTheme };
}
