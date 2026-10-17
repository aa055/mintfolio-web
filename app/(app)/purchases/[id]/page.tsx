import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { DeletePurchaseButton } from "@/components/purchases/holding-actions";
import { PurchaseItems, type ItemRow } from "@/components/purchases/purchase-items";
import { ReceiptStrip } from "@/components/purchases/receipt-strip";
import { ReceiptUploader } from "@/components/purchases/receipt-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError, apiFetch } from "@/lib/api-client";
import { getMe } from "@/lib/me";
import type { PortfolioSummary, Purchase } from "@/lib/api-types";
import { cn, formatCurrency, formatSignedCurrency, plTone } from "@/lib/utils";

/** "10 Mar 2026" — date-only ISO strings are UTC midnight, so format in UTC. */
function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let purchase: Purchase;
  try {
    purchase = await apiFetch<Purchase>(`/purchases/${id}`, { method: "GET" });
  } catch (err) {
    // 404 also covers someone else's purchase; 422 is a malformed id.
    if (err instanceof ApiError && (err.status === 404 || err.status === 422)) notFound();
    throw err;
  }

  // Current values come from the portfolio summary; the page still works without them.
  const [summary, me] = await Promise.all([
    apiFetch<PortfolioSummary>(`/portfolios/${purchase.portfolio_id}/summary`, {
      method: "GET",
    }).catch(() => null),
    getMe().catch(() => null),
  ]);
  const values = new Map(summary?.holdings.map((h) => [h.id, h]));

  const cur = purchase.purchase_currency;
  const rows: ItemRow[] = purchase.items.map((item) => ({
    item,
    value: values.get(item.id),
    saleDateLabel: item.sale ? formatDay(item.sale.sale_date) : null,
  }));
  const valueNow = rows.reduce((sum, r) => sum + Number(r.value?.current_value ?? 0), 0);
  const activeCost = rows
    .filter((r) => r.value?.current_value != null)
    .reduce((sum, r) => sum + Number(r.item.purchase_price), 0);
  const realized = rows.reduce((sum, r) => sum + Number(r.value?.realized_pl ?? 0), 0);
  const unrealized = valueNow - activeCost;
  const hasValues = rows.some((r) => r.value?.current_value != null);

  const payment =
    purchase.payment_method === "card"
      ? `Card · ${purchase.card_premium_percentage ?? "?"}% premium`
      : "Cash";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/transactions">
          <ArrowLeft />
          Transactions
        </Link>
      </Button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
            Purchase · {formatDay(purchase.purchase_date)}
          </p>
          <h1 className="mt-2 font-display text-display-md font-medium tracking-tight text-foreground">
            {purchase.dealer || "Unknown dealer"}
          </h1>
          <p className="mt-2 text-body-sm text-foreground-muted">
            {payment} · {purchase.items.length} item{purchase.items.length !== 1 ? "s" : ""} ·{" "}
            {purchase.files.length} receipt{purchase.files.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <p className="font-display text-h1 font-medium tracking-tight text-foreground">
            {formatCurrency(Number(purchase.total_amount), cur)}
          </p>
          <div className="-ml-3 flex gap-1 sm:-mr-3 sm:ml-0">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/purchases/${purchase.id}/edit`}>
                <Pencil />
                Edit
              </Link>
            </Button>
            <DeletePurchaseButton
              purchaseId={purchase.id}
              label={`this ${purchase.dealer || "purchase"} from ${formatDay(purchase.purchase_date)}`}
              redirectTo="/transactions"
            />
          </div>
        </div>
      </header>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pb-2 pt-5 sm:px-6">
            <h2 className="text-h3 font-semibold text-foreground">Items</h2>
            {hasValues ? (
              <p className="text-caption text-foreground-muted num">
                Value now {formatCurrency(valueNow, cur)} at spot ·{" "}
                <span className={plTone(unrealized)}>{formatSignedCurrency(unrealized, cur)}</span>
                {realized !== 0 ? (
                  <>
                    {" "}
                    · realized{" "}
                    <span className={plTone(realized)}>{formatSignedCurrency(realized, cur)}</span>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
          <PurchaseItems
            rows={rows}
            currency={cur}
            purchaseDate={purchase.purchase_date}
            purchaseDateLabel={formatDay(purchase.purchase_date)}
            weightUnit={me?.user.weight_unit ?? "g"}
          />
        </CardContent>
      </Card>

      <div className={cn("grid gap-6", purchase.notes && "lg:grid-cols-3")}>
        <Card className={cn(purchase.notes && "lg:col-span-2")}>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-h3 font-semibold text-foreground">Receipts</h2>
            {purchase.files.length > 0 ? (
              <ReceiptStrip files={purchase.files} />
            ) : (
              <p className="text-body-sm text-foreground-muted">No receipts attached yet.</p>
            )}
            <ReceiptUploader purchaseId={purchase.id} />
          </CardContent>
        </Card>
        {purchase.notes ? (
          <Card>
            <CardContent className="space-y-2 p-6">
              <h2 className="text-h3 font-semibold text-foreground">Notes</h2>
              <p className="whitespace-pre-line text-body-sm text-foreground-muted">
                {purchase.notes}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
