"use server";

import { revalidatePath } from "next/cache";

import { apiErrorMessage, apiFetch } from "@/lib/api-client";
import type { User } from "@/lib/api-types";
import type { ActionResult } from "@/lib/purchases/file-actions";

export type AvatarMime = "image/jpeg" | "image/png" | "image/webp";

/** Signed URL the browser PUTs the photo bytes to (straight to Storage). */
export async function signAvatarUploadAction(
  mimeType: AvatarMime,
  sizeBytes: number,
): Promise<ActionResult<{ upload_url: string; storage_path: string }>> {
  try {
    const data = await apiFetch<{ upload_url: string; storage_path: string }>(
      "/auth/me/avatar/sign-upload",
      { method: "POST", body: { mime_type: mimeType, size_bytes: sizeBytes } },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err) };
  }
}

/** Make an uploaded photo the profile picture (the old one is deleted). */
export async function setAvatarAction(storagePath: string): Promise<ActionResult<User>> {
  try {
    const data = await apiFetch<User>("/auth/me/avatar", {
      method: "PUT",
      body: { storage_path: storagePath },
    });
    revalidatePath("/", "layout"); // the top-bar avatar too
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err) };
  }
}

export async function removeAvatarAction(): Promise<ActionResult<User>> {
  try {
    const data = await apiFetch<User>("/auth/me/avatar", { method: "DELETE" });
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err) };
  }
}

export async function updateNameAction(name: string): Promise<ActionResult<User>> {
  try {
    const data = await apiFetch<User>("/auth/me", {
      method: "PATCH",
      body: { display_name: name.trim() || null },
    });
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err) };
  }
}
