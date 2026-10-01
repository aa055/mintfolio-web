"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Tag, Trash2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deletePurchaseAction } from "@/lib/purchases/actions";
import { sellHoldingAction, undoSaleAction } from "@/lib/sales/actions";
import { todayIsoDate } from "@/lib/utils";

/** Opens a dialog to record the sale of one whole holding. */
export function SellButton({
  holdingId,
  label,
  currency,
  purchaseDate,
}: {
  holdingId: string;
  label: string;
  currency: string;
  purchaseDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    setError(null);
    startTransition(async () => {
      const result = await sellHoldingAction(holdingId, {
        sale_price: text("sale_price"),
        sale_currency: currency,
        sale_date: text("sale_date"),
        fees: text("fees") || "0",
        sold_to: text("sold_to") || null,
        spot_rate_at_sale: text("spot_rate_at_sale") || null,
        comments: text("comments") || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2">
          <Tag />
          Sell
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Record sale</DialogTitle>
        <DialogDescription>
          {label} — the whole item is marked sold. Partial sales aren&apos;t supported yet.
        </DialogDescription>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={`Sale price (${currency})`} htmlFor="sale_price">
              <Input
                id="sale_price"
                name="sale_price"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                required
                autoFocus
              />
            </FormField>
            <FormField label="Sale date" htmlFor="sale_date">
              <Input
                id="sale_date"
                name="sale_date"
                type="date"
                required
                defaultValue={todayIsoDate()}
                min={purchaseDate}
                max={todayIsoDate()}
              />
            </FormField>
            <FormField label={`Fees (${currency})`} htmlFor="fees" hint="Deducted from realized P/L">
              <Input id="fees" name="fees" type="number" step="0.01" min="0" inputMode="decimal" />
            </FormField>
            <FormField label="Sold to" htmlFor="sold_to">
              <Input id="sold_to" name="sold_to" placeholder="Dealer, buyer, ..." />
            </FormField>
            <FormField label="Spot rate / gram" htmlFor="spot_rate_at_sale" hint="Optional">
              <Input
                id="spot_rate_at_sale"
                name="spot_rate_at_sale"
                type="number"
                step="0.0001"
                min="0"
                inputMode="decimal"
              />
            </FormField>
          </div>
          <FormField label="Notes" htmlFor="comments">
            <Textarea id="comments" name="comments" rows={2} />
          </FormField>

          {error ? (
            <p role="alert" className="text-body-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={pending}>
              {pending ? "Saving…" : "Record sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UndoSaleButton({ holdingId }: { holdingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Undo this sale? The item goes back to active and the sale record is deleted.")) {
      return;
    }
    startTransition(async () => {
      const result = await undoSaleAction(holdingId);
      if (!result.ok) alert(result.error);
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onClick} disabled={pending}>
      <Undo2 />
      Undo sale
    </Button>
  );
}

export function DeletePurchaseButton({ purchaseId, label }: { purchaseId: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`Delete ${label}? Its items, sales and receipts are removed permanently.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deletePurchaseAction(purchaseId);
      if (!result.ok) alert(result.error);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={pending}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 />
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}

function FormField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-caption text-foreground-subtle">{hint}</p> : null}
    </div>
  );
}
