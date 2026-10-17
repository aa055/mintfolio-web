import type { HoldingValue } from "@/lib/api-types";
import { formatCurrency } from "@/lib/utils";

export interface PremiumInfo {
  amount: number; // paid minus spot value (negative = below spot)
  pct: number | null;
  meltValue: number; // spot value of the metal on the purchase date
  source: "entered" | "market";
}

export function premiumFrom(v: HoldingValue | undefined): PremiumInfo | null {
  if (!v || v.premium === null || v.premium === undefined || !v.premium_source) return null;
  return {
    amount: Number(v.premium),
    pct: v.premium_pct === null ? null : Number(v.premium_pct),
    meltValue: Number(v.melt_value_at_purchase),
    source: v.premium_source,
  };
}

/**
 * "+12.3% over spot" under a cost. The amount, the spot value it's measured
 * against and where that rate came from are in the tooltip and for screen
 * readers. Neutral colour: a premium is a cost of buying, not a gain or loss.
 */
export function PremiumNote({
  premium,
  currency,
  purchaseDateLabel,
}: {
  premium: PremiumInfo | null;
  currency: string;
  purchaseDateLabel: string;
}) {
  if (!premium) return null;
  const above = premium.amount >= 0;
  const size =
    premium.pct !== null
      ? `${Math.abs(premium.pct).toFixed(1)}%`
      : formatCurrency(Math.abs(premium.amount), currency);
  const detail =
    `Paid ${formatCurrency(Math.abs(premium.amount), currency)} ${above ? "above" : "below"} ` +
    `the ${formatCurrency(premium.meltValue, currency)} spot value on ${purchaseDateLabel} ` +
    `(${premium.source === "entered" ? "your entered spot rate" : "market spot rate"})`;
  return (
    <span className="block text-caption text-foreground-subtle" title={detail}>
      {above ? "+" : "−"}
      {size} {above ? "over" : "under"} spot
      <span className="sr-only">. {detail}.</span>
    </span>
  );
}
