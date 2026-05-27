import Link from "next/link";
import { ArrowRight, Coins, LineChart, ReceiptText, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";

const FEATURES = [
  {
    icon: Coins,
    title: "Every bar, coin, and gram",
    body: "Track gold and silver purchases with purity, weight, dealer, premium, and receipt — all in one place.",
  },
  {
    icon: LineChart,
    title: "Always-on valuation",
    body: "Daily spot prices cached for you, or enter your own dealer rate. Profit and loss compute automatically.",
  },
  {
    icon: ReceiptText,
    title: "Receipts that don't get lost",
    body: "Snap a photo or upload a PDF. Receipts live next to the holding, not in a WhatsApp thread.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Your portfolio belongs to you. No marketing fluff, no shared dealer feeds — just your data.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* ============ Header ============ */}
      <header className="border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Coins className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="font-display text-h3 font-medium tracking-tight">
              Mintfolio
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-body-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#preview"
              className="text-body-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              Preview
            </Link>
            <Link
              href="/login"
              className="text-body-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          </nav>
          <Button asChild variant="accent" size="md" className="hidden md:inline-flex">
            <Link href="/signup">
              Start tracking
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      {/* ============ Hero ============ */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-micro font-semibold uppercase tracking-wider text-foreground-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            A modern OS for precious metals
          </span>
          <h1 className="mt-6 font-display text-display-xl font-medium leading-tight tracking-tight text-foreground">
            Your gold and silver,
            <br />
            <span className="text-accent">finally in one place.</span>
          </h1>
          <p className="mt-6 text-body-lg text-foreground-muted">
            Mintfolio replaces the Excel sheet, the Notes app, and the WhatsApp
            receipts. A calm, accurate dashboard for investors who own real metal.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="accent" size="lg">
              <Link href="/signup">
                Create your portfolio
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#preview">See the dashboard</Link>
            </Button>
          </div>
        </div>

        {/* ============ Hero metric mock — design system in context ============ */}
        <div
          id="preview"
          className="mx-auto mt-20 max-w-5xl rounded-xl border border-border bg-surface p-2 shadow-lg"
        >
          <div className="rounded-lg bg-cornsilk-50 p-8 md:p-12">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
                  Total portfolio value
                </p>
                <p className="mt-3 font-display text-display-lg font-medium tracking-tight text-foreground num">
                  {formatCurrency(184_320.45, "AED")}
                </p>
                <p className="mt-2 text-body-sm text-foreground-muted">
                  <span className="font-medium text-success num">
                    +{formatCurrency(12_840.12, "AED")}
                  </span>{" "}
                  <span className="text-success">
                    ({formatPercent(7.49)})
                  </span>{" "}
                  unrealized
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="rounded-full bg-olive-100 px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wider text-olive-800">
                  Live · cached today
                </span>
                <span className="text-caption text-foreground-subtle">
                  Last updated 2 hours ago
                </span>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetricTile label="Gold holdings" value="312.4 g" sub="24K, 22K" />
              <MetricTile label="Silver holdings" value="48 oz" sub="Bars, coins" />
              <MetricTile label="Invested" value={formatCurrency(171_480, "AED")} sub="Lifetime" />
              <MetricTile
                label="Realized P/L"
                value={formatCurrency(3_210, "AED")}
                sub="From 2 sales"
                positive
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ Features ============ */}
      <section id="features" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-micro font-semibold uppercase tracking-wider text-accent">
            What it does
          </p>
          <h2 className="mt-3 font-display text-display-md font-medium tracking-tight text-foreground">
            Everything a metals investor actually needs.
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-6">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-olive-100 text-olive-800">
                  <feature.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-h3 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-body-sm text-foreground-muted">
                  {feature.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-caption text-foreground-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} Mintfolio</p>
          <p>Built for serious metals investors.</p>
        </div>
      </footer>
    </div>
  );
}

function MetricTile({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-surface p-4">
      <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
        {label}
      </p>
      <p
        className={
          "mt-2 text-h2 font-semibold tracking-tight num " +
          (positive ? "text-success" : "text-foreground")
        }
      >
        {positive ? "+" : ""}
        {value}
      </p>
      <p className="mt-1 text-caption text-foreground-muted">{sub}</p>
    </div>
  );
}
