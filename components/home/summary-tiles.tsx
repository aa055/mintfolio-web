import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { PortfolioSummary } from "@/lib/api-types";
import { cn, formatCurrency, formatPercent, formatSignedCurrency, formatWeight, plTone } from "@/lib/utils";

/**
 * The four headline numbers: invested, current value, today's move and
 * all-time result. `todayLabel` is the previous price day, formatted on
 * the server.
 */
export function SummaryTiles({
  summary,
  todayLabel,
}: {
  summary: PortfolioSummary;
  todayLabel: string | null;
}) {
  const cur = summary.currency;
  const today = summary.today_change;
  const allTime = Number(summary.all_time_pl);
  const allTimePct = summary.all_time_pl_pct === null ? null : Number(summary.all_time_pl_pct);
  const weights = summary.by_metal
    .map((m) => `${m.metal === "gold" ? "Gold" : "Silver"} ${formatWeight(Number(m.grams), "g")}`)
    .join(" · ");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile label="Total invested" value={formatCurrency(Number(summary.cost_basis), cur)}>
        {summary.active_count} active item{summary.active_count !== 1 ? "s" : ""}
      </Tile>
      <Tile label="Current value" value={formatCurrency(Number(summary.total_value), cur)}>
        {weights || "No metal held"}
      </Tile>
      {today ? (
        <Tile
          label="Today"
          value={formatSignedCurrency(Number(today.amount), cur)}
          amount={Number(today.amount)}
        >
          {today.pct !== null ? `${formatPercent(Number(today.pct))} · ` : ""}
          vs {todayLabel}
        </Tile>
      ) : (
        <Tile label="Today" value="—">
          {summary.pricing_mode === "manual"
            ? "Not shown with manual pricing"
            : "Needs two days of prices"}
        </Tile>
      )}
      <Tile label="All-time gain / loss" value={formatSignedCurrency(allTime, cur)} amount={allTime}>
        {allTimePct !== null ? `${formatPercent(allTimePct)} · ` : ""}
        realized {formatSignedCurrency(Number(summary.realized_pl), cur)}
      </Tile>
    </div>
  );
}

function Tile({
  label,
  value,
  amount,
  children,
}: {
  label: string;
  value: string;
  /** Set for gain/loss tiles: adds the tone and a direction icon. */
  amount?: number;
  children: React.ReactNode;
}) {
  const Icon = amount === undefined || amount === 0 ? null : amount > 0 ? TrendingUp : TrendingDown;
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
          {label}
        </p>
        <p
          className={cn(
            "mt-2 flex items-center gap-1.5 font-display text-h2 font-medium tracking-tight text-foreground",
            amount !== undefined && plTone(amount),
          )}
        >
          {Icon ? <Icon className="h-5 w-5 shrink-0" aria-hidden /> : null}
          {value}
        </p>
        <p className="mt-1 text-caption text-foreground-muted num">{children}</p>
      </CardContent>
    </Card>
  );
}
