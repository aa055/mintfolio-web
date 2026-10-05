import { cache } from "react";

import { apiFetch } from "@/lib/api-client";
import type { MeResponse } from "@/lib/api-types";

/**
 * The signed-in user's profile + portfolio, fetched at most once per
 * request: the app layout and the page both call this, and React's
 * `cache` makes the second call free. Throws like `apiFetch` (404 means
 * the user hasn't been synced yet).
 */
export const getMe = cache(() => apiFetch<MeResponse>("/auth/me", { method: "GET" }));
