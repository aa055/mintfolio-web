import { redirect } from "next/navigation";

import { TransactionsView, type FeedRow } from "@/components/transactions/transactions-view";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { MeResponse, TransactionList } from "@/lib/api-types";
import { getMe } from "@/lib/me";

/** "1 Sep 2026" — date-only ISO strings are UTC midnight, so format in UTC. */
function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** Today's date (YYYY-MM-DD) in the user's timezone. */
function todayIn(timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(new Date());
  }
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let me: MeResponse;
  try {
    me = await getMe();
  } catch (err) {
    // Not synced yet — the Home page's self-heal path creates the rows.
    if (err instanceof ApiError && err.status === 404) redirect("/dashboard");
    throw err;
  }

  const list = await apiFetch<TransactionList>(
    `/portfolios/${me.portfolio.id}/transactions?limit=500`,
    { method: "GET" },
  );
  const rows: FeedRow[] = list.transactions.map((t) => ({ ...t, dateLabel: formatDay(t.date) }));

  const params = await searchParams;
  const initial = Object.fromEntries(
    Object.entries(params).filter((e): e is [string, string] => typeof e[1] === "string"),
  );

  return (
    <TransactionsView
      rows={rows}
      currency={me.user.preferred_currency}
      today={todayIn(me.user.timezone)}
      initialParams={initial}
    />
  );
}
