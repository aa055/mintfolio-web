"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RECEIPT_MIME_TYPES, uploadReceipts, validateReceipts } from "@/lib/purchases/upload";

/** "Add receipts" button for an existing purchase: pick, upload, refresh. */
export function ReceiptUploader({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onPick(files: FileList | null) {
    if (!files || files.length === 0) return;
    const { accepted, rejections } = validateReceipts(Array.from(files));
    if (inputRef.current) inputRef.current.value = "";
    setError(rejections.length ? rejections.join(" · ") : null);
    if (accepted.length === 0) return;

    startTransition(async () => {
      const failed = await uploadReceipts(purchaseId, accepted, (i, n) =>
        setStatus(`Uploading ${i} of ${n}…`),
      );
      setStatus(null);
      if (failed.length) setError(failed.join(" · "));
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={RECEIPT_MIME_TYPES.join(",")}
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip />
          {pending ? (status ?? "Uploading…") : "Add receipts"}
        </Button>
        <span className="text-caption text-foreground-subtle">JPG, PNG or PDF · up to 5 MB each</span>
      </div>
      {error ? (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
