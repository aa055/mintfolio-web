"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "mintfolio-theme";
/** Used when nothing is saved yet. */
export const DEFAULT_THEME: Theme = "light";

/**
 * Runs inline in <head> before first paint (see app/layout.tsx), so the
 * page never flashes the wrong theme. Keep it tiny and dependency-free.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}")||"${DEFAULT_THEME}";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

function readTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    return t === "light" || t === "dark" || t === "system" ? t : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME; // storage blocked (private mode etc.)
  }
}

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/** Current theme choice and a setter that saves it for this device. */
export function useTheme(): [Theme | null, (theme: Theme) => void] {
  // null until mounted: the saved choice only exists in the browser.
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => setThemeState(readTheme()), []);

  // "System" follows the OS live.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // can't persist; still apply for this page view
    }
    apply(next);
    setThemeState(next);
  }, []);

  return [theme, setTheme];
}
