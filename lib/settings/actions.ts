"use server";

import { revalidatePath } from "next/cache";

import { apiErrorMessage, apiFetch } from "@/lib/api-client";
import type { ManualRatesPayload, User, UserSettingsPayload } from "@/lib/api-types";
import type { ActionResult } from "@/lib/purchases/file-actions";

export async function updateSettingsAction(
  payload: UserSettingsPayload,
): Promise<ActionResult<User>> {
  try {
    const data = await apiFetch<User>("/auth/me", { method: "PATCH", body: payload });
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err) };
  }
}

export async function setManualRatesAction(
  payload: ManualRatesPayload,
): Promise<ActionResult<User>> {
  try {
    const data = await apiFetch<User>("/prices/manual", { method: "PUT", body: payload });
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err) };
  }
}
