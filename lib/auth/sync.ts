import type { User } from "@supabase/supabase-js";

/**
 * Body for POST /auth/sync: the name and photo Supabase holds for the user —
 * the name typed at signup (`full_name`) or Google's `full_name` / `name`
 * and `avatar_url` / `picture`. The API only uses them to fill empty
 * fields, so this never overwrites a name changed on the Profile page.
 */
export function syncBody(user: User | null | undefined) {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const text = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
  return {
    display_name: text(meta.full_name, 200) ?? text(meta.name, 200),
    avatar_url: text(meta.avatar_url, 2000) ?? text(meta.picture, 2000),
  };
}
