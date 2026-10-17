"use client";

import { useEffect, useState } from "react";

const TOKENS = {
  primary: "--primary",
  baseline: "--chart-baseline",
  gold: "--series-gold",
  silver: "--series-silver",
  grid: "--border",
  text: "--foreground-muted",
  surface: "--surface",
} as const;

export type ChartColors = Record<keyof typeof TOKENS, string>;

/**
 * Theme colours for Recharts, read from the CSS variables in globals.css.
 * SVG presentation attributes can't use var(), so they're resolved once
 * on the client. Null on the server and first render — render no chart
 * until it's set.
 */
export function useChartColors(): ChartColors | null {
  const [colors, setColors] = useState<ChartColors | null>(null);
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    setColors(
      Object.fromEntries(
        Object.entries(TOKENS).map(([key, name]) => [
          key,
          `rgb(${css.getPropertyValue(name).trim()})`,
        ]),
      ) as ChartColors,
    );
  }, []);
  return colors;
}
