"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiErrorMessage, apiFetch } from "@/lib/api-client";
import type {
  Purchase,
  PurchaseCreatePayload,
  PurchaseUpdatePayload,
} from "@/lib/api-types";
import type { ActionResult } from "@/lib/purchases/file-actions";

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
    return { ok: false, error: apiErrorMessage(err) };
  }
}

/** Replace a purchase's details and items (ids = keep/update, no id = add). */
export async function updatePurchaseAction(
  purchaseId: string,
  payload: PurchaseUpdatePayload,
): Promise<CreatePurchaseResult> {
  try {
    const purchase = await apiFetch<Purchase>(`/purchases/${purchaseId}`, {
      method: "PUT",
      body: payload,
    });
    revalidatePath("/dashboard");
    return { ok: true, purchase };
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err) };
  }
}

/** Delete a purchase with its items, sales and receipts. */
export async function deletePurchaseAction(
  purchaseId: string,
): Promise<ActionResult<null>> {
  try {
    await apiFetch(`/purchases/${purchaseId}`, { method: "DELETE" });
    revalidatePath("/dashboard");
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err) };
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
