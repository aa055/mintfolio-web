import { redirect } from "next/navigation";

import { RatesView } from "@/components/rates/rates-view";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { MeResponse, Metal, PriceHistoryResponse } from "@/lib/api-types";
import { getMe } from "@/lib/me";

export default async function RatesPage({
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
  const currency = me.user.preferred_currency;

  // Five years of both metals up front, so switching metal and range is instant.
  const [gold, silver] = await Promise.all(
    (["gold", "silver"] as const).map((metal) =>
      apiFetch<PriceHistoryResponse>(`/prices/history?metal=${metal}&range=5Y&currency=${currency}`, {
        method: "GET",
      }),
    ),
  );

  const params = await searchParams;
  const initialMetal: Metal = params.metal === "silver" ? "silver" : "gold";
  const ranges = ["1M", "3M", "6M", "1Y", "5Y"] as const;
  const initialRange = ranges.find((r) => r === params.range) ?? "1Y";

  return (
    <RatesView
      history={{ gold: gold.points, silver: silver.points }}
      currency={currency}
      sources={[...new Set([...gold.sources, ...silver.sources])]}
      initialMetal={initialMetal}
      initialRange={initialRange}
    />
  );
}
