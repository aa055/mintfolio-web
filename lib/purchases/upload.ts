import type { FileMimeType } from "@/lib/api-types";
import { registerFileAction, signUploadAction } from "@/lib/purchases/file-actions";

/** Mirrors the API and the storage bucket's limits. */
export const RECEIPT_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/** Split picked files into acceptable receipts and human-readable rejections. */
export function validateReceipts(files: Iterable<File>): { accepted: File[]; rejections: string[] } {
  const accepted: File[] = [];
  const rejections: string[] = [];
  for (const f of files) {
    if (!(RECEIPT_MIME_TYPES as readonly string[]).includes(f.type)) {
      rejections.push(`${f.name}: type ${f.type || "?"} not allowed`);
    } else if (f.size > MAX_RECEIPT_BYTES) {
      rejections.push(`${f.name}: ${(f.size / 1024 / 1024).toFixed(1)} MB > 5 MB limit`);
    } else {
      accepted.push(f);
    }
  }
  return { accepted, rejections };
}

/**
 * Upload receipts straight from the browser to Storage: ask the API for a
 * signed URL, PUT the bytes, then register the file. Files go one at a time
 * so progress is meaningful. Returns a message per failed file.
 */
export async function uploadReceipts(
  purchaseId: string,
  files: File[],
  onProgress?: (current: number, total: number) => void,
): Promise<string[]> {
  const failed: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length);
    try {
      const sig = await signUploadAction(purchaseId, {
        filename: file.name,
        mime_type: file.type as FileMimeType,
        size_bytes: file.size,
      });
      if (!sig.ok) throw new Error(sig.error);

      const put = await fetch(sig.data.upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        throw new Error(`Storage PUT ${put.status}: ${(await put.text()).slice(0, 120)}`);
      }

      const reg = await registerFileAction(purchaseId, {
        storage_path: sig.data.storage_path,
        filename: file.name,
        mime_type: file.type as FileMimeType,
        size_bytes: file.size,
      });
      if (!reg.ok) throw new Error(reg.error);
    } catch (err) {
      failed.push(`${file.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return failed;
}
