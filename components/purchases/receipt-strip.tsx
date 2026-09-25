"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FileText, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteFileAction } from "@/lib/purchases/file-actions";
import type { UploadedFile } from "@/lib/api-types";

export function ReceiptStrip({ files }: { files: UploadedFile[] }) {
  if (files.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-3">
      {files.map((f) => (
        <ReceiptTile key={f.id} file={f} />
      ))}
    </ul>
  );
}

function ReceiptTile({ file }: { file: UploadedFile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isImage = file.mime_type.startsWith("image/");

  function onDelete() {
    if (!confirm(`Remove "${file.filename}"?`)) return;
    startTransition(async () => {
      await deleteFileAction(file.id);
      router.refresh();
    });
  }

  return (
    <li className="group relative h-24 w-24 overflow-hidden rounded-md border border-border bg-surface-muted">
      {isImage && file.download_url ? (
        <a
          href={file.download_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full w-full"
        >
          {/* unoptimized — signed URL is short-lived and Next can't re-fetch it later */}
          <Image
            src={file.download_url}
            alt={file.filename}
            width={96}
            height={96}
            unoptimized
            className="h-full w-full object-cover"
          />
        </a>
      ) : (
        <a
          href={file.download_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-foreground-muted hover:bg-surface"
        >
          <FileText className="h-6 w-6" strokeWidth={1.5} />
          <span className="line-clamp-2 px-1 text-center text-[10px] leading-tight">
            {file.filename}
          </span>
        </a>
      )}

      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label={`Delete ${file.filename}`}
        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive opacity-0 transition-opacity duration-fast group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

// Tiny named alias of Button to keep imports tidy if someone wants a sibling
// "add more receipts" CTA in the future.
export { Button as ReceiptButton };
