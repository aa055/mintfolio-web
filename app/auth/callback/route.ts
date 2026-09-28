import { NextResponse, type NextRequest } from "next/server";

import { apiFetch } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles two redirect flows from Supabase:
 *
 *  1. Email confirmation links — Supabase appends `?code=...` to the URL
 *     we passed as `emailRedirectTo` during sign-up.
 *  2. OAuth provider callbacks (Google) — same `?code=...` shape.
 *
 * Supabase also sends failure redirects with `?error=&error_description=`
 * when a link expires or the user denies the OAuth grant — we forward
 * those to /login with a friendly banner.
 *
 * On success we exchange the code for a session, ensure backend rows
 * exist, and redirect to the `next` query param (defaults to /dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Supabase failure redirect
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const errorCode = searchParams.get("error_code");
  if (errorParam) {
    const friendly =
      errorCode === "otp_expired"
        ? "That confirmation link has expired. Please request a new one."
        : (errorDescription ?? errorParam);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(friendly)}`,
    );
  }

  const code = searchParams.get("code");
  // Only allow same-origin paths — "//host" or "/\host" would leave the site.
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
      ? rawNext
      : "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Missing confirmation code")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  try {
    await apiFetch("/auth/sync", { method: "POST", body: {} });
  } catch (err) {
    console.error("[auth/callback] /auth/sync failed:", err);
    // Continue to the destination — dashboard self-heals via GET /auth/me.
  }

  return NextResponse.redirect(`${origin}${next}`);
}
