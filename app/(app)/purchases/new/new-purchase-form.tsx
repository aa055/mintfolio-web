"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPurchaseAction } from "@/lib/purchases/actions";
import type { PurchaseCreatePayload } from "@/lib/api-types";

// ---------------------------------------------------------------
// Schema
// ---------------------------------------------------------------

const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "INR"] as const;
const METALS = ["gold", "silver"] as const;
const FORMS = ["coin", "bar", "bullion", "jewelry", "round", "other"] as const;
const UNITS = ["g", "kg", "oz"] as const;

const itemSchema = z
  .object({
    metal: z.enum(METALS),
    purity: z.string().max(20).optional().or(z.literal("")),
    form: z.enum(FORMS).optional().or(z.literal("")),
    weight_value: z.coerce.number().positive("Must be > 0"),
    weight_unit: z.enum(UNITS),
    quantity: z.coerce.number().int().min(1).default(1),
    brand: z.string().max(200).optional().or(z.literal("")),
    purchase_price: z.coerce.number().nonnegative("Must be ≥ 0"),
    spot_rate_at_purchase: z
      .string()
      .optional()
      .or(z.literal("")),
    premium_paid: z.string().optional().or(z.literal("")),
    storage_location: z.string().max(200).optional().or(z.literal("")),
    comments: z.string().max(2000).optional().or(z.literal("")),
  })
  .transform((item) => item);

const formSchema = z
  .object({
    purchase_date: z.string().min(1, "Required"),
    dealer: z.string().max(200).optional().or(z.literal("")),
    purchase_currency: z.enum(CURRENCIES),
    payment_method: z.enum(["cash", "card"]),
    card_premium_percentage: z.string().optional().or(z.literal("")),
    notes: z.string().max(2000).optional().or(z.literal("")),
    items: z.array(itemSchema).min(1, "Add at least one item"),
  })
  .refine(
    (data) =>
      data.payment_method !== "card" || data.card_premium_percentage !== "",
    {
      message: "Required when paying by card",
      path: ["card_premium_percentage"],
    },
  );

type FormValues = z.input<typeof formSchema>;

const DEFAULT_ITEM: FormValues["items"][number] = {
  metal: "gold",
  purity: "",
  form: "",
  weight_value: 0,
  weight_unit: "g",
  quantity: 1,
  brand: "",
  purchase_price: 0,
  spot_rate_at_purchase: "",
  premium_paid: "",
  storage_location: "",
  comments: "",
};

// ---------------------------------------------------------------
// Verification (form-level — see docs/schema-design.md §4)
// ---------------------------------------------------------------

const GRAMS_PER_UNIT = { g: 1, kg: 1000, oz: 31.1035 } as const;

function checkItemMath(
  item: FormValues["items"][number],
  paymentMethod: "cash" | "card",
  cardPremiumPct: string,
): string | null {
  const spot = parseFloat(String(item.spot_rate_at_purchase));
  const price = Number(item.purchase_price);
  if (!isFinite(spot) || spot <= 0 || !isFinite(price) || price <= 0) {
    return null;
  }
  const weight = Number(item.weight_value);
  const qty = Number(item.quantity) || 1;
  const premium = parseFloat(String(item.premium_paid)) || 0;
  if (!isFinite(weight) || weight <= 0) return null;

  const grams = weight * GRAMS_PER_UNIT[item.weight_unit];
  const expected = spot * grams * qty + premium;

  let tolerance = 0.05;
  if (paymentMethod === "card") {
    const pct = parseFloat(cardPremiumPct);
    if (isFinite(pct)) tolerance += pct / 100;
  }

  const diff = Math.abs(expected - price) / price;
  if (diff > tolerance) {
    return `Your numbers don’t quite add up. Expected ~${expected.toFixed(
      2,
    )} from (weight × spot × qty + premium), but purchase price is ${price.toFixed(
      2,
    )}.`;
  }
  return null;
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------

export function NewPurchaseForm({ portfolioId }: { portfolioId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchase_date: new Date().toISOString().slice(0, 10),
      dealer: "",
      purchase_currency: "AED",
      payment_method: "cash",
      card_premium_percentage: "",
      notes: "",
      items: [{ ...DEFAULT_ITEM }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedPayment = form.watch("payment_method");
  const watchedCardPct = form.watch("card_premium_percentage") ?? "";

  const total = watchedItems.reduce(
    (sum, item) => sum + (Number(item.purchase_price) || 0),
    0,
  );

  function onSubmit(values: FormValues) {
    setSubmitError(null);
    const payload: PurchaseCreatePayload = {
      purchase_date: values.purchase_date,
      dealer: values.dealer || null,
      purchase_currency: values.purchase_currency,
      payment_method: values.payment_method,
      card_premium_percentage:
        values.payment_method === "card"
          ? String(values.card_premium_percentage)
          : null,
      notes: values.notes || null,
      items: values.items.map((item) => ({
        metal: item.metal,
        purity: item.purity || null,
        form: item.form ? (item.form as PurchaseCreatePayload["items"][number]["form"]) : null,
        weight_value: String(item.weight_value),
        weight_unit: item.weight_unit,
        quantity: Number(item.quantity) || 1,
        brand: item.brand || null,
        purchase_price: String(item.purchase_price),
        spot_rate_at_purchase: item.spot_rate_at_purchase
          ? String(item.spot_rate_at_purchase)
          : null,
        premium_paid: item.premium_paid ? String(item.premium_paid) : null,
        storage_location: item.storage_location || null,
        comments: item.comments || null,
      })),
    };

    startTransition(async () => {
      const result = await createPurchaseAction(portfolioId, payload);
      if (result.ok) {
        router.push("/dashboard");
      } else {
        setSubmitError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mx-auto max-w-3xl space-y-8"
      noValidate
    >
      <header className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href="/dashboard">
              <ArrowLeft />
              Back
            </Link>
          </Button>
          <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
            New purchase
          </p>
          <h1 className="mt-1 font-display text-display-md font-medium tracking-tight">
            Record an order
          </h1>
          <p className="mt-2 text-body text-foreground-muted">
            Capture the dealer details once — add as many line items as the
            receipt shows.
          </p>
        </div>
      </header>

      {/* ---------- Order details ---------- */}
      <Card>
        <CardContent className="space-y-6 p-6">
          <h2 className="text-h3 font-semibold text-foreground">Order details</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Purchase date" error={form.formState.errors.purchase_date?.message}>
              <Input type="date" {...form.register("purchase_date")} />
            </Field>

            <Field label="Dealer">
              <Input
                placeholder="Emirates Gold, BullionByPost, ..."
                {...form.register("dealer")}
              />
            </Field>

            <Field label="Currency">
              <Controller
                control={form.control}
                name="purchase_currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Payment method">
              <Controller
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {watchedPayment === "card" ? (
              <Field
                label="Card premium %"
                error={form.formState.errors.card_premium_percentage?.message}
                hint="Most dealers charge ~2.5% for card payments."
              >
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="2.5"
                  {...form.register("card_premium_percentage")}
                />
              </Field>
            ) : null}
          </div>

          <Field label="Notes">
            <Textarea
              rows={2}
              placeholder="Anything notable about this order..."
              {...form.register("notes")}
            />
          </Field>
        </CardContent>
      </Card>

      {/* ---------- Items ---------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-foreground">Items</h2>
          <p className="text-caption text-foreground-muted num">
            {fields.length} item{fields.length !== 1 ? "s" : ""} ·{" "}
            <span className="font-medium text-foreground">
              {form.watch("purchase_currency")} {total.toFixed(2)}
            </span>{" "}
            total
          </p>
        </div>

        {fields.map((field, index) => {
          const itemErrors = form.formState.errors.items?.[index];
          const mathWarning = checkItemMath(
            watchedItems[index],
            watchedPayment,
            watchedCardPct,
          );

          return (
            <Card key={field.id}>
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
                    Item {index + 1}
                  </p>
                  {fields.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 />
                      Remove
                    </Button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Metal">
                    <Controller
                      control={form.control}
                      name={`items.${index}.metal`}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field label="Form">
                    <Controller
                      control={form.control}
                      name={`items.${index}.form`}
                      render={({ field: f }) => (
                        <Select
                          value={f.value || ""}
                          onValueChange={(v) => f.onChange(v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="(optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {FORMS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field label="Purity" hint="e.g. 24K, 22K, 999, 925">
                    <Input {...form.register(`items.${index}.purity`)} />
                  </Field>

                  <Field label="Quantity">
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      {...form.register(`items.${index}.quantity`)}
                    />
                  </Field>

                  <div className="grid grid-cols-[1fr_5rem] gap-2 sm:col-span-2">
                    <Field
                      label="Weight"
                      error={itemErrors?.weight_value?.message}
                    >
                      <Input
                        type="number"
                        step="0.0001"
                        inputMode="decimal"
                        {...form.register(`items.${index}.weight_value`)}
                      />
                    </Field>
                    <Field label="Unit">
                      <Controller
                        control={form.control}
                        name={`items.${index}.weight_unit`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="oz">oz</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </Field>
                  </div>

                  <Field label="Brand">
                    <Input
                      placeholder="PAMP Suisse, Emirates Gold, ..."
                      {...form.register(`items.${index}.brand`)}
                    />
                  </Field>

                  <Field label="Storage location">
                    <Input
                      placeholder="Home safe, bank vault, ..."
                      {...form.register(`items.${index}.storage_location`)}
                    />
                  </Field>

                  <Field
                    label="Purchase price (this item)"
                    error={itemErrors?.purchase_price?.message}
                  >
                    <Input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      {...form.register(`items.${index}.purchase_price`)}
                    />
                  </Field>

                  <Field label="Spot rate / gram" hint="Optional — for math check">
                    <Input
                      type="number"
                      step="0.0001"
                      inputMode="decimal"
                      {...form.register(`items.${index}.spot_rate_at_purchase`)}
                    />
                  </Field>

                  <Field label="Premium paid" hint="Optional">
                    <Input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      {...form.register(`items.${index}.premium_paid`)}
                    />
                  </Field>
                </div>

                <Field label="Item notes">
                  <Textarea
                    rows={2}
                    {...form.register(`items.${index}.comments`)}
                  />
                </Field>

                {mathWarning ? (
                  <div className="flex items-start gap-2 rounded-md border border-caramel-300 bg-caramel-50 px-3 py-2 text-body-sm text-caramel-900">
                    <CircleAlert className="h-4 w-4 shrink-0 translate-y-[2px] text-caramel-700" />
                    <p>{mathWarning}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={() => append({ ...DEFAULT_ITEM })}
        >
          <Plus />
          Add another item
        </Button>
      </section>

      {/* ---------- Submit ---------- */}
      {submitError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-body-sm text-destructive"
        >
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href="/dashboard">Cancel</Link>
        </Button>
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Saving…" : "Save purchase"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------
// Tiny field wrapper — label + control + optional hint/error
// ---------------------------------------------------------------

function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-caption text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-caption text-foreground-subtle">{hint}</p>
      ) : null}
    </div>
  );
}
