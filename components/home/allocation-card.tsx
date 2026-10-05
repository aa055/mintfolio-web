import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { MetalSummary, PortfolioSummary } from "@/lib/api-types";
import { cn, formatCurrency, formatSignedCurrency, formatWeight, plTone } from "@/lib/utils";

const METAL_LABEL = { gold: "Gold", silver: "Silver" } as const;
const METAL_SWATCH = { gold: "bg-series-gold", silver: "bg-series-silver" } as const;

/**
 * Part-to-whole: one stacked bar of each metal's share of current value,
 * with a legend and a per-metal list that doubles as its accessible view.
 */
export function AllocationCard({ summary }: { summary: PortfolioSummary }) {
  const cur = summary.currency;
  // Fixed order so each metal keeps its position and colour.
  const metals = (["gold", "silver"] as const)
    .map((metal) => summary.by_metal.find((m) => m.metal === metal))
    .filter((m): m is MetalSummary => m !== undefined);
  const total = metals.reduce((sum, m) => sum + Number(m.current_value), 0);

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-h3 font-semibold text-foreground">Allocation by metal</h2>
          <ul className="flex gap-3 text-caption text-foreground-muted" aria-label="Legend">
            {metals.map((m) => (
              <li key={m.metal} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-sm", METAL_SWATCH[m.metal])} aria-hidden />
                {METAL_LABEL[m.metal]}
              </li>
            ))}
          </ul>
        </div>

        {total > 0 ? (
          <div className="flex h-3 gap-0.5" aria-hidden>
            {metals.map((m) => {
              const share = Number(m.current_value) / total;
              return share > 0 ? (
                <div
                  key={m.metal}
                  className={cn("group relative h-full rounded-[4px]", METAL_SWATCH[m.metal])}
                  style={{ width: `${share * 100}%` }}
                >
                  <span className="absolute -inset-y-2 inset-x-0" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-caption text-foreground shadow-sm num group-hover:block">
                    {METAL_LABEL[m.metal]} · {formatCurrency(Number(m.current_value), cur)} ·{" "}
                    {(share * 100).toFixed(1)}%
                  </span>
                </div>
              ) : null;
            })}
          </div>
        ) : null}

        <ul className="flex-1 divide-y divide-border">
          {metals.map((m) => {
            const value = Number(m.current_value);
            const pl = value - Number(m.cost_basis);
            return (
              <li key={m.metal} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="flex items-center gap-2 text-body-sm font-medium text-foreground">
                    <span className={cn("h-2.5 w-2.5 rounded-sm", METAL_SWATCH[m.metal])} aria-hidden />
                    {METAL_LABEL[m.metal]}
                  </p>
                  <p className="mt-0.5 text-caption text-foreground-muted num">
                    {formatWeight(Number(m.grams), "g")}
                    {total > 0 ? ` · ${((value / total) * 100).toFixed(1)}% of value` : ""}
                  </p>
                </div>
                <div className="text-right text-body-sm num">
                  <p className="text-foreground">{formatCurrency(value, cur)}</p>
                  <p className={cn("text-caption", plTone(pl))}>{formatSignedCurrency(pl, cur)}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          href="/holdings"
          className="inline-flex items-center gap-1 self-start rounded-sm text-body-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View holdings
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}

/** Caveats that change how the totals should be read. */
export function SummaryNotices({ summary }: { summary: PortfolioSummary }) {
  const notes: string[] = [];
  if (summary.unvalued_count > 0) {
    notes.push(
      `${summary.unvalued_count} item${summary.unvalued_count !== 1 ? "s" : ""} couldn't be valued — the purity wasn't recognised or there's no rate for that metal.`,
    );
  }
  if (summary.other_currency_count > 0) {
    notes.push(
      `${summary.other_currency_count} item${summary.other_currency_count !== 1 ? "s" : ""} bought in other currencies ${summary.other_currency_count !== 1 ? "aren't" : "isn't"} included in these ${summary.currency} totals.`,
    );
  }
  if (summary.pricing_mode === "manual" && summary.rates.length === 0) {
    notes.push(`No manual rates set in ${summary.currency} — add them in Settings to value your holdings.`);
  }
  if (notes.length === 0) return null;
  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <p
          key={note}
          className="flex items-start gap-2 rounded-md border border-caramel-300 bg-caramel-50 px-3 py-2 text-body-sm text-caramel-900"
        >
          <CircleAlert className="h-4 w-4 shrink-0 translate-y-[2px] text-caramel-700" aria-hidden />
          <span>{note}</span>
        </p>
      ))}
    </div>
  );
}
