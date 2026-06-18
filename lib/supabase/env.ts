/**
 * Validates that the Supabase env vars are present at runtime.
 * Both files in `lib/supabase/` import these — failing here gives a
 * clearer error than "Cannot read property of undefined" deep in @supabase/ssr.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Did you copy .env.example to .env.local and fill it in?`,
    );
  }
  return value;
}

export const SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_PUBLISHABLE_KEY = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
);
