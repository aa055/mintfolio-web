"use server";

import { redirect } from "next/navigation";

import { apiFetch, ApiError } from "@/lib/api-client";
import type { Purchase, PurchaseCreatePayload } from "@/lib/api-types";

export type CreatePurchaseResult =
  | { ok: true; purchase: Purchase }
  | { ok: false; error: string };

/**
 * Server action wrapped around the create-purchase API call. Returns a
 * structured result so the form can surface errors inline without a page
 * navigation. The caller (the client form) decides whether to redirect.
 */
export async function createPurchaseAction(
  portfolioId: string,
  payload: PurchaseCreatePayload,
): Promise<CreatePurchaseResult> {
  try {
    const purchase = await apiFetch<Purchase>(
      `/portfolios/${portfolioId}/purchases`,
      { method: "POST", body: payload },
    );
    return { ok: true, purchase };
  } catch (err) {
    if (err instanceof ApiError) {
      const detail =
        typeof err.detail === "string"
          ? err.detail
          : JSON.stringify(err.detail);
      return { ok: false, error: detail };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Useful as a Server Action passed to an HTML form's `action` — navigates
 * to the dashboard after a successful create. (Currently unused by the
 * main form which uses the structured action above; kept for future
 * progressive-enhancement use.)
 */
export async function createPurchaseAndRedirect(
  portfolioId: string,
  payload: PurchaseCreatePayload,
): Promise<void> {
  const result = await createPurchaseAction(portfolioId, payload);
  if (result.ok) {
    redirect("/dashboard");
  }
}
