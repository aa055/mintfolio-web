"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Paperclip } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Transaction } from "@/lib/api-types";
import { cn, formatCurrency, formatSignedCurrency, plTone } from "@/lib/utils";

export type RecentTransaction = Transaction & { dateLabel: string };

const WINDOWS = [
  { key: "7D", days: 7 },
  { key: "1M", days: 30 },
  { key: "1Y", days: 365 },
  { key: "All", days: null },
] as const;
type WindowKey = (typeof WINDOWS)[number]["key"];

const SHOWN = 5;

/**
 * The latest purchases and sales in a chosen window. `today` (YYYY-MM-DD)
 * comes from the server so the cut-off matches on both sides of hydration.
 */
export function RecentTransactions({
  transactions,
  today,
}: {
  transactions: RecentTransaction[];
  today: string;
}) {
  const [windowKey, setWindowKey] = useState<WindowKey>("1M");

  const visible = useMemo(() => {
    const days = WINDOWS.find((w) => w.key === windowKey)?.days ?? null;
    if (days === null) return transactions;
    const cutoff = new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return transactions.filter((t) => t.date >= cutoff);
  }, [transactions, today, windowKey]);

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h3 font-semibold text-foreground">Recent transactions</h2>
          <div role="group" aria-label="Time window" className="flex gap-1 rounded-md bg-surface-muted p-1">
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                type="button"
                aria-pressed={windowKey === w.key}
                onClick={() => setWindowKey(w.key)}
                className={cn(
                  "h-7 rounded-sm px-2.5 text-caption font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  windowKey === w.key
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                {w.key}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="flex-1 py-8 text-center text-body-sm text-foreground-muted">
            {transactions.length === 0
              ? "No purchases or sales yet."
              : "No purchases or sales in this period."}
          </p>
        ) : (
          <ul className="flex-1 divide-y divide-border">
            {visible.slice(0, SHOWN).map((t) => (
              <Row key={`${t.kind}-${t.holding_id ?? t.purchase_id}`} t={t} />
            ))}
          </ul>
        )}

        <Link
          href="/transactions"
          className="inline-flex items-center gap-1 self-start rounded-sm text-body-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all transactions
          {visible.length > SHOWN ? ` (${visible.length})` : ""}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}

function Row({ t }: { t: RecentTransaction }) {
  const isSale = t.kind === "sale";
  const Icon = isSale ? ArrowUpRight : ArrowDownLeft;
  const pl = t.realized_pl === null ? null : Number(t.realized_pl);
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted text-foreground-muted"
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-body-sm font-medium text-foreground">
          <span className="rounded-sm border border-border px-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
            {isSale ? "Sell" : "Buy"}
          </span>
          <span className="truncate">{t.title}</span>
        </p>
        <p className="truncate text-caption text-foreground-muted">
          {t.dateLabel}
          {t.detail ? ` · ${t.detail}` : ""}
          {t.receipt_count > 0 ? (
            <Paperclip className="ml-1.5 inline h-3 w-3 align-[-1px]" aria-label="Has receipts" />
          ) : null}
        </p>
      </div>
      <div className="shrink-0 text-right text-body-sm num">
        <p className="font-medium text-foreground">
          {formatCurrency(Number(t.amount), t.currency)}
        </p>
        {pl !== null ? (
          <p className={cn("text-caption", plTone(pl))}>{formatSignedCurrency(pl, t.currency)}</p>
        ) : null}
      </div>
    </li>
  );
}
