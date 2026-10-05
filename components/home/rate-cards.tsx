import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import type { MarketRate } from "@/lib/api-types";
import { cn, formatCurrency, plTone } from "@/lib/utils";

const LABEL = { gold: "Gold 24K", silver: "Silver 999" } as const;

/** Today's market rates beside the greeting; each card links to Metal rates. */
export function RateCards({ rates, asOf }: { rates: MarketRate[]; asOf: string | null }) {
  if (rates.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="grid grid-cols-2 gap-3">
        {rates.map((r) => (
          <RateCard key={r.metal} rate={r} />
        ))}
      </div>
      {asOf ? <p className="text-caption text-foreground-subtle">Market rates · {asOf}</p> : null}
    </div>
  );
}

function RateCard({ rate }: { rate: MarketRate }) {
  const change = rate.change_pct === null ? null : Number(rate.change_pct);
  const Icon = change === null || change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <Link
      href="/rates"
      className="block min-w-[10.5rem] rounded-lg border border-border bg-surface px-4 py-3 shadow-sm transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className="flex items-center gap-1.5 text-caption font-medium text-foreground-muted">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            rate.metal === "gold" ? "bg-series-gold" : "bg-series-silver",
          )}
          aria-hidden
        />
        {LABEL[rate.metal]}
      </p>
      <p className="mt-1 font-display text-h3 font-medium tracking-tight text-foreground">
        {formatCurrency(Number(rate.rate_per_gram), rate.currency)}
        <span className="ml-1 font-sans text-caption font-normal text-foreground-muted">/g</span>
      </p>
      {change !== null ? (
        <p className={cn("mt-0.5 flex items-center gap-0.5 text-caption num", plTone(change))}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {change > 0 ? "+" : change < 0 ? "−" : ""}
          {Math.abs(change).toFixed(2)}%
          <span className="ml-1 text-foreground-subtle">vs prev. day</span>
        </p>
      ) : null}
    </Link>
  );
}
