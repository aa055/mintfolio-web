import Link from "next/link";
import { CircleAlert, Plus, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError, apiFetch } from "@/lib/api-client";
import type {
  Holding,
  MeResponse,
  Purchase,
  PurchaseListResponse,
} from "@/lib/api-types";
import { formatCurrency, formatWeight } from "@/lib/utils";

export default async function DashboardPage() {
  let me: MeResponse | null = null;
  let purchases: Purchase[] = [];
  let syncError: string | null = null;

  try {
    me = await apiFetch<MeResponse>("/auth/me", { method: "GET" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      try {
        me = await apiFetch<MeResponse>("/auth/sync", {
          method: "POST",
          body: {},
        });
      } catch (innerErr) {
        syncError =
          innerErr instanceof Error ? innerErr.message : String(innerErr);
      }
    } else {
      syncError = err instanceof Error ? err.message : String(err);
    }
  }

  if (me) {
    try {
      const list = await apiFetch<PurchaseListResponse>(
        `/portfolios/${me.portfolio.id}/purchases`,
        { method: "GET" },
      );
      purchases = list.purchases;
    } catch (err) {
      syncError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
            Dashboard
          </p>
          <h1 className="mt-2 font-display text-display-md font-medium tracking-tight text-foreground">
            {me?.user.display_name
              ? `Hi, ${me.user.display_name.split(" ")[0]}.`
              : "Welcome."}
          </h1>
          <p className="mt-2 text-body text-foreground-muted">
            {purchases.length === 0
              ? "Record your first purchase to start tracking your holdings."
              : `Tracking ${purchases.length} purchase${purchases.length !== 1 ? "s" : ""} in ${me?.user.preferred_currency ?? ""}.`}
          </p>
        </div>
        {me ? (
          <Button asChild variant="accent">
            <Link href="/purchases/new">
              <Plus />
              Add purchase
            </Link>
          </Button>
        ) : null}
      </div>

      {!me ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-h3 text-destructive">
              <CircleAlert className="h-5 w-5" />
              Couldn&apos;t reach the backend
            </CardTitle>
            <CardDescription className="text-foreground-muted">
              {syncError ?? "An unexpected error occurred."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-foreground-muted">
              If you&apos;re running locally, make sure FastAPI is up at{" "}
              <code className="font-mono text-foreground">localhost:8000</code>{" "}
              (<code className="font-mono text-foreground">uvicorn app.main:app --reload</code>).
            </p>
          </CardContent>
        </Card>
      ) : purchases.length === 0 ? (
        <EmptyState />
      ) : (
        <PurchaseList purchases={purchases} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-cornsilk-200 text-foreground-muted">
          <ReceiptText className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h2 className="text-h3 font-semibold text-foreground">No purchases yet</h2>
        <p className="max-w-md text-body-sm text-foreground-muted">
          A purchase captures a single dealer order. Add as many gold or silver
          line items as the receipt shows — they&apos;ll group together so you
          can track value, sales, and P/L per item.
        </p>
        <Button asChild variant="accent" className="mt-2">
          <Link href="/purchases/new">
            <Plus />
            Record first purchase
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function PurchaseList({ purchases }: { purchases: Purchase[] }) {
  return (
    <div className="space-y-4">
      {purchases.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
                  {new Date(p.purchase_date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="mt-1 text-h3 font-semibold text-foreground">
                  {p.dealer || "Unknown dealer"}
                </p>
                <p className="mt-1 text-caption text-foreground-muted">
                  {p.items.length} item{p.items.length !== 1 ? "s" : ""} ·{" "}
                  {p.payment_method === "card"
                    ? `Card (${p.card_premium_percentage ?? "?"}% premium)`
                    : "Cash"}
                </p>
              </div>
              <p className="font-display text-h2 font-medium tracking-tight num text-foreground sm:text-right">
                {formatCurrency(
                  Number(p.total_amount),
                  p.purchase_currency,
                )}
              </p>
            </div>

            <ul className="mt-4 space-y-2">
              {p.items.map((item) => (
                <HoldingRow
                  key={item.id}
                  item={item}
                  currency={p.purchase_currency}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HoldingRow({
  item,
  currency,
}: {
  item: Holding;
  currency: string;
}) {
  const metal = item.metal === "gold" ? "Gold" : "Silver";
  const purity = item.purity ? ` ${item.purity}` : "";
  const form = item.form ? ` ${item.form}` : "";
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-surface-muted/60 px-3 py-2">
      <div className="text-body-sm">
        <span className="font-medium text-foreground">
          {metal}
          {purity}
          {form}
        </span>
        <span className="ml-2 text-foreground-muted num">
          {formatWeight(Number(item.weight_grams), "g")}
          {item.quantity > 1 ? ` × ${item.quantity}` : ""}
          {item.brand ? ` · ${item.brand}` : ""}
        </span>
      </div>
      <div className="text-body-sm font-medium num text-foreground">
        {formatCurrency(Number(item.purchase_price), currency)}
      </div>
    </li>
  );
}
