import { redirect } from "next/navigation";

import { apiFetch, ApiError } from "@/lib/api-client";
import type { MeResponse } from "@/lib/api-types";

import { NewPurchaseForm } from "./new-purchase-form";

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
  return <NewPurchaseForm portfolioId={me.portfolio.id} />;
}
