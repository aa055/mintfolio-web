"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import type { PortfolioPoint } from "@/lib/api-types";
import {
  cn,
  formatCompactCurrency,
  formatCurrency,
  formatSignedCurrency,
  plTone,
} from "@/lib/utils";

const RANGES = ["1M", "3M", "6M", "YTD", "1Y", "ALL"] as const;
type Range = (typeof RANGES)[number];
const RANGE_DAYS: Partial<Record<Range, number>> = { "1M": 30, "3M": 91, "6M": 182, "1Y": 365 };
const RANGE_LABEL: Record<Range, string> = {
  "1M": "the last month",
  "3M": "the last 3 months",
  "6M": "the last 6 months",
  YTD: "this year",
  "1Y": "the last year",
  ALL: "all time",
};

interface Point {
  day: string;
  t: number; // UTC ms, for the x scale
  value: number;
  invested: number;
  realized: number;
}

/** Chart colours come from the theme's CSS variables (SVG attributes can't read var()). */
function useChartColors() {
  const [colors, setColors] = useState<Record<
    "value" | "baseline" | "grid" | "text" | "surface",
    string
  > | null>(null);
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const rgb = (name: string) => `rgb(${css.getPropertyValue(name).trim()})`;
    setColors({
      value: rgb("--primary"),
      baseline: rgb("--chart-baseline"),
      grid: rgb("--border"),
      text: rgb("--foreground-muted"),
      surface: rgb("--surface"),
    });
  }, []);
  return colors;
}

function sliceRange(points: Point[], range: Range): Point[] {
  if (range === "ALL" || points.length === 0) return points;
  const last = new Date(points[points.length - 1].t);
  const from =
    range === "YTD"
      ? Date.UTC(last.getUTCFullYear(), 0, 1)
      : last.getTime() - (RANGE_DAYS[range] ?? 0) * 86_400_000;
  return points.filter((p) => p.t >= from);
}

// Fixed locale: these also render on the server, and the browser's locale may differ.
const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
const fullFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Portfolio value over time against what was invested in it. Values are at
 * market rates; with manual pricing that's noted, since the tiles differ.
 */
export function PerformanceChart({
  points: raw,
  currency,
  pricingMode,
}: {
  points: PortfolioPoint[];
  currency: string;
  pricingMode: "live" | "manual";
}) {
  const [range, setRange] = useState<Range>("1Y");
  const colors = useChartColors();

  const all = useMemo<Point[]>(
    () =>
      raw.map((p) => ({
        day: p.day,
        t: Date.parse(`${p.day}T00:00:00Z`),
        value: Number(p.value),
        invested: Number(p.invested),
        realized: Number(p.realized),
      })),
    [raw],
  );
  const data = useMemo(() => sliceRange(all, range), [all, range]);

  const first = data[0];
  const last = data[data.length - 1];
  // Total gain = unrealized (value − invested) + realized from sales so far, so
  // selling at a profit doesn't read as a loss when the lot leaves the chart.
  const totalGain = (p: Point) => p.value - p.invested + p.realized;
  const gainChange = first && last ? totalGain(last) - totalGain(first) : null;
  const realizedInRange = first && last ? last.realized - first.realized : 0;
  const spanDays = first && last ? (last.t - first.t) / 86_400_000 : 0;
  const tickFormat = (t: number) => (spanDays > 120 ? monthFormat : dayFormat).format(t);

  // Screen-reader table: one row per month plus the latest day.
  const tableRows = useMemo(() => {
    const rows = data.filter((p, i) => i === 0 || p.day.endsWith("-01"));
    if (last && rows[rows.length - 1] !== last) rows.push(last);
    return rows;
  }, [data, last]);

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-h3 font-semibold text-foreground">Portfolio value</h2>
            {gainChange !== null ? (
              <p className="mt-1 text-body-sm text-foreground-muted">
                Gain over {RANGE_LABEL[range]}:{" "}
                <span className={cn("font-medium num", plTone(gainChange))}>
                  {formatSignedCurrency(gainChange, currency)}
                </span>
                {realizedInRange !== 0 ? (
                  <span className="text-foreground-subtle">
                    {" "}
                    (incl. {formatSignedCurrency(realizedInRange, currency)} realized from sales)
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
          <div
            role="group"
            aria-label="Chart range"
            className="flex flex-wrap gap-1 rounded-md bg-surface-muted p-1"
          >
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={cn(
                  "h-7 rounded-sm px-2.5 text-caption font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  range === r
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex gap-4 text-caption text-foreground-muted" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-primary" aria-hidden />
            Value
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="h-0 w-4 border-t-2 border-dashed border-[rgb(var(--chart-baseline))]"
              aria-hidden
            />
            Invested
          </li>
        </ul>

        {data.length < 2 ? (
          <p className="py-16 text-center text-body-sm text-foreground-muted">
            Not enough price history for this range yet.
          </p>
        ) : (
          <div
            className="h-64 sm:h-72"
            role="img"
            aria-label={`Portfolio value from ${fullFormat.format(first.t)} to ${fullFormat.format(last.t)}: ${formatCurrency(first.value, currency)} to ${formatCurrency(last.value, currency)}, invested ${formatCurrency(last.invested, currency)}.`}
          >
            {colors ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke={colors.grid} strokeWidth={1} />
                  <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={tickFormat}
                    tick={{ fill: colors.text, fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: colors.grid }}
                    minTickGap={40}
                  />
                  <YAxis
                    // Areas start at zero so the shaded size isn't exaggerated.
                    domain={[0, "auto"]}
                    tickFormatter={(v: number) => formatCompactCurrency(v, currency)}
                    tick={{ fill: colors.text, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip
                    content={<ChartTooltip currency={currency} />}
                    cursor={{ stroke: colors.text, strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Value"
                    stroke={colors.value}
                    strokeWidth={2}
                    fill={colors.value}
                    fillOpacity={0.1}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: colors.surface }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="invested"
                    name="Invested"
                    stroke={colors.baseline}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        )}

        {pricingMode === "manual" ? (
          <p className="text-caption text-foreground-subtle">
            The chart uses market rates; your tiles use your manual rates.
          </p>
        ) : null}

        <table className="sr-only">
          <caption>Portfolio value by month</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Value</th>
              <th>Invested</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((p) => (
              <tr key={p.day}>
                <td>{fullFormat.format(p.t)}</td>
                <td>{formatCurrency(p.value, currency)}</td>
                <td>{formatCurrency(p.invested, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  currency,
}: TooltipProps<number, string> & { currency: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Point;
  const gain = p.value - p.invested;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-caption shadow-md">
      <p className="font-medium text-foreground">{fullFormat.format(p.t)}</p>
      <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 num">
        <dt className="text-foreground-muted">Value</dt>
        <dd className="text-right text-foreground">{formatCurrency(p.value, currency)}</dd>
        <dt className="text-foreground-muted">Invested</dt>
        <dd className="text-right text-foreground">{formatCurrency(p.invested, currency)}</dd>
        <dt className="text-foreground-muted">Unrealized</dt>
        <dd className={cn("text-right", plTone(gain))}>{formatSignedCurrency(gain, currency)}</dd>
      </dl>
    </div>
  );
}
