"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Paperclip, Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Transaction } from "@/lib/api-types";
import { cn, formatCurrency, formatSignedCurrency, plTone } from "@/lib/utils";

export type FeedRow = Transaction & { dateLabel: string };

const TYPES = [
  { key: "all", label: "All" },
  { key: "purchase", label: "Purchases" },
  { key: "sale", label: "Sales" },
] as const;
const RANGES = [
  { key: "7D", days: 7 },
  { key: "1M", days: 30 },
  { key: "3M", days: 91 },
  { key: "1Y", days: 365 },
  { key: "ALL", days: null },
] as const;
const METALS = [
  ["all", "All metals"],
  ["gold", "Gold"],
  ["silver", "Silver"],
] as const;

type TypeKey = (typeof TYPES)[number]["key"];
type RangeKey = (typeof RANGES)[number]["key"];
type MetalKey = (typeof METALS)[number][0];
interface Filters {
  type: TypeKey;
  range: RangeKey;
  metal: MetalKey;
  q: string;
}
const DEFAULTS: Filters = { type: "all", range: "ALL", metal: "all", q: "" };

function parseFilters(params: Record<string, string>): Filters {
  const pick = <T extends string>(v: string | undefined, allowed: readonly T[], fallback: T) =>
    v !== undefined && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  return {
    type: pick(params.type, TYPES.map((t) => t.key), "all"),
    range: pick(params.range, RANGES.map((r) => r.key), "ALL"),
    metal: pick(params.metal, METALS.map((m) => m[0]), "all"),
    q: params.q ?? "",
  };
}

// Fixed locale + UTC: identical on the server and in the browser.
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Every purchase and sale, newest first, grouped by month. Filters live in
 * the URL. `today` (YYYY-MM-DD, user's timezone) comes from the server so
 * date windows match on both sides of hydration.
 */
export function TransactionsView({
  rows,
  currency,
  today,
  initialParams,
}: {
  rows: FeedRow[];
  currency: string;
  today: string;
  initialParams: Record<string, string>;
}) {
  const [filters, setFilters] = useState<Filters>(() => parseFilters(initialParams));

  // After render (not inside a state update): Next.js patches history.
  useEffect(() => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(filters) as [keyof Filters, string][]) {
      if (value !== DEFAULTS[key]) qs.set(key, value);
    }
    const query = qs.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [filters]);

  const update = (patch: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...patch }));
  const filtered =
    filters.type !== "all" || filters.range !== "ALL" || filters.metal !== "all" || filters.q !== "";

  const visible = useMemo(() => {
    const days = RANGES.find((r) => r.key === filters.range)?.days ?? null;
    const cutoff =
      days === null
        ? null
        : new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
    const q = filters.q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filters.type === "all" || r.kind === filters.type) &&
        (cutoff === null || r.date >= cutoff) &&
        (filters.metal === "all" || r.metals.includes(filters.metal)) &&
        (!q ||
          [r.title, r.detail, ...r.item_labels].some((text) => text.toLowerCase().includes(q))),
    );
  }, [rows, filters, today]);

  const groups = useMemo(() => {
    const out: { key: string; label: string; rows: FeedRow[] }[] = [];
    for (const r of visible) {
      const key = r.date.slice(0, 7);
      if (out[out.length - 1]?.key !== key) {
        out.push({ key, label: monthFormat.format(new Date(`${key}-01T00:00:00Z`)), rows: [] });
      }
      out[out.length - 1].rows.push(r);
    }
    return out;
  }, [visible]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
            Transactions
          </p>
          <h1 className="mt-2 font-display text-display-md font-medium tracking-tight text-foreground">
            Purchases and sales
          </h1>
          <p className="mt-2 text-body text-foreground-muted">
            Every order and sale, newest first. Open one to see its items and receipts.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <h2 className="text-h3 font-semibold text-foreground">No transactions yet</h2>
            <p className="text-body-sm text-foreground-muted">
              Purchases and sales appear here as you record them.
            </p>
            <Button asChild variant="accent" className="mt-2">
              <Link href="/purchases/new">
                <Plus />
                Record a purchase
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <Segmented
                label="Type"
                options={TYPES.map((t) => [t.key, t.label] as const)}
                value={filters.type}
                onChange={(type) => update({ type })}
              />
              <Segmented
                label="Date range"
                options={RANGES.map((r) => [r.key, r.key === "ALL" ? "All" : r.key] as const)}
                value={filters.range}
                onChange={(range) => update({ range })}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={filters.metal} onValueChange={(v) => update({ metal: v as MetalKey })}>
                <SelectTrigger aria-label="Metal" className="sm:w-36">
                  <SelectValue>{METALS.find(([k]) => k === filters.metal)?.[1]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {METALS.map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative sm:w-64">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
                  aria-hidden
                />
                <Input
                  type="search"
                  aria-label="Search transactions"
                  placeholder="Dealer, item, buyer…"
                  value={filters.q}
                  onChange={(e) => update({ q: e.target.value })}
                  className="pl-9"
                />
              </div>
              {filtered ? (
                <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULTS)}>
                  <X />
                  Reset
                </Button>
              ) : null}
            </div>
          </div>

          {visible.length === 0 ? (
            <Card>
              <CardContent className="px-6 py-12 text-center">
                <p className="text-body-sm text-foreground-muted">No transactions match these filters.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setFilters(DEFAULTS)}>
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groups.map((g) => (
                <section key={g.key} aria-labelledby={`month-${g.key}`}>
                  <h2
                    id={`month-${g.key}`}
                    className="mb-2 flex items-baseline justify-between text-caption font-semibold uppercase tracking-wider text-foreground-subtle"
                  >
                    {g.label}
                    <span className="font-normal normal-case tracking-normal">
                      {g.rows.length} transaction{g.rows.length !== 1 ? "s" : ""}
                    </span>
                  </h2>
                  <Card>
                    <ul className="divide-y divide-border">
                      {g.rows.map((r) => (
                        <FeedItem key={`${r.kind}-${r.holding_id ?? r.purchase_id}`} row={r} />
                      ))}
                    </ul>
                  </Card>
                </section>
              ))}
            </div>
          )}

          <Totals rows={visible} currency={currency} />
        </>
      )}
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
    <div role="group" aria-label={label} className="flex gap-1 rounded-md bg-surface-muted p-1">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "h-8 rounded-sm px-3 text-caption font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === key
              ? "bg-surface text-foreground shadow-sm"
              : "text-foreground-muted hover:text-foreground",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function FeedItem({ row }: { row: FeedRow }) {
  const isSale = row.kind === "sale";
  const Icon = isSale ? ArrowUpRight : ArrowDownLeft;
  const pl = row.realized_pl === null ? null : Number(row.realized_pl);
  const meta = [
    row.dateLabel,
    row.detail,
    row.payment_method === "card" ? "Card" : row.payment_method === "cash" ? "Cash" : null,
  ].filter(Boolean);
  return (
    <li>
      <Link
        href={`/purchases/${row.purchase_id}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6"
      >
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
            <span className="truncate">{row.title}</span>
          </p>
          <p className="truncate text-caption text-foreground-muted">
            {meta.join(" · ")}
            {row.receipt_count > 0 ? (
              <span className="ml-1.5 inline-flex items-center gap-0.5 align-[-1px]">
                <Paperclip className="h-3 w-3" aria-hidden />
                <span className="sr-only">receipts:</span>
                {row.receipt_count}
              </span>
            ) : null}
          </p>
        </div>
        <div className="shrink-0 text-right text-body-sm num">
          <p className="font-medium text-foreground">{formatCurrency(Number(row.amount), row.currency)}</p>
          {pl !== null ? (
            <p className={cn("text-caption", plTone(pl))}>{formatSignedCurrency(pl, row.currency)}</p>
          ) : null}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-foreground-subtle" aria-hidden />
      </Link>
    </li>
  );
}

/** Money only adds up within one currency: totals cover the user's currency. */
function Totals({ rows, currency }: { rows: FeedRow[]; currency: string }) {
  const inCurrency = rows.filter((r) => r.currency === currency);
  const sum = (kind: FeedRow["kind"]) =>
    inCurrency.filter((r) => r.kind === kind).reduce((acc, r) => acc + Number(r.amount), 0);
  const bought = sum("purchase");
  const sold = sum("sale");
  const realized = inCurrency.reduce((acc, r) => acc + Number(r.realized_pl ?? 0), 0);
  const other = rows.length - inCurrency.length;
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 text-caption text-foreground-muted num sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
      <span className="font-medium text-foreground">
        {rows.length} transaction{rows.length !== 1 ? "s" : ""}
      </span>
      <span>Bought {formatCurrency(bought, currency)}</span>
      <span>Sold {formatCurrency(sold, currency)}</span>
      <span>Net invested {formatCurrency(bought - sold, currency)}</span>
      {realized !== 0 ? (
        <span className={plTone(realized)}>Realized {formatSignedCurrency(realized, currency)}</span>
      ) : null}
      {other > 0 ? (
        <span>
          ({other} in other currencies not totalled)
        </span>
      ) : null}
    </div>
  );
}
