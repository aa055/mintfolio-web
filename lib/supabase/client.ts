"use client";

import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Supabase client for use in Client Components.
 *
 * Only use this for AUTH operations (signIn, signOut, onAuthStateChange).
 * All data reads/writes go through the FastAPI backend at NEXT_PUBLIC_API_BASE_URL.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
