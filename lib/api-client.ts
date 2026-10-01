import { createClient } from "@/lib/supabase/server";

/**
 * Server-side fetch wrapper for the Mintfolio FastAPI backend.
 *
 * Pulls the current user's Supabase access token out of cookies and attaches
 * it as a Bearer token. Only callable from Server Components, Route Handlers,
 * and Server Actions (because it uses `next/headers` cookies).
 *
 * Throws on non-2xx by default — pass `{ throwOnError: false }` if you want
 * to handle status codes yourself.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: unknown,
  ) {
    super(typeof detail === "string" ? detail : `API ${status}`);
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ApiFetchInit = Omit<RequestInit, "body"> & {
  body?: unknown;
  throwOnError?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  init: ApiFetchInit = {},
): Promise<T> {
  const { body, throwOnError = true, headers, ...rest } = init;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    if (throwOnError) {
      throw new ApiError(
        response.status,
        (data as { detail?: unknown } | null)?.detail ?? text,
      );
    }
  }

  return data as T;
}

/**
 * Human-readable message for any error thrown by `apiFetch`. FastAPI
 * validation errors arrive as a list of `{ loc, msg }` — flatten them to
 * "field: message" instead of dumping JSON at the user.
 */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const { detail } = err;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d: { loc?: unknown[]; msg?: string }) => {
          const field = d.loc?.filter((p) => p !== "body").join(".");
          const msg = (d.msg ?? "invalid").replace(/^Value error, /, "");
          return field ? `${field}: ${msg}` : msg;
        })
        .join(" · ");
    }
    return JSON.stringify(detail);
  }
  return err instanceof Error ? err.message : String(err);
}
