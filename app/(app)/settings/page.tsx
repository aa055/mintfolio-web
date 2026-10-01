import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/settings/settings-form";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { LivePrice, MeResponse } from "@/lib/api-types";

export default async function SettingsPage() {
  let me: MeResponse;
  try {
    me = await apiFetch<MeResponse>("/auth/me", { method: "GET" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      // Not synced yet — the dashboard's self-heal path creates the rows.
      redirect("/dashboard");
    }
    throw err;
  }

  // Only used as a reference next to the manual inputs — optional.
  const livePrices = await apiFetch<{ prices: LivePrice[] }>("/prices/live", { method: "GET" })
    .then((r) => r.prices)
    .catch(() => []);

  // Built here, not in the client, so server and browser render the same list.
  const timezones = Intl.supportedValuesOf("timeZone");

  return <SettingsForm user={me.user} livePrices={livePrices} timezones={timezones} />;
}
