import { PremiumNote, premiumFrom } from "@/components/holdings/premium-note";
import { SellButton, UndoSaleButton } from "@/components/purchases/holding-actions";
import type { Holding, HoldingValue } from "@/lib/api-types";
import {
  cn,
  formatCurrency,
  formatSignedCurrency,
  formatWeight,
  plTone,
  type DisplayWeightUnit,
} from "@/lib/utils";

export interface ItemRow {
  item: Holding;
  value?: HoldingValue;
  saleDateLabel: string | null;
}

export function itemLabel(h: Pick<Holding, "metal" | "purity" | "form">) {
  return [h.metal === "gold" ? "Gold" : "Silver", h.purity, h.form].filter(Boolean).join(" ");
}

/**
 * The line items of one purchase with their value now (at spot) and P/L,
 * plus Sell / Undo sale. A table from 640px, cards below.
 */
export function PurchaseItems({
  rows,
  currency,
  purchaseDate,
  purchaseDateLabel,
  weightUnit,
}: {
  rows: ItemRow[];
  currency: string;
  purchaseDate: string;
  purchaseDateLabel: string;
  weightUnit: DisplayWeightUnit;
}) {
  return (
    <>
      <div className="relative hidden overflow-x-auto sm:block">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-border text-left text-caption text-foreground-subtle">
              <th className="min-w-[12rem] px-6 py-3 font-medium">Item</th>
              <th className="px-3 py-3 text-right font-medium">Weight</th>
              <th className="px-3 py-3 text-right font-medium">Cost</th>
              <th className="px-3 py-3 text-right font-medium">Value now</th>
              <th className="px-3 py-3 text-right font-medium">P/L</th>
              <th className="px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.item.id} className="border-b border-border align-top last:border-b-0">
                <td className="px-6 py-3">
                  <ItemDescription row={r} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right num text-foreground-muted">
                  <Weight item={r.item} unit={weightUnit} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right num text-foreground">
                  {formatCurrency(Number(r.item.purchase_price), currency)}
                  <PremiumNote
                    premium={premiumFrom(r.value)}
                    currency={currency}
                    purchaseDateLabel={purchaseDateLabel}
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right num text-foreground">
                  {r.value?.current_value != null
                    ? formatCurrency(Number(r.value.current_value), currency)
                    : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right num">
                  <ProfitLoss row={r} currency={currency} />
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-right">
                  <ItemAction row={r} currency={currency} purchaseDate={purchaseDate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border sm:hidden">
        {rows.map((r) => (
          <li key={r.item.id} className="space-y-2 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <ItemDescription row={r} />
                <p className="text-caption text-foreground-muted num">
                  <Weight item={r.item} unit={weightUnit} inline />
                </p>
              </div>
              <div className="shrink-0 text-right text-body-sm num">
                <p className="text-foreground">
                  {formatCurrency(Number(r.item.purchase_price), currency)}
                  <PremiumNote
                    premium={premiumFrom(r.value)}
                    currency={currency}
                    purchaseDateLabel={purchaseDateLabel}
                  />
                </p>
                {r.value?.current_value != null ? (
                  <p className="text-caption text-foreground-muted">
                    now {formatCurrency(Number(r.value.current_value), currency)}
                  </p>
                ) : null}
                <p className="text-caption">
                  <ProfitLoss row={r} currency={currency} />
                </p>
              </div>
            </div>
            <div className="-ml-2">
              <ItemAction row={r} currency={currency} purchaseDate={purchaseDate} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ItemDescription({ row }: { row: ItemRow }) {
  const { item } = row;
  const details = [item.brand, item.storage_location].filter(Boolean).join(" · ");
  return (
    <div className="space-y-0.5">
      <p className="font-medium text-foreground">
        {itemLabel(item)}
        {item.status === "sold" ? (
          <span className="ml-2 rounded-sm bg-surface-muted px-1.5 py-0.5 text-caption font-normal text-foreground-muted">
            Sold
          </span>
        ) : null}
      </p>
      {details ? <p className="text-caption text-foreground-muted">{details}</p> : null}
      {item.comments ? <p className="text-caption text-foreground-subtle">{item.comments}</p> : null}
      {item.sale ? (
        <p className="text-caption text-foreground-muted num">
          Sold {row.saleDateLabel} for{" "}
          {formatCurrency(Number(item.sale.sale_price), item.sale.sale_currency)}
          {Number(item.sale.fees) > 0
            ? ` · fees ${formatCurrency(Number(item.sale.fees), item.sale.sale_currency)}`
            : ""}
          {item.sale.sold_to ? ` · ${item.sale.sold_to}` : ""}
        </p>
      ) : null}
    </div>
  );
}

function Weight({
  item,
  unit,
  inline = false,
}: {
  item: Holding;
  unit: DisplayWeightUnit;
  inline?: boolean;
}) {
  const total = Number(item.weight_grams) * item.quantity;
  return (
    <>
      {formatWeight(total, unit)}
      {item.quantity > 1 ? (
        <span className={cn("text-caption text-foreground-subtle", !inline && "block")}>
          {inline ? " · " : ""}
          {item.quantity} × {formatWeight(Number(item.weight_grams), unit)}
        </span>
      ) : null}
    </>
  );
}

function ProfitLoss({ row, currency }: { row: ItemRow; currency: string }) {
  const pl = row.value?.unrealized_pl ?? row.value?.realized_pl ?? null;
  if (pl === null) return <span className="text-foreground-subtle">—</span>;
  return (
    <span className={plTone(Number(pl))}>
      {formatSignedCurrency(Number(pl), currency)}
      {row.item.status === "sold" ? (
        <span className="block text-caption text-foreground-subtle">realized</span>
      ) : null}
    </span>
  );
}

function ItemAction({
  row,
  currency,
  purchaseDate,
}: {
  row: ItemRow;
  currency: string;
  purchaseDate: string;
}) {
  return row.item.sale ? (
    <UndoSaleButton holdingId={row.item.id} />
  ) : (
    <SellButton
      holdingId={row.item.id}
      label={itemLabel(row.item)}
      currency={currency}
      purchaseDate={purchaseDate}
    />
  );
}
