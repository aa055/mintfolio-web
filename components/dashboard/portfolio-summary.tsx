import { CircleAlert, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { MetalSummary, PortfolioSummary, Rate } from "@/lib/api-types";
import { cn, formatCurrency, formatPercent, formatWeight } from "@/lib/utils";

const METAL_LABEL = { gold: "Gold", silver: "Silver" } as const;
const METAL_SWATCH = { gold: "bg-series-gold", silver: "bg-series-silver" } as const;
const PURE_LABEL = { gold: "24K", silver: "999" } as const;

// Live rates older than this get a "stale" note — the job runs daily, so
// two days means at least one run was missed.
const STALE_AFTER_MS = 2 * 24 * 60 * 60 * 1000;

export function formatSignedCurrency(amount: number, currency: string) {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${formatCurrency(Math.abs(amount), currency)}`;
}

export function plTone(amount: number) {
  return amount > 0 ? "text-success" : amount < 0 ? "text-destructive" : "text-foreground-muted";
}

export function PortfolioSummaryView({ summary }: { summary: PortfolioSummary }) {
  const cur = summary.currency;
  const unrealized = Number(summary.unrealized_pl);
  const realized = Number(summary.realized_pl);
  const pct = summary.unrealized_pl_pct === null ? null : Number(summary.unrealized_pl_pct);

  return (
    <section aria-label="Portfolio summary" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Current value" value={formatCurrency(Number(summary.total_value), cur)}>
          {summary.active_count} active item{summary.active_count !== 1 ? "s" : ""}
        </StatTile>
        <StatTile label="Cost basis" value={formatCurrency(Number(summary.cost_basis), cur)}>
          {formatCurrency(Number(summary.total_invested), cur)} invested overall
        </StatTile>
        <StatTile
          label="Unrealized P/L"
          value={formatSignedCurrency(unrealized, cur)}
          valueClassName={plTone(unrealized)}
          icon={unrealized > 0 ? TrendingUp : unrealized < 0 ? TrendingDown : undefined}
        >
          {pct === null ? "No valued holdings yet" : `${formatPercent(pct)} on cost`}
        </StatTile>
        <StatTile
          label="Realized P/L"
          value={formatSignedCurrency(realized, cur)}
          valueClassName={plTone(realized)}
        >
          {summary.sold_count} sold item{summary.sold_count !== 1 ? "s" : ""}
        </StatTile>
      </div>

      <RatesLine summary={summary} />
      <Notices summary={summary} />
      <Allocation metals={summary.by_metal} currency={cur} />
    </section>
  );
}

function StatTile({
  label,
  value,
  valueClassName,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: typeof TrendingUp;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
          {label}
        </p>
        <p
          className={cn(
            "mt-2 flex items-center gap-1.5 font-display text-h2 font-medium tracking-tight num text-foreground",
            valueClassName,
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

function RatesLine({ summary }: { summary: PortfolioSummary }) {
  const manual = summary.pricing_mode === "manual";
  if (summary.rates.length === 0) {
    return (
      <Notice>
        {manual
          ? `No manual rates set in ${summary.currency} — holdings can't be valued until you add them.`
          : `No live ${summary.currency} prices yet — the daily price job hasn't run for this currency.`}
      </Notice>
    );
  }

  const newest = Math.max(...summary.rates.map((r) => (r.fetched_at ? Date.parse(r.fetched_at) : 0)));
  const stale = !manual && newest > 0 && Date.now() - newest > STALE_AFTER_MS;

  return (
    <p className="text-caption text-foreground-muted num">
      <span className="font-medium text-foreground">{manual ? "Manual rates" : "Live rates"}</span>
      {summary.rates.map((r) => (
        <span key={r.metal}> · {rateLabel(r)}</span>
      ))}
      {newest > 0 ? (
        <span>
          {" "}
          · {manual ? "set" : "updated"}{" "}
          {new Date(newest).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </span>
      ) : null}
      {stale ? <span className="text-destructive"> · stale — check the daily price job</span> : null}
    </p>
  );
}

function rateLabel(r: Rate) {
  return `${METAL_LABEL[r.metal]} ${PURE_LABEL[r.metal]} ${formatCurrency(Number(r.rate_per_gram), r.currency)}/g`;
}

function Notices({ summary }: { summary: PortfolioSummary }) {
  return (
    <>
      {summary.unvalued_count > 0 ? (
        <Notice>
          {summary.unvalued_count} item{summary.unvalued_count !== 1 ? "s" : ""} couldn&apos;t be
          valued — the purity wasn&apos;t recognised or there&apos;s no rate for that metal.
        </Notice>
      ) : null}
      {summary.other_currency_count > 0 ? (
        <Notice>
          {summary.other_currency_count} item{summary.other_currency_count !== 1 ? "s" : ""} bought
          in other currencies {summary.other_currency_count !== 1 ? "aren't" : "isn't"} included in
          these {summary.currency} totals.
        </Notice>
      ) : null}
    </>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-md border border-caramel-300 bg-caramel-50 px-3 py-2 text-body-sm text-caramel-900">
      <CircleAlert className="h-4 w-4 shrink-0 translate-y-[2px] text-caramel-700" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/**
 * Part-to-whole: one stacked bar (gold vs silver share of current value)
 * with a legend, plus a per-metal table that doubles as the accessible
 * view of the same numbers.
 */
function Allocation({ metals, currency }: { metals: MetalSummary[]; currency: string }) {
  if (metals.length === 0) return null;
  const total = metals.reduce((sum, m) => sum + Number(m.current_value), 0);
  // Fixed order so each metal keeps its position and colour.
  const ordered = (["gold", "silver"] as const)
    .map((metal) => metals.find((m) => m.metal === metal))
    .filter((m): m is MetalSummary => m !== undefined);

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-h3 font-semibold text-foreground">Allocation by metal</h2>
          <ul className="flex gap-4 text-caption text-foreground-muted" aria-label="Legend">
            {ordered.map((m) => (
              <li key={m.metal} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-sm", METAL_SWATCH[m.metal])} aria-hidden />
                {METAL_LABEL[m.metal]}
              </li>
            ))}
          </ul>
        </div>

        {total > 0 ? (
          <div className="flex h-3 gap-0.5" aria-hidden>
            {ordered.map((m) => {
              const share = Number(m.current_value) / total;
              if (share === 0) return null;
              return (
                <div
                  key={m.metal}
                  className={cn(
                    "group relative h-full rounded-[4px] outline-none",
                    METAL_SWATCH[m.metal],
                  )}
                  style={{ width: `${share * 100}%` }}
                >
                  {/* Hover target taller than the 12px bar */}
                  <span className="absolute -inset-y-2 inset-x-0" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-caption text-foreground shadow-sm num group-hover:block">
                    {METAL_LABEL[m.metal]} · {formatCurrency(Number(m.current_value), currency)} ·{" "}
                    {(share * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        <table className="w-full whitespace-nowrap text-body-sm">
          <thead>
            <tr className="text-left text-caption text-foreground-subtle">
              <th className="pb-2 font-medium">Metal</th>
              <th className="pb-2 text-right font-medium">Weight</th>
              <th className="pb-2 text-right font-medium">Value</th>
              <th className="hidden pb-2 text-right font-medium sm:table-cell">Cost</th>
              <th className="pb-2 text-right font-medium">P/L</th>
              <th className="hidden pb-2 text-right font-medium sm:table-cell">Share</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((m) => {
              const value = Number(m.current_value);
              const pl = value - Number(m.cost_basis);
              return (
                <tr key={m.metal} className="border-t border-border">
                  <td className="py-2">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <span className={cn("h-2.5 w-2.5 rounded-sm", METAL_SWATCH[m.metal])} aria-hidden />
                      {METAL_LABEL[m.metal]}
                    </span>
                  </td>
                  <td className="py-2 text-right num text-foreground-muted">
                    {formatWeight(Number(m.grams), "g")}
                  </td>
                  <td className="py-2 text-right num text-foreground">
                    {formatCurrency(value, currency)}
                  </td>
                  <td className="hidden py-2 text-right num text-foreground-muted sm:table-cell">
                    {formatCurrency(Number(m.cost_basis), currency)}
                  </td>
                  <td className={cn("py-2 text-right num", plTone(pl))}>
                    {formatSignedCurrency(pl, currency)}
                  </td>
                  <td className="hidden py-2 text-right num text-foreground-muted sm:table-cell">
                    {total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
