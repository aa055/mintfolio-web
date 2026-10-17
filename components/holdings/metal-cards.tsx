import { Card, CardContent } from "@/components/ui/card";
import type { MetalSummary } from "@/lib/api-types";
import { cn, formatCurrency, formatPercent, formatSignedCurrency, formatWeight, plTone } from "@/lib/utils";
import type { DisplayWeightUnit } from "@/lib/utils";

const METAL_LABEL = { gold: "Gold", silver: "Silver" } as const;
const UNIT_SHORT: Record<DisplayWeightUnit, string> = { g: "g", oz: "oz", tola: "tola" };
const UNIT_GRAMS: Record<DisplayWeightUnit, number> = { g: 1, oz: 31.1035, tola: 11.6638 };
const METAL_SWATCH = { gold: "bg-series-gold", silver: "bg-series-silver" } as const;

/**
 * One card per metal held: value at spot, gain/loss, weight (and fine
 * metal content) and average cost per gram. Covers active items in the
 * user's currency — the same basis as the Home tiles.
 */
export function MetalCards({
  metals,
  currency,
  otherCurrencyCount = 0,
  weightUnit = "g",
}: {
  metals: MetalSummary[];
  currency: string;
  weightUnit?: DisplayWeightUnit;
  /** Active items bought in other currencies — not in these totals. */
  otherCurrencyCount?: number;
}) {
  const ordered = (["gold", "silver"] as const)
    .map((m) => metals.find((x) => x.metal === m))
    .filter((m): m is MetalSummary => m !== undefined && Number(m.grams) > 0);
  if (ordered.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ordered.map((m) => {
          const value = Number(m.current_value);
          const cost = Number(m.cost_basis);
          const grams = Number(m.grams);
          const pure = Number(m.pure_grams);
          const pl = value - cost;
          const pct = cost ? (pl / cost) * 100 : null;
          return (
            <Card key={m.metal}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="flex items-center gap-2 text-body-sm font-semibold text-foreground">
                    <span className={cn("h-2.5 w-2.5 rounded-sm", METAL_SWATCH[m.metal])} aria-hidden />
                    {METAL_LABEL[m.metal]}
                  </p>
                  <div className="text-right">
                    <p className="font-display text-h3 font-medium tracking-tight text-foreground">
                      {formatCurrency(value, currency)}
                    </p>
                    <p className={cn("text-caption num", plTone(pl))}>
                      {formatSignedCurrency(pl, currency)}
                      {pct !== null ? ` (${formatPercent(pct)})` : ""}
                    </p>
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-caption">
                  <div>
                    <dt className="text-foreground-subtle">Held</dt>
                    <dd className="mt-0.5 font-medium text-foreground num">{formatWeight(grams, weightUnit)}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground-subtle">Fine {m.metal}</dt>
                    <dd className="mt-0.5 font-medium text-foreground num">{formatWeight(pure, weightUnit)}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground-subtle">Avg cost / {UNIT_SHORT[weightUnit]}</dt>
                    <dd className="mt-0.5 font-medium text-foreground num">
                      {grams ? formatCurrency((cost / grams) * UNIT_GRAMS[weightUnit], currency) : "—"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {otherCurrencyCount > 0 ? (
        <p className="text-caption text-foreground-subtle">
          {currency} items only — {otherCurrencyCount} item{otherCurrencyCount !== 1 ? "s" : ""} bought
          in other currencies {otherCurrencyCount !== 1 ? "aren't" : "isn't"} included in these cards.
        </p>
      ) : null}
    </div>
  );
}
