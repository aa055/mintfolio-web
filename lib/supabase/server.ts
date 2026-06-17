import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Reads/writes the session cookie via next/headers.
 *
 * Only use this for AUTH operations (getUser, getSession, signOut).
 * All data reads/writes go through the FastAPI backend.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — cookie setting is a no-op there.
          // The middleware refreshes the session on every request, so this
          // is safe to ignore.
        }
      },
    },
  });
}
