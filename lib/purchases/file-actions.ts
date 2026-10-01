"use server";

import { revalidatePath } from "next/cache";

import { apiErrorMessage, apiFetch } from "@/lib/api-client";
import type {
  RegisterFilePayload,
  SignUploadPayload,
  SignUploadResponse,
  UploadedFile,
} from "@/lib/api-types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const toError = apiErrorMessage;

/**
 * Asks the backend for a one-shot signed PUT URL that the browser will
 * upload the file bytes to directly. We never proxy bytes through FastAPI.
 */
export async function signUploadAction(
  purchaseId: string,
  payload: SignUploadPayload,
): Promise<ActionResult<SignUploadResponse>> {
  try {
    const data = await apiFetch<SignUploadResponse>(
      `/purchases/${purchaseId}/files/sign-upload`,
      { method: "POST", body: payload },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: toError(err) };
  }
}

/**
 * Records the uploaded file in the DB after the client confirmed the PUT
 * to Supabase Storage succeeded.
 */
export async function registerFileAction(
  purchaseId: string,
  payload: RegisterFilePayload,
): Promise<ActionResult<UploadedFile>> {
  try {
    const data = await apiFetch<UploadedFile>(
      `/purchases/${purchaseId}/files`,
      { method: "POST", body: payload },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: toError(err) };
  }
}

/**
 * Removes both the Storage object and the DB row. Refreshes the dashboard
 * so the receipt disappears immediately.
 */
export async function deleteFileAction(
  fileId: string,
): Promise<ActionResult<null>> {
  try {
    await apiFetch(`/files/${fileId}`, { method: "DELETE" });
    revalidatePath("/dashboard");
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: toError(err) };
  }
}
