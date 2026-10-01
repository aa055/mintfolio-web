"use server";

import { revalidatePath } from "next/cache";

import { apiErrorMessage, apiFetch } from "@/lib/api-client";
import type { Holding, SaleCreatePayload } from "@/lib/api-types";
import type { ActionResult } from "@/lib/purchases/file-actions";

/** Record the sale of a whole holding. */
export async function sellHoldingAction(
  holdingId: string,
  payload: SaleCreatePayload,
): Promise<ActionResult<Holding>> {
  try {
    const data = await apiFetch<Holding>(`/holdings/${holdingId}/sale`, {
      method: "POST",
      body: payload,
    });
    revalidatePath("/dashboard");
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err) };
  }
}

/** Delete the sale record and return the holding to active. */
export async function undoSaleAction(holdingId: string): Promise<ActionResult<null>> {
  try {
    await apiFetch(`/holdings/${holdingId}/sale`, { method: "DELETE" });
    revalidatePath("/dashboard");
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err) };
  }
}
