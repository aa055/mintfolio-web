import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string, locale = "en-US") {
  const key = `${locale}:${currency}`;
  let fmt = CURRENCY_FORMATTERS.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
    CURRENCY_FORMATTERS.set(key, fmt);
  }
  return fmt;
}

export function formatCurrency(
  amount: number,
  currency = "AED",
  locale = "en-US",
) {
  return formatterFor(currency, locale).format(amount);
}

export function formatPercent(value: number, fractionDigits = 2) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(fractionDigits)}%`;
}

export function formatWeight(
  grams: number,
  unit: "g" | "oz" = "g",
  fractionDigits = 2,
) {
  const value = unit === "oz" ? grams / 31.1035 : grams;
  return `${value.toFixed(fractionDigits)} ${unit}`;
}
