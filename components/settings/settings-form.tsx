"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LivePrice, User } from "@/lib/api-types";
import { setManualRatesAction, updateSettingsAction } from "@/lib/settings/actions";
import { cn, formatCurrency } from "@/lib/utils";

const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "INR"] as const;
const PURE_PURITY = { gold: "24K", silver: "999" } as const;

type Status = { kind: "saved" } | { kind: "error"; message: string } | null;

export function SettingsForm({
  user,
  livePrices,
  timezones,
}: {
  user: User;
  livePrices: LivePrice[];
  timezones: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
          Settings
        </p>
        <h1 className="mt-1 font-display text-display-md font-medium tracking-tight">
          Your preferences
        </h1>
      </header>
      <PreferencesCard user={user} timezones={timezones} />
      <ManualRatesCard user={user} livePrices={livePrices} />
    </div>
  );
}

function PreferencesCard({ user, timezones }: { user: User; timezones: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(null);
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [currency, setCurrency] = useState(user.preferred_currency);
  const [timezone, setTimezone] = useState(user.timezone);
  const [mode, setMode] = useState(user.default_pricing_mode);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    startTransition(async () => {
      const result = await updateSettingsAction({
        display_name: displayName.trim() || null,
        preferred_currency: currency,
        timezone: timezone.trim(),
        default_pricing_mode: mode,
      });
      setStatus(result.ok ? { kind: "saved" } : { kind: "error", message: result.error });
      if (result.ok) router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <h2 className="text-h3 font-semibold text-foreground">Preferences</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Display name" htmlFor="display_name">
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={200}
              />
            </Field>
            <Field
              label="Currency"
              hint="Dashboard totals use this. Purchases in other currencies are listed but not totalled."
            >
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger aria-label="Currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Timezone" htmlFor="timezone">
              <Input
                id="timezone"
                list="timezones"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
              />
              <datalist id="timezones">
                {timezones.map((tz) => (
                  <option key={tz} value={tz} />
                ))}
              </datalist>
            </Field>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-body-sm font-medium text-foreground">Pricing</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ModeOption
                checked={mode === "live"}
                onSelect={() => setMode("live")}
                title="Live"
                description="Daily market rates from GoldAPI."
              />
              <ModeOption
                checked={mode === "manual"}
                onSelect={() => setMode("manual")}
                title="Manual"
                description="Your own rates, set below."
              />
            </div>
          </fieldset>

          <FormFooter pending={pending} status={status} label="Save preferences" />
        </form>
      </CardContent>
    </Card>
  );
}

function ManualRatesCard({ user, livePrices }: { user: User; livePrices: LivePrice[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(null);
  const [currency, setCurrency] = useState(user.manual_rates_currency ?? user.preferred_currency);
  const [gold, setGold] = useState(user.manual_gold_rate_per_gram ?? "");
  const [silver, setSilver] = useState(user.manual_silver_rate_per_gram ?? "");

  const live = (metal: "gold" | "silver") =>
    livePrices.find(
      (p) => p.metal === metal && p.purity === PURE_PURITY[metal] && p.currency === currency,
    );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    startTransition(async () => {
      const result = await setManualRatesAction({
        currency,
        gold_rate_per_gram: String(gold).trim() || null,
        silver_rate_per_gram: String(silver).trim() || null,
      });
      setStatus(result.ok ? { kind: "saved" } : { kind: "error", message: result.error });
      if (result.ok) router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <h2 className="text-h3 font-semibold text-foreground">Manual rates</h2>
            <p className="mt-1 text-body-sm text-foreground-muted">
              Per gram of <strong className="font-medium">pure</strong> metal (24K gold, .999
              silver). Lower purities are scaled from these. Used when pricing is set to Manual.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Currency">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger aria-label="Manual rates currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {(["gold", "silver"] as const).map((metal) => {
              const ref = live(metal);
              return (
                <Field
                  key={metal}
                  label={metal === "gold" ? "Gold / gram" : "Silver / gram"}
                  htmlFor={`rate_${metal}`}
                  hint={
                    ref
                      ? `Live: ${formatCurrency(Number(ref.rate_per_gram), currency)}`
                      : undefined
                  }
                >
                  <Input
                    id={`rate_${metal}`}
                    type="number"
                    step="0.0001"
                    min="0"
                    inputMode="decimal"
                    value={metal === "gold" ? gold : silver}
                    onChange={(e) =>
                      metal === "gold" ? setGold(e.target.value) : setSilver(e.target.value)
                    }
                  />
                </Field>
              );
            })}
          </div>

          <FormFooter pending={pending} status={status} label="Save rates" />
        </form>
      </CardContent>
    </Card>
  );
}

function ModeOption({
  checked,
  onSelect,
  title,
  description,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition-colors",
        checked ? "border-primary bg-olive-50" : "border-border hover:bg-surface-muted",
      )}
    >
      <input
        type="radio"
        name="pricing_mode"
        checked={checked}
        onChange={onSelect}
        className="mt-1 accent-[rgb(var(--primary))]"
      />
      <span>
        <span className="block text-body-sm font-medium text-foreground">{title}</span>
        <span className="block text-caption text-foreground-muted">{description}</span>
      </span>
    </label>
  );
}

function FormFooter({
  pending,
  status,
  label,
}: {
  pending: boolean;
  status: Status;
  label: string;
}) {
  return (
    <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
      {status?.kind === "saved" ? (
        <p className="flex items-center gap-1.5 text-caption text-success sm:mr-auto" role="status">
          <Check className="h-4 w-4" />
          Saved
        </p>
      ) : status?.kind === "error" ? (
        <p className="text-body-sm text-destructive sm:mr-auto" role="alert">
          {status.message}
        </p>
      ) : null}
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? "Saving…" : label}
      </Button>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
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
