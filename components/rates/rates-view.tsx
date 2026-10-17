"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import type { Metal, PricePoint } from "@/lib/api-types";
import { cn, formatCurrency, formatPercent, plTone } from "@/lib/utils";
import { useChartColors } from "@/lib/use-chart-colors";

const GRAMS_PER_TOLA = 11.6638;
const GRAMS_PER_TROY_OZ = 31.1035;

const RANGES = ["1M", "3M", "6M", "1Y", "5Y"] as const;
type Range = (typeof RANGES)[number];
const RANGE_DAYS: Record<Range, number> = { "1M": 30, "3M": 91, "6M": 182, "1Y": 365, "5Y": 1826 };
const RANGE_LABEL: Record<Range, string> = {
  "1M": "1 month",
  "3M": "3 months",
  "6M": "6 months",
  "1Y": "1 year",
  "5Y": "5 years",
};

const METAL_LABEL = { gold: "Gold", silver: "Silver" } as const;
const SPOT_LABEL = { gold: "Gold 24K", silver: "Fine silver" } as const;

// Purities shown per metal. Rates = pure spot × fraction — the same rule the
// app uses to value holdings, so these match what Holdings shows.
const PURITIES: Record<Metal, { label: string; note?: string; fraction: number }[]> = {
  gold: [
    { label: "24K", note: "pure", fraction: 1 },
    { label: "22K", fraction: 22 / 24 },
    { label: "21K", note: "common in the Gulf", fraction: 21 / 24 },
    { label: "18K", fraction: 18 / 24 },
  ],
  silver: [
    { label: "Fine", note: "pure", fraction: 1 },
    { label: "999", fraction: 0.999 },
    { label: "925", note: "sterling", fraction: 0.925 },
  ],
};

interface Point {
  day: string;
  t: number; // UTC ms
  rate: number; // per gram, pure metal
}

// Fixed locale + UTC: identical on the server and in the browser.
const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
const fullFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function toPoints(raw: PricePoint[]): Point[] {
  return raw.map((p) => ({
    day: p.day,
    t: Date.parse(`${p.day}T00:00:00Z`),
    rate: Number(p.rate_per_gram),
  }));
}

function since(points: Point[], days: number): Point[] {
  if (points.length === 0) return points;
  const from = points[points.length - 1].t - days * 86_400_000;
  return points.filter((p) => p.t >= from);
}

function extremes(points: Point[]) {
  let hi = points[0];
  let lo = points[0];
  for (const p of points) {
    if (p.rate > hi.rate) hi = p;
    if (p.rate < lo.rate) lo = p;
  }
  return { hi, lo };
}

/**
 * Spot rate history for gold and silver: today's rate and move, a chart
 * over up to 5 years, period and 52-week stats, and a karat/purity table.
 * All history arrives from the server; metal and range switch instantly.
 */
export function RatesView({
  history,
  currency,
  sources,
  initialMetal,
  initialRange,
}: {
  history: Record<Metal, PricePoint[]>;
  currency: string;
  sources: string[];
  initialMetal: Metal;
  initialRange: Range;
}) {
  const [metal, setMetal] = useState<Metal>(initialMetal);
  const [range, setRange] = useState<Range>(initialRange);
  const colors = useChartColors();

  // Keep the choice in the URL (after render — Next.js patches history).
  useEffect(() => {
    const qs = new URLSearchParams();
    if (metal !== "gold") qs.set("metal", metal);
    if (range !== "1Y") qs.set("range", range);
    const query = qs.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [metal, range]);

  const all = useMemo(() => toPoints(history[metal]), [history, metal]);
  const data = useMemo(() => since(all, RANGE_DAYS[range]), [all, range]);

  if (all.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <Card>
          <CardContent className="px-6 py-12 text-center text-body-sm text-foreground-muted">
            No price history in {currency} yet. History is available in AED, USD and SAR — change
            your currency in Settings to see it.
          </CardContent>
        </Card>
      </div>
    );
  }

  const latest = all[all.length - 1];
  const previous = all.length > 1 ? all[all.length - 2] : null;
  const dayChange = previous ? latest.rate - previous.rate : null;
  const dayPct = previous && previous.rate ? (dayChange! / previous.rate) * 100 : null;

  const first = data[0];
  const periodChange = latest.rate - first.rate;
  const periodPct = first.rate ? (periodChange / first.rate) * 100 : null;
  const period = extremes(data);
  const year = extremes(since(all, 365));
  const spanDays = (latest.t - first.t) / 86_400_000;
  const tickFormat = (t: number) => (spanDays > 120 ? monthFormat : dayFormat).format(t);
  const lineColor = colors ? colors[metal] : undefined;

  return (
    <div className="space-y-6">
      <Header />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Segmented
          label="Metal"
          options={[
            ["gold", "Gold"],
            ["silver", "Silver"],
          ]}
          value={metal}
          onChange={setMetal}
        />
        <p className="text-caption text-foreground-subtle">
          Spot rates in {currency} · last updated {fullFormat.format(latest.t)}
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-body-sm font-medium text-foreground-muted">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", metal === "gold" ? "bg-series-gold" : "bg-series-silver")}
                aria-hidden
              />
              {SPOT_LABEL[metal]} spot · per gram
            </p>
            <p className="mt-1 font-display text-display-md font-medium tracking-tight text-foreground">
              {formatCurrency(latest.rate, currency)}
            </p>
            {dayChange !== null && previous ? (
              <ChangeLine
                amount={dayChange}
                pct={dayPct}
                currency={currency}
                suffix={`since ${dayFormat.format(previous.t)}`}
              />
            ) : null}
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-body-sm sm:text-right">
            <dt className="text-foreground-muted">Per tola (11.66 g)</dt>
            <dd className="font-medium text-foreground num">
              {formatCurrency(latest.rate * GRAMS_PER_TOLA, currency)}
            </dd>
            <dt className="text-foreground-muted">Per troy ounce</dt>
            <dd className="font-medium text-foreground num">
              {formatCurrency(latest.rate * GRAMS_PER_TROY_OZ, currency)}
            </dd>
            <dt className="text-foreground-muted">Per kilogram</dt>
            <dd className="font-medium text-foreground num">
              {formatCurrency(latest.rate * 1000, currency)}
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-h3 font-semibold text-foreground">
                {METAL_LABEL[metal]} spot, per gram
              </h2>
              <ChangeLine
                amount={periodChange}
                pct={periodPct}
                currency={currency}
                suffix={`over ${RANGE_LABEL[range]}`}
              />
            </div>
            <Segmented label="Chart range" options={RANGES.map((r) => [r, r] as const)} value={range} onChange={setRange} />
          </div>

          {data.length < 2 ? (
            <p className="py-16 text-center text-body-sm text-foreground-muted">
              Not enough history for this range yet.
            </p>
          ) : (
            <div
              className="h-64 sm:h-80"
              role="img"
              aria-label={`${METAL_LABEL[metal]} spot per gram from ${fullFormat.format(first.t)} to ${fullFormat.format(latest.t)}: ${formatCurrency(first.rate, currency)} to ${formatCurrency(latest.rate, currency)}. High ${formatCurrency(period.hi.rate, currency)}, low ${formatCurrency(period.lo.rate, currency)}.`}
            >
              {colors && lineColor ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                      // A price line, not an area: zoom to the range so moves are readable.
                      domain={["auto", "auto"]}
                      tickFormatter={(v: number) => formatCurrency(v, currency).replace(/\.00$/, "")}
                      tick={{ fill: colors.text, fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={84}
                    />
                    <Tooltip
                      content={<RateTooltip currency={currency} />}
                      cursor={{ stroke: colors.text, strokeWidth: 1 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke={lineColor}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: colors.surface, fill: lineColor }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-caption sm:grid-cols-4">
            <Stat label={`${RANGE_LABEL[range]} high`} value={formatCurrency(period.hi.rate, currency)} note={fullFormat.format(period.hi.t)} />
            <Stat label={`${RANGE_LABEL[range]} low`} value={formatCurrency(period.lo.rate, currency)} note={fullFormat.format(period.lo.t)} />
            <Stat label="52-week high" value={formatCurrency(year.hi.rate, currency)} note={fullFormat.format(year.hi.t)} />
            <Stat label="52-week low" value={formatCurrency(year.lo.rate, currency)} note={fullFormat.format(year.lo.t)} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <div>
            <h2 className="text-h3 font-semibold text-foreground">
              {metal === "gold" ? "Gold rates by karat" : "Silver rates by purity"}
            </h2>
            <p className="mt-1 text-caption text-foreground-subtle">
              Spot value of the metal content. Jewellery and coins from dealers cost more — making
              charges and premiums are added on top.
            </p>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full whitespace-nowrap text-body-sm">
              <thead>
                <tr className="border-b border-border text-left text-caption text-foreground-subtle">
                  <th className="py-2 pr-3 font-medium">Purity</th>
                  <th className="px-3 py-2 text-right font-medium">Per gram</th>
                  <th className="px-3 py-2 text-right font-medium">Per tola</th>
                  <th className="hidden py-2 pl-3 text-right font-medium sm:table-cell">Per troy oz</th>
                </tr>
              </thead>
              <tbody>
                {PURITIES[metal].map((p) => {
                  const perGram = latest.rate * p.fraction;
                  return (
                    <tr key={p.label} className="border-b border-border last:border-b-0">
                      <td className="py-2.5 pr-3">
                        <span className="font-medium text-foreground">{p.label}</span>
                        {p.note ? <span className="ml-2 text-caption text-foreground-subtle">{p.note}</span> : null}
                      </td>
                      <td className="px-3 py-2.5 text-right num text-foreground">{formatCurrency(perGram, currency)}</td>
                      <td className="px-3 py-2.5 text-right num text-foreground">
                        {formatCurrency(perGram * GRAMS_PER_TOLA, currency)}
                      </td>
                      <td className="hidden py-2.5 pl-3 text-right num text-foreground sm:table-cell">
                        {formatCurrency(perGram * GRAMS_PER_TROY_OZ, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-caption text-foreground-subtle">
        Data: {sources.includes("goldapi") ? "daily spot rates from GoldAPI.io" : null}
        {sources.includes("goldapi") && sources.includes("metalsdev") ? "; " : null}
        {sources.includes("metalsdev") ? "earlier history from metals.dev" : null}. Days without a
        new price (weekends, holidays) repeat the previous day&apos;s rate.
      </p>
    </div>
  );
}

function Header() {
  return (
    <div>
      <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">Metal rates</p>
      <h1 className="mt-2 font-display text-display-md font-medium tracking-tight text-foreground">
        Gold and silver prices
      </h1>
    </div>
  );
}

function ChangeLine({
  amount,
  pct,
  currency,
  suffix,
}: {
  amount: number;
  pct: number | null;
  currency: string;
  suffix: string;
}) {
  const Icon = amount === 0 ? Minus : amount > 0 ? ArrowUpRight : ArrowDownRight;
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1 text-body-sm num">
      <span className={cn("flex items-center gap-0.5 font-medium", plTone(amount))}>
        <Icon className="h-4 w-4" aria-hidden />
        {sign}
        {formatCurrency(Math.abs(amount), currency)}
        {pct !== null ? ` (${formatPercent(pct)})` : ""}
      </span>
      <span className="text-foreground-subtle">{suffix}</span>
    </p>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div>
      <dt className="text-foreground-subtle first-letter:uppercase">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground num">{value}</dd>
      <dd className="text-foreground-subtle">{note}</dd>
    </div>
  );
}

function Segmented<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly (readonly [K, string])[];
  value: K;
  onChange: (value: K) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex w-fit gap-1 rounded-md bg-surface-muted p-1">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "h-8 rounded-sm px-3 text-caption font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === key ? "bg-surface text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function RateTooltip({ active, payload, currency }: TooltipProps<number, string> & { currency: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Point;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-caption shadow-md">
      <p className="font-medium text-foreground">{fullFormat.format(p.t)}</p>
      <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 num">
        <dt className="text-foreground-muted">Per gram</dt>
        <dd className="text-right text-foreground">{formatCurrency(p.rate, currency)}</dd>
        <dt className="text-foreground-muted">Per tola</dt>
        <dd className="text-right text-foreground">{formatCurrency(p.rate * GRAMS_PER_TOLA, currency)}</dd>
      </dl>
    </div>
  );
}
