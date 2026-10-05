import Link from "next/link";
import { CircleAlert, Plus, ReceiptText } from "lucide-react";

import { AllocationCard, SummaryNotices } from "@/components/home/allocation-card";
import { PerformanceChart } from "@/components/home/performance-chart";
import { RateCards } from "@/components/home/rate-cards";
import { RecentTransactions, type RecentTransaction } from "@/components/home/recent-transactions";
import { SummaryTiles } from "@/components/home/summary-tiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, apiErrorMessage, apiFetch } from "@/lib/api-client";
import type {
  MeResponse,
  PortfolioHistory,
  PortfolioSummary,
  TransactionList,
} from "@/lib/api-types";
import { getMe } from "@/lib/me";

/** "1 Sep 2026" — date-only ISO strings are UTC midnight, so format in UTC. */
function formatDay(iso: string, withYear = true) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** Greeting, long date and today's ISO date in the user's timezone. */
function localNow(timeZone: string) {
  const now = new Date();
  const tz = (() => {
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone });
      return timeZone;
    } catch {
      return "Asia/Dubai";
    }
  })();
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(now),
  );
  return {
    greeting: hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening",
    longDate: new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: tz,
    }).format(now),
    isoDate: new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now), // YYYY-MM-DD
  };
}

async function loadMe(): Promise<{ me: MeResponse | null; error: string | null }> {
  try {
    return { me: await getMe(), error: null };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      // First visit after signup: create the user + portfolio rows.
      try {
        const me = await apiFetch<MeResponse>("/auth/sync", { method: "POST", body: {} });
        return { me, error: null };
      } catch (inner) {
        return { me: null, error: apiErrorMessage(inner) };
      }
    }
    return { me: null, error: apiErrorMessage(err) };
  }
}

export default async function HomePage() {
  const { me, error } = await loadMe();
  if (!me) return <BackendError message={error} />;

  const pid = me.portfolio.id;
  const [summaryRes, historyRes, txRes] = await Promise.allSettled([
    apiFetch<PortfolioSummary>(`/portfolios/${pid}/summary`, { method: "GET" }),
    apiFetch<PortfolioHistory>(`/portfolios/${pid}/history?range=ALL`, { method: "GET" }),
    apiFetch<TransactionList>(`/portfolios/${pid}/transactions?limit=100`, { method: "GET" }),
  ]);
  const summary = summaryRes.status === "fulfilled" ? summaryRes.value : null;
  const history = historyRes.status === "fulfilled" ? historyRes.value : null;
  const transactions: RecentTransaction[] =
    txRes.status === "fulfilled"
      ? txRes.value.transactions.map((t) => ({ ...t, dateLabel: formatDay(t.date) }))
      : [];
  for (const res of [summaryRes, historyRes, txRes]) {
    if (res.status === "rejected") console.error("[home] request failed:", res.reason);
  }

  const now = localNow(me.user.timezone);
  const firstName = me.user.display_name?.trim().split(/\s+/)[0];
  const hasPurchases =
    transactions.some((t) => t.kind === "purchase") ||
    (summary !== null && summary.active_count + summary.sold_count + summary.other_currency_count > 0);
  const marketDay = summary?.market_rates[0]?.day;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
            {now.longDate}
          </p>
          <h1 className="mt-2 font-display text-display-md font-medium tracking-tight text-foreground">
            {now.greeting}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-2 text-body text-foreground-muted">
            {hasPurchases
              ? "Here's how your metal is doing."
              : "Record your first purchase to start tracking your holdings."}
          </p>
        </div>
        {summary ? (
          <RateCards rates={summary.market_rates} asOf={marketDay ? formatDay(marketDay) : null} />
        ) : null}
      </header>

      {!hasPurchases ? (
        <EmptyState />
      ) : !summary ? (
        <Card>
          <CardContent className="px-6 py-8 text-body-sm text-foreground-muted">
            Couldn&apos;t load your portfolio values right now. Try refreshing in a moment.
          </CardContent>
        </Card>
      ) : (
        <>
          <SummaryNotices summary={summary} />
          <SummaryTiles
            summary={summary}
            todayLabel={
              summary.today_change ? formatDay(summary.today_change.previous_day, false) : null
            }
          />
          <PerformanceChart
            points={history?.points ?? []}
            currency={summary.currency}
            pricingMode={summary.pricing_mode}
          />
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <AllocationCard summary={summary} />
            </div>
            <div className="lg:col-span-3">
              <RecentTransactions transactions={transactions} today={now.isoDate} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BackendError({ message }: { message: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-h3 text-destructive">
          <CircleAlert className="h-5 w-5" />
          Couldn&apos;t reach the backend
        </CardTitle>
        <CardDescription className="text-foreground-muted">
          {message ?? "An unexpected error occurred."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-foreground-muted">
          If you&apos;re running locally, make sure FastAPI is up at{" "}
          <code className="font-mono text-foreground">localhost:8000</code> (
          <code className="font-mono text-foreground">uvicorn app.main:app --reload</code>).
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-cornsilk-200 text-foreground-muted">
          <ReceiptText className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h2 className="text-h3 font-semibold text-foreground">No purchases yet</h2>
        <p className="max-w-md text-body-sm text-foreground-muted">
          A purchase captures a single dealer order. Add as many gold or silver line items as the
          receipt shows — your value, gains and charts build from there.
        </p>
        <Button asChild variant="accent" className="mt-2">
          <Link href="/purchases/new">
            <Plus />
            Record first purchase
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
