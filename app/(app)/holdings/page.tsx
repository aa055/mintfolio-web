import { redirect } from "next/navigation";

import { HoldingsTable, type HoldingRow } from "@/components/holdings/holdings-table";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { MeResponse, PortfolioSummary, PurchaseListResponse } from "@/lib/api-types";

function formatDate(iso: string) {
  // Date-only strings parse as UTC midnight — format in UTC so the day never shifts.
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function HoldingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let me: MeResponse;
  try {
    me = await apiFetch<MeResponse>("/auth/me", { method: "GET" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      // Not synced yet — the dashboard's self-heal path creates the rows.
      redirect("/dashboard");
    }
    throw err;
  }

  const portfolioId = me.portfolio.id;
  const [list, summary] = await Promise.all([
    apiFetch<PurchaseListResponse>(`/portfolios/${portfolioId}/purchases`, { method: "GET" }),
    // Values are optional — without them the table still lists every item.
    apiFetch<PortfolioSummary>(`/portfolios/${portfolioId}/summary`, { method: "GET" }).catch(
      () => null,
    ),
  ]);

  const values = new Map(summary?.holdings.map((h) => [h.id, h]));
  const rows: HoldingRow[] = list.purchases.flatMap((p) =>
    p.items.map((h) => {
      const v = values.get(h.id);
      return {
        id: h.id,
        purchaseId: p.id,
        metal: h.metal,
        purity: h.purity,
        form: h.form,
        brand: h.brand,
        storageLocation: h.storage_location,
        dealer: p.dealer,
        purchaseDate: p.purchase_date,
        purchaseDateLabel: formatDate(p.purchase_date),
        saleDateLabel: h.sale ? formatDate(h.sale.sale_date) : null,
        currency: p.purchase_currency,
        quantity: h.quantity,
        grams: Number(h.weight_grams) * h.quantity,
        cost: Number(h.purchase_price),
        value: v?.current_value != null ? Number(v.current_value) : null,
        pl:
          v?.unrealized_pl != null
            ? Number(v.unrealized_pl)
            : v?.realized_pl != null
              ? Number(v.realized_pl)
              : null,
        status: h.status,
        sale: h.sale,
      };
    }),
  );

  const params = await searchParams;
  const initial = Object.fromEntries(
    Object.entries(params).filter((e): e is [string, string] => typeof e[1] === "string"),
  );

  return (
    <HoldingsTable rows={rows} currency={me.user.preferred_currency} initialParams={initial} />
  );
}
