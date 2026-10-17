/**
 * Shared helpers for the e2e suite: env loading, a throwaway Supabase user
 * with sample data, API access as that user, and full cleanup.
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY (in .env.e2e — never commit it) to create
 * and delete the test user. Everything else comes from the app's .env.
 */
import fs from "node:fs";
import path from "node:path";

import type { Page } from "@playwright/test";

export const AUTH_DIR = path.join(__dirname, ".auth");
export const STATE_FILE = path.join(AUTH_DIR, "state.json");
export const USER_FILE = path.join(AUTH_DIR, "user.json");

/** Display name stored at "signup" — login copies it into the app profile. */
export const TEST_NAME = "Layla Rahman";

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/** Load .env then .env.e2e (without overriding real environment variables). */
export function loadE2EEnv() {
  for (const file of [".env", ".env.local", ".env.e2e"]) {
    const full = path.join(__dirname, "..", file);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} — see e2e/README.md (copy .env.e2e.example to .env.e2e).`);
  return v;
}

const supabaseUrl = () => env("NEXT_PUBLIC_SUPABASE_URL");
const apiUrl = () => process.env.E2E_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const admin = () => {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
};

async function ok(res: Response, what: string) {
  if (!res.ok) throw new Error(`${what} failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res;
}

/** Calls to the Mintfolio API as the given user (password sign-in). */
export async function apiAs(user: TestUser) {
  const res = await ok(
    await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.password }),
    }),
    "password sign-in",
  );
  const { access_token } = (await res.json()) as { access_token: string };
  return async <T = unknown>(method: string, url: string, body?: unknown): Promise<T> => {
    const r = await ok(
      await fetch(apiUrl() + url, {
        method,
        headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      `${method} ${url}`,
    );
    return (r.status === 204 ? null : await r.json()) as T;
  };
}

export async function checkServers(baseURL: string) {
  for (const [name, url] of [["web app", `${baseURL}/login`], ["API", `${apiUrl()}/health`]]) {
    try {
      await ok(await fetch(url), name);
    } catch {
      throw new Error(`The ${name} isn't reachable at ${url}. Start it before running the e2e suite.`);
    }
  }
}

/**
 * A confirmed user whose name exists only in Supabase metadata (as after
 * signup), with three purchases — one in GBP — and a sale dated today.
 */
export async function createSeededUser(): Promise<TestUser> {
  const user = {
    email: `e2e-${crypto.randomUUID().slice(0, 8)}@mintfolio.test`,
    password: crypto.randomUUID(),
  };
  const res = await ok(
    await fetch(`${supabaseUrl()}/auth/v1/admin/users`, {
      method: "POST",
      headers: admin(),
      body: JSON.stringify({ ...user, email_confirm: true, user_metadata: { full_name: TEST_NAME } }),
    }),
    "create test user",
  );
  const created: TestUser = { ...user, id: ((await res.json()) as { id: string }).id };

  const api = await apiAs(created);
  // Sync without a name: the first UI login fills it from the metadata.
  const me = await api<{ portfolio: { id: string } }>("POST", "/auth/sync", {});
  const pid = me.portfolio.id;
  const purchases = [
    {
      purchase_date: "2026-03-10", dealer: "Emirates Gold", purchase_currency: "AED", payment_method: "cash",
      items: [
        { metal: "gold", purity: "24K", form: "bar", weight_value: "1", weight_unit: "oz", purchase_price: "11500.00" },
        { metal: "gold", purity: "22K", form: "coin", weight_value: "8", weight_unit: "g", quantity: 2, purchase_price: "5400.00" },
      ],
    },
    {
      purchase_date: "2026-06-02", dealer: "BullionByPost", purchase_currency: "AED", payment_method: "card",
      card_premium_percentage: "2.5",
      items: [{ metal: "silver", purity: "999", form: "coin", weight_value: "1", weight_unit: "oz", quantity: 20, purchase_price: "3900.00" }],
    },
    {
      purchase_date: "2026-07-15", dealer: "London dealer", purchase_currency: "GBP", payment_method: "cash",
      items: [{ metal: "gold", purity: "916", form: "coin", weight_value: "7.98", weight_unit: "g", purchase_price: "650.00" }],
    },
  ];
  const saved = [];
  for (const body of purchases) {
    saved.push(await api<{ items: { id: string; purity: string }[] }>("POST", `/portfolios/${pid}/purchases`, body));
  }
  const coin = saved[0].items.find((i) => i.purity === "22K")!;
  const today = new Date().toISOString().slice(0, 10);
  await api("POST", `/holdings/${coin.id}/sale`, {
    sale_price: "5900.00", sale_currency: "AED", sale_date: today, fees: "50", sold_to: "Gold Souk",
  });
  return created;
}

async function listStorage(bucket: string, prefix: string): Promise<{ name: string; id: string | null }[]> {
  const res = await fetch(`${supabaseUrl()}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: admin(),
    body: JSON.stringify({ prefix, limit: 1000 }),
  });
  return res.ok ? ((await res.json()) as { name: string; id: string | null }[]) : [];
}

/** Delete the user's files, app rows (cascade) and auth account. */
export async function deleteUser(userId: string) {
  const receipts = process.env.SUPABASE_STORAGE_BUCKET ?? "receipts";
  const avatars = process.env.SUPABASE_AVATAR_BUCKET ?? "avatars";
  const root = `user-${userId}/`;
  const paths: [string, string[]][] = [[receipts, []], [avatars, []]];
  for (const entry of await listStorage(receipts, root)) {
    // receipts: user-<id>/purchase-<id>/<file>; folders come back with id null
    for (const f of await listStorage(receipts, `${root}${entry.name}/`)) paths[0][1].push(`${root}${entry.name}/${f.name}`);
  }
  for (const f of await listStorage(avatars, root)) paths[1][1].push(`${root}${f.name}`);
  for (const [bucket, prefixes] of paths) {
    if (prefixes.length) {
      await fetch(`${supabaseUrl()}/storage/v1/object/${bucket}`, {
        method: "DELETE",
        headers: admin(),
        body: JSON.stringify({ prefixes }),
      });
    }
  }
  await fetch(`${supabaseUrl()}/rest/v1/users?id=eq.${userId}`, { method: "DELETE", headers: admin() });
  await fetch(`${supabaseUrl()}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin() });
}

export function readUser(): TestUser {
  return JSON.parse(fs.readFileSync(USER_FILE, "utf8")) as TestUser;
}

/** Collapse whitespace (incl. the no-break space Intl puts in currency). */
export const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/** "AED 1,234.56", as the app formats it. */
export const aed = (n: number) =>
  `AED ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Open the account menu and pick a theme. */
export async function pickTheme(page: Page, theme: "Light" | "Dark" | "System") {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitemradio", { name: theme }).click();
}

/** Wait until the page's heading is in and the client has hydrated. */
export async function ready(page: Page) {
  await page.locator("h1").first().waitFor();
  await page.waitForLoadState("load");
  await page.waitForTimeout(500);
}
