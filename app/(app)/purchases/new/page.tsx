import { redirect } from "next/navigation";

import { PurchaseForm } from "@/components/purchases/purchase-form";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { MeResponse } from "@/lib/api-types";

export default async function NewPurchasePage() {
  let me: MeResponse;
  try {
    me = await apiFetch<MeResponse>("/auth/me", { method: "GET" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      // Triggers /auth/sync on next load via the dashboard's self-heal path.
      redirect("/dashboard");
    }
    throw err;
  }
  return <PurchaseForm portfolioId={me.portfolio.id} />;
}
