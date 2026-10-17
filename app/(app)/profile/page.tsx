import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { ApiError } from "@/lib/api-client";
import type { MeResponse } from "@/lib/api-types";
import { getMe } from "@/lib/me";
import { createClient } from "@/lib/supabase/server";

const PROVIDER_LABEL: Record<string, string> = { email: "Email and password", google: "Google" };

export default async function ProfilePage() {
  let me: MeResponse;
  try {
    me = await getMe();
  } catch (err) {
    // Not synced yet — the Home page's self-heal path creates the rows.
    if (err instanceof ApiError && err.status === 404) redirect("/dashboard");
    throw err;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const provider = String(user?.app_metadata?.provider ?? "email");

  return (
    <ProfileForm
      user={me.user}
      provider={PROVIDER_LABEL[provider] ?? provider}
      memberSince={new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: me.user.timezone || "Asia/Dubai",
      }).format(new Date(me.user.created_at))}
    />
  );
}
