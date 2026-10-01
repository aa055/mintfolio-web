import { notFound } from "next/navigation";

import { PurchaseForm } from "@/components/purchases/purchase-form";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { Purchase } from "@/lib/api-types";

export default async function EditPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let purchase: Purchase;
  try {
    purchase = await apiFetch<Purchase>(`/purchases/${id}`, { method: "GET" });
  } catch (err) {
    // 404 also covers someone else's purchase; 422 is a malformed id.
    if (err instanceof ApiError && (err.status === 404 || err.status === 422)) {
      notFound();
    }
    throw err;
  }
  return <PurchaseForm portfolioId={purchase.portfolio_id} purchase={purchase} />;
}
