"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Search, X } from "lucide-react";

import { formatSignedCurrency, plTone } from "@/components/dashboard/portfolio-summary";
import { SellButton, UndoSaleButton } from "@/components/purchases/holding-actions";
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
import type { HoldingForm, HoldingStatus, Metal, Sale } from "@/lib/api-types";
import { cn, formatCurrency, formatWeight } from "@/lib/utils";

export interface HoldingRow {
  id: string;
  purchaseId: string;
  metal: Metal;
  purity: string | null;
  form: HoldingForm | null;
  brand: string | null;
  storageLocation: string | null;
  dealer: string | null;
  purchaseDate: string; // ISO, for sorting and the sale form's min date
  purchaseDateLabel: string; // formatted on the server so hydration matches
  saleDateLabel: string | null;
  currency: string;
  quantity: number;
  grams: number; // weight_grams × quantity
  cost: number;
  value: number | null; // current value, active items only
  pl: number | null; // unrealized for active, realized for sold
  status: HoldingStatus;
  sale: Sale | null;
}

type SortKey = "date" | "weight" | "cost" | "value" | "pl";
type SortDir = "asc" | "desc";

interface Filters {
  q: string;
  metal: "all" | Metal;
  status: "all" | HoldingStatus;
  form: string; // "all" | HoldingForm
  dealer: string; // "all" | dealer name
  sort: SortKey;
  dir: SortDir;
}

const DEFAULTS: Filters = {
  q: "",
  metal: "all",
  status: "all",
  form: "all",
  dealer: "all",
  sort: "date",
  dir: "desc",
};

const SORT_KEYS: SortKey[] = ["date", "weight", "cost", "value", "pl"];
const SORT_LABEL: Record<SortKey, [desc: string, asc: string]> = {
  date: ["Newest first", "Oldest first"],
  weight: ["Heaviest first", "Lightest first"],
  cost: ["Highest cost", "Lowest cost"],
  value: ["Highest value", "Lowest value"],
  pl: ["Best P/L", "Worst P/L"],
};
const METAL_LABEL = { gold: "Gold", silver: "Silver" } as const;

/** Read filters from the URL, ignoring anything unrecognised. */
function parseFilters(params: Record<string, string>): Filters {
  const pick = <T extends string>(v: string | undefined, allowed: readonly T[], fallback: T) =>
    v !== undefined && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  return {
    q: params.q ?? "",
    metal: pick(params.metal, ["all", "gold", "silver"] as const, "all"),
    status: pick(params.status, ["all", "active", "sold"] as const, "all"),
    form: params.form ?? "all",
    dealer: params.dealer ?? "all",
    sort: pick(params.sort, SORT_KEYS, "date"),
    dir: pick(params.dir, ["asc", "desc"] as const, "desc"),
  };
}

/** Keep the URL in sync so a filtered view survives refresh and can be bookmarked. */
function writeUrl(filters: Filters) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(filters) as [keyof Filters, string][]) {
    if (value !== DEFAULTS[key]) qs.set(key, value);
  }
  const query = qs.toString();
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

function sortValue(row: HoldingRow, key: SortKey): number | null {
  switch (key) {
    case "date":
      return Date.parse(row.purchaseDate);
    case "weight":
      return row.grams;
    case "cost":
      return row.cost;
    case "value":
      return row.value;
    case "pl":
      return row.pl;
  }
}

/** Rows without a value (unvalued or sold) sort last in either direction. */
function compareRows(a: HoldingRow, b: HoldingRow, key: SortKey, dir: SortDir): number {
  const av = sortValue(a, key);
  const bv = sortValue(b, key);
  if (av === null || bv === null) return av === bv ? 0 : av === null ? 1 : -1;
  return dir === "asc" ? av - bv : bv - av;
}

function itemLabel(row: HoldingRow) {
  return [METAL_LABEL[row.metal], row.purity, row.form].filter(Boolean).join(" ");
}

export function HoldingsTable({
  rows,
  currency,
  initialParams,
}: {
  rows: HoldingRow[];
  currency: string;
  initialParams: Record<string, string>;
}) {
  const [filters, setFilters] = useState<Filters>(() => parseFilters(initialParams));

  // After render, not inside the state update: Next.js patches history and
  // would otherwise update the router while this component renders.
  useEffect(() => writeUrl(filters), [filters]);

  function update(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  // Same column flips direction; a new column starts high-to-low.
  function toggleSort(key: SortKey) {
    update(
      filters.sort === key
        ? { dir: filters.dir === "desc" ? "asc" : "desc" }
        : { sort: key, dir: "desc" },
    );
  }

  const forms = useMemo(
    () => [...new Set(rows.map((r) => r.form).filter((f): f is HoldingForm => !!f))].sort(),
    [rows],
  );
  const dealers = useMemo(
    () => [...new Set(rows.map((r) => r.dealer).filter((d): d is string => !!d))].sort(),
    [rows],
  );

  const visible = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (filters.metal === "all" || r.metal === filters.metal) &&
        (filters.status === "all" || r.status === filters.status) &&
        (filters.form === "all" || r.form === filters.form) &&
        (filters.dealer === "all" || r.dealer === filters.dealer) &&
        (!q ||
          [itemLabel(r), r.brand, r.dealer, r.storageLocation, r.sale?.sold_to]
            .filter(Boolean)
            .some((text) => text!.toLowerCase().includes(q))),
    );
    return out.sort((a, b) => compareRows(a, b, filters.sort, filters.dir));
  }, [rows, filters]);

  const filtered =
    filters.q !== "" ||
    filters.metal !== "all" ||
    filters.status !== "all" ||
    filters.form !== "all" ||
    filters.dealer !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
            Holdings
          </p>
          <h1 className="mt-2 font-display text-display-md font-medium tracking-tight text-foreground">
            Every item
          </h1>
          <p className="mt-2 text-body text-foreground-muted">
            One row per line item across all purchases.
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/purchases/new">
            <Plus />
            Add purchase
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-16 text-center">
            <h2 className="text-h3 font-semibold text-foreground">No holdings yet</h2>
            <p className="mt-2 text-body-sm text-foreground-muted">
              Record a purchase and its items will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <FilterBar
            filters={filters}
            update={update}
            forms={forms}
            dealers={dealers}
            canReset={filtered}
          />
          <Card>
            <CardContent className="p-0">
              {visible.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-body-sm text-foreground-muted">No items match these filters.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => update({ ...DEFAULTS, sort: filters.sort, dir: filters.dir })}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="hidden sm:block">
                    <Table rows={visible} filters={filters} toggleSort={toggleSort} />
                  </div>
                  <MobileList rows={visible} />
                </>
              )}
            </CardContent>
          </Card>
          <Totals rows={visible} total={rows.length} currency={currency} />
        </>
      )}
    </div>
  );
}

function FilterBar({
  filters,
  update,
  forms,
  dealers,
  canReset,
}: {
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  forms: string[];
  dealers: string[];
  canReset: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative lg:w-64">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Search holdings"
          placeholder="Search brand, dealer, location…"
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          className="pl-9"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:flex-1">
        <FilterSelect
          label="Metal"
          value={filters.metal}
          onChange={(v) => update({ metal: v as Filters["metal"] })}
          options={[
            ["all", "All metals"],
            ["gold", "Gold"],
            ["silver", "Silver"],
          ]}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => update({ status: v as Filters["status"] })}
          options={[
            ["all", "Any status"],
            ["active", "Active"],
            ["sold", "Sold"],
          ]}
        />
        <FilterSelect
          label="Form"
          value={filters.form}
          onChange={(v) => update({ form: v })}
          options={[
            ["all", "All forms"],
            ...forms.map((f) => [f, f.charAt(0).toUpperCase() + f.slice(1)] as [string, string]),
          ]}
        />
        <FilterSelect
          label="Dealer"
          value={filters.dealer}
          onChange={(v) => update({ dealer: v })}
          options={[["all", "All dealers"], ...dealers.map((d) => [d, d] as [string, string])]}
        />
        {/* Phones get the card list, which has no sortable headers */}
        <div className="col-span-2 sm:hidden">
          <FilterSelect
            label="Sort"
            value={`${filters.sort}:${filters.dir}`}
            onChange={(v) => {
              const [sort, dir] = v.split(":") as [SortKey, SortDir];
              update({ sort, dir });
            }}
            options={SORT_KEYS.flatMap((key) => [
              [`${key}:desc`, SORT_LABEL[key][0]] as [string, string],
              [`${key}:asc`, SORT_LABEL[key][1]] as [string, string],
            ])}
          />
        </div>
      </div>
      {canReset ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => update({ ...DEFAULTS, sort: filters.sort, dir: filters.dir })}
        >
          <X />
          Reset
        </Button>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="lg:w-40">
        <SelectValue>{options.find(([v]) => v === value)?.[1]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, text]) => (
          <SelectItem key={v} value={v}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Table({
  rows,
  filters,
  toggleSort,
}: {
  rows: HoldingRow[];
  filters: Filters;
  toggleSort: (key: SortKey) => void;
}) {
  const header = (key: SortKey, label: string, className?: string) => (
    <SortHeader
      label={label}
      active={filters.sort === key}
      dir={filters.dir}
      onClick={() => toggleSort(key)}
      className={className}
    />
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-border text-left text-caption text-foreground-subtle">
            <th className="px-4 py-3 font-medium sm:px-6">Item</th>
            <th className="hidden px-3 py-3 font-medium md:table-cell">Dealer</th>
            {header("date", "Purchased", "hidden md:table-cell")}
            {header("weight", "Weight", "hidden sm:table-cell")}
            {header("cost", "Cost")}
            {header("value", "Value", "hidden sm:table-cell")}
            {header("pl", "P/L")}
            <th className="px-4 py-3 sm:px-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-b-0 align-top">
              <td className="px-4 py-3 sm:px-6">
                <p className="font-medium text-foreground">
                  {itemLabel(r)}
                  {r.status === "sold" ? (
                    <span className="ml-2 rounded-sm bg-surface-muted px-1.5 py-0.5 text-caption font-normal text-foreground-muted">
                      Sold
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-caption text-foreground-muted">
                  {[r.brand, r.storageLocation].filter(Boolean).join(" · ")}
                </p>
                {/* Columns hidden on small screens fold into this line */}
                <p className="mt-0.5 text-caption text-foreground-muted num md:hidden">
                  {[r.dealer, r.purchaseDateLabel].filter(Boolean).join(" · ")}
                </p>
                {r.sale ? (
                  <p className="mt-0.5 text-caption text-foreground-muted num">
                    Sold {r.saleDateLabel} for{" "}
                    {formatCurrency(Number(r.sale.sale_price), r.sale.sale_currency)}
                  </p>
                ) : null}
              </td>
              <td className="hidden px-3 py-3 text-foreground-muted md:table-cell">
                {r.dealer ?? "—"}
              </td>
              <td className="hidden whitespace-nowrap px-3 py-3 text-right num text-foreground-muted md:table-cell">
                {r.purchaseDateLabel}
              </td>
              <td className="hidden whitespace-nowrap px-3 py-3 text-right num text-foreground-muted sm:table-cell">
                {formatWeight(r.grams, "g")}
                {r.quantity > 1 ? (
                  <span className="block text-caption text-foreground-subtle">
                    {r.quantity} × {formatWeight(r.grams / r.quantity, "g")}
                  </span>
                ) : null}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right num text-foreground">
                {formatCurrency(r.cost, r.currency)}
              </td>
              <td className="hidden whitespace-nowrap px-3 py-3 text-right num text-foreground sm:table-cell">
                {r.value !== null ? (
                  formatCurrency(r.value, r.currency)
                ) : (
                  <span
                    className="text-foreground-subtle"
                    title={
                      r.status === "sold"
                        ? undefined
                        : `No ${r.currency} rate, or unrecognised purity`
                    }
                  >
                    —
                  </span>
                )}
              </td>
              <td
                className={cn(
                  "whitespace-nowrap px-3 py-3 text-right num",
                  r.pl !== null ? plTone(r.pl) : "text-foreground-subtle",
                )}
              >
                {r.pl !== null ? formatSignedCurrency(r.pl, r.currency) : "—"}
                {r.status === "sold" && r.pl !== null ? (
                  <span className="block text-caption text-foreground-subtle">realized</span>
                ) : null}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right sm:px-6">
                <div className="flex justify-end gap-1">
                  {r.sale ? (
                    <UndoSaleButton holdingId={r.id} />
                  ) : (
                    <SellButton
                      holdingId={r.id}
                      label={itemLabel(r)}
                      currency={r.currency}
                      purchaseDate={r.purchaseDate}
                    />
                  )}
                  <Button asChild variant="ghost" size="sm" className="h-7 px-2">
                    <Link href={`/purchases/${r.purchaseId}/edit`} aria-label="Edit purchase">
                      <Pencil />
                    </Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Phone layout: one card per item; sorting still follows the filter state. */
function MobileList({ rows }: { rows: HoldingRow[] }) {
  return (
    <ul className="divide-y divide-border sm:hidden">
      {rows.map((r) => (
        <li key={r.id} className="space-y-2 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-foreground">
                {itemLabel(r)}
                {r.status === "sold" ? (
                  <span className="ml-2 rounded-sm bg-surface-muted px-1.5 py-0.5 text-caption font-normal text-foreground-muted">
                    Sold
                  </span>
                ) : null}
              </p>
              <p className="text-caption text-foreground-muted num">
                {[r.dealer, r.purchaseDateLabel, formatWeight(r.grams, "g")]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {r.sale ? (
                <p className="text-caption text-foreground-muted num">
                  Sold {r.saleDateLabel} for{" "}
                  {formatCurrency(Number(r.sale.sale_price), r.sale.sale_currency)}
                </p>
              ) : null}
            </div>
            <div className="shrink-0 text-right text-body-sm num">
              <p className="text-foreground">{formatCurrency(r.cost, r.currency)}</p>
              {r.value !== null ? (
                <p className="text-caption text-foreground-muted">
                  now {formatCurrency(r.value, r.currency)}
                </p>
              ) : null}
              {r.pl !== null ? (
                <p className={cn("text-caption", plTone(r.pl))}>
                  {formatSignedCurrency(r.pl, r.currency)}
                  {r.status === "sold" ? " realized" : ""}
                </p>
              ) : null}
            </div>
          </div>
          <div className="-ml-2 flex gap-1">
            {r.sale ? (
              <UndoSaleButton holdingId={r.id} />
            ) : (
              <SellButton
                holdingId={r.id}
                label={itemLabel(r)}
                currency={r.currency}
                purchaseDate={r.purchaseDate}
              />
            )}
            <Button asChild variant="ghost" size="sm" className="h-7 px-2">
              <Link href={`/purchases/${r.purchaseId}/edit`}>
                <Pencil />
                Edit
              </Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  const Icon = dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={cn("px-3 py-3 text-right font-medium", className)}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active && "text-foreground",
        )}
      >
        {label}
        {active ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
      </button>
    </th>
  );
}

/**
 * Totals for the visible rows. Money only adds up within one currency, so
 * the sums cover rows in the user's currency and say how many were left out.
 */
function Totals({ rows, total, currency }: { rows: HoldingRow[]; total: number; currency: string }) {
  const inCurrency = rows.filter((r) => r.currency === currency);
  const sum = (pick: (r: HoldingRow) => number | null) =>
    inCurrency.reduce((acc, r) => acc + (pick(r) ?? 0), 0);
  const active = rows.filter((r) => r.status === "active");
  const grams = (metal: Metal) =>
    active.filter((r) => r.metal === metal).reduce((acc, r) => acc + r.grams, 0);
  const other = rows.length - inCurrency.length;

  const cost = sum((r) => r.cost);
  const value = sum((r) => (r.status === "active" ? r.value : null));
  const pl = sum((r) => r.pl);

  return (
    <div className="flex flex-col gap-2 text-caption text-foreground-muted num sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
      <span className="font-medium text-foreground">
        {rows.length === total ? `${total} items` : `Showing ${rows.length} of ${total} items`}
      </span>
      {grams("gold") > 0 ? <span>Gold held {formatWeight(grams("gold"), "g")}</span> : null}
      {grams("silver") > 0 ? <span>Silver held {formatWeight(grams("silver"), "g")}</span> : null}
      <span>Cost {formatCurrency(cost, currency)}</span>
      <span>Value {formatCurrency(value, currency)}</span>
      <span className={plTone(pl)}>Total P/L {formatSignedCurrency(pl, currency)}</span>
      {other > 0 ? (
        <span>
          ({other} item{other !== 1 ? "s" : ""} in other currencies not totalled)
        </span>
      ) : null}
    </div>
  );
}
