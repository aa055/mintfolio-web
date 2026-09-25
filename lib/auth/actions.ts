"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { apiFetch } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/server";

/**
 * Result type returned by login/signup actions when they don't redirect.
 * (On success, the action calls `redirect()` and never returns to the form.)
 */
export type AuthFormState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

function readForm(formData: FormData): { email: string; password: string } {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password } = readForm(formData);
  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error: error.message };
  }

  // Ensure backend rows exist. Idempotent — safe on every login.
  try {
    await apiFetch("/auth/sync", { method: "POST", body: {} });
  } catch (err) {
    // Don't block login on sync failure — dashboard self-heals via GET /auth/me.
    console.error("[auth] /auth/sync failed during login:", err);
  }

  redirect("/dashboard");
}

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password } = readForm(formData);
  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/dashboard` },
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  // If email confirmation is disabled in Supabase, a session is returned
  // immediately and we can sync + send the user straight to the dashboard.
  if (data.session) {
    try {
      await apiFetch("/auth/sync", { method: "POST", body: {} });
    } catch (err) {
      console.error("[auth] /auth/sync failed during signup:", err);
    }
    redirect("/dashboard");
  }

  // Otherwise email confirmation is required.
  redirect("/signup/success");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function googleLoginAction(): Promise<void> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/dashboard` },
  });
  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "OAuth failed")}`);
  }
  // data.url is an external OAuth URL — opt out of typed routes here.
  redirect(data.url as Route);
}
