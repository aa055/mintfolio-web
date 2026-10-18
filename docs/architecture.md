# Web architecture (low level)

> **What this covers:** how `mintfolio-web` is built: routes, where data is fetched, how mutations work, the auth and session handling, uploads, theming, and the component map.
> **Big picture first?** Read the project-wide [Architecture](https://github.com/aa055/mintfolio-docs/blob/main/docs/02-architecture.md). (Project-wide docs live in the [mintfolio-docs](https://github.com/aa055/mintfolio-docs) repo.)

---

## 1. The model in one picture

```mermaid
flowchart TB
    subgraph browser["Browser"]
        cc["Client Components<br/>forms, charts, filters, menus"]
        ls[("localStorage<br/>theme only")]
        url[("URL query<br/>filters, ranges")]
    end
    subgraph server["Next.js server"]
        mw["middleware.ts<br/>refresh session · guard routes"]
        sc["Server Components (pages)<br/>fetch with apiFetch()"]
        sa["Server Actions (lib/**/actions.ts)<br/>mutate with apiFetch() → revalidatePath"]
        cb["app/auth/callback/route.ts<br/>OAuth / email code → session"]
        ac["lib/api-client.ts<br/>adds Bearer token from cookie"]
    end
    api["FastAPI"]
    st[("Supabase Storage")]
    au[("Supabase Auth")]

    browser -- "request" --> mw --> sc
    sc -- "props (data)" --> cc
    cc -- "call action" --> sa
    sc --> ac
    sa --> ac
    ac --> api
    mw --> au
    cb --> au
    cc -. "PUT file to signed URL" .-> st
    cc <--> ls
    cc <--> url
```

**Three rules**

1. **Pages fetch on the server.** A page is an async Server Component that calls `apiFetch()`. Data arrives as props, so there is no client-side data library and no token in the browser.
2. **Changes go through Server Actions.** Forms and buttons call functions in `lib/*/actions.ts`. These call the API and then `revalidatePath()` or `router.refresh()`, so the server re-renders with fresh data.
3. **Client state is tiny.** It's form state (react-hook-form), UI toggles, the **URL** for filters and ranges, and **localStorage** for the theme. Nothing else.

---

## 2. Folder map

```
mintfolio-web/
├── middleware.ts                 runs updateSession() on every page request
├── app/
│   ├── layout.tsx                <html>, fonts (Inter + Fraunces), theme init script
│   ├── page.tsx                  marketing landing page (/)
│   ├── not-found.tsx             branded 404
│   ├── icon.svg                  favicon
│   ├── globals.css               theme tokens (light in @layer base, .dark outside it)
│   ├── auth/callback/route.ts    OAuth + email-confirm code exchange → /auth/sync
│   ├── (auth)/                   login, signup, signup/success (centered card layout)
│   └── (app)/                    signed-in area
│       ├── layout.tsx            shell: sidebar, top bar + avatar menu, phone tab bar
│       ├── error.tsx             in-shell error screen ("Try again")
│       ├── dashboard/            Home
│       ├── holdings/
│       ├── transactions/
│       ├── purchases/new · [id] · [id]/edit
│       ├── rates/
│       ├── profile/
│       └── settings/
│           (each folder: page.tsx + loading.tsx)
├── components/
│   ├── ui/                       shadcn primitives: button, card, dialog, dropdown-menu, input, label, select, textarea
│   ├── shell/                    sidebar, mobile-tab-bar, user-menu, nav.ts, page-skeletons, coming-soon
│   ├── home/                     rate-cards, summary-tiles, performance-chart, allocation-card, recent-transactions
│   ├── holdings/                 metal-cards, holdings-table, premium-note
│   ├── transactions/             transactions-view
│   ├── purchases/                purchase-form, purchase-items, holding-actions (sell/undo/delete), receipt-strip, receipt-uploader
│   ├── rates/                    rates-view
│   ├── profile/                  profile-form
│   ├── settings/                 settings-form
│   └── auth/                     auth-form, google-button
├── lib/
│   ├── api-client.ts             apiFetch(), ApiError, apiErrorMessage()
│   ├── api-types.ts              TypeScript copy of the API schemas
│   ├── me.ts                     getMe(): /auth/me, cached once per request
│   ├── auth/                     actions.ts (login, signup, Google, logout), sync.ts (sync body)
│   ├── purchases/                actions.ts, file-actions.ts, upload.ts (browser upload loop)
│   ├── sales/actions.ts · settings/actions.ts · profile/actions.ts
│   ├── supabase/                 server.ts, middleware.ts, env.ts (client.ts unused)
│   ├── theme.ts                  useTheme(), THEME_INIT_SCRIPT
│   ├── use-chart-colors.ts       resolves CSS tokens for Recharts (live on theme change)
│   └── utils.ts                  cn(), formatCurrency, formatSignedCurrency, formatWeight, plTone…
├── e2e/                          Playwright specs + setup/teardown (see development.md)
└── docs/                         you are here
```

---

## 3. Route map

| URL | File | Server fetches (API) | Main client component |
|---|---|---|---|
| `/` | `app/page.tsx` | — | static landing |
| `/login`, `/signup`, `/signup/success` | `app/(auth)/…` | — (server actions on submit) | `AuthForm`, `GoogleButton` |
| `/auth/callback` | `app/auth/callback/route.ts` | `POST /auth/sync` | — (redirects) |
| `/dashboard` (Home) | `(app)/dashboard/page.tsx` | `/auth/me` → in parallel `/summary`, `/history?range=ALL`, `/transactions?limit=100` | `PerformanceChart`, `RecentTransactions` |
| `/holdings` | `(app)/holdings/page.tsx` | `/auth/me` → `/purchases` + `/summary` | `HoldingsTable` |
| `/transactions` | `(app)/transactions/page.tsx` | `/auth/me` → `/transactions` | `TransactionsView` |
| `/purchases/new` | `(app)/purchases/new/page.tsx` | `/auth/me` | `PurchaseForm` |
| `/purchases/[id]` | `(app)/purchases/[id]/page.tsx` | `/purchases/{id}` → `/summary` | `PurchaseItems`, `HoldingActions`, `ReceiptStrip` |
| `/purchases/[id]/edit` | `(app)/purchases/[id]/edit/page.tsx` | `/purchases/{id}` | `PurchaseForm` |
| `/rates` | `(app)/rates/page.tsx` | `/auth/me` → `/prices/history?range=5Y` for gold **and** silver | `RatesView` (switches metal and range instantly, client-side) |
| `/profile` | `(app)/profile/page.tsx` | `/auth/me` + Supabase user (sign-in provider) | `ProfileForm` |
| `/settings` | `(app)/settings/page.tsx` | `/auth/me` + `/prices/live` | `SettingsForm` |

`getMe()` is wrapped in React `cache()`. The layout and the page both call it, but it runs once per request.

---

## 4. Auth and session

```mermaid
flowchart TD
    req["Any page request"] --> mw["middleware.ts → updateSession()"]
    mw --> gu["supabase.auth.getUser()<br/>(refreshes token, rewrites cookie)"]
    gu --> q1{"Signed in?"}
    q1 -- no --> q2{"Protected path?<br/>/dashboard /holdings /transactions<br/>/purchases /rates /profile /settings"}
    q2 -- yes --> login["redirect /login"]
    q2 -- no --> pass["continue"]
    q1 -- yes --> q3{"/login or /signup?"}
    q3 -- yes --> home["redirect /dashboard"]
    q3 -- no --> pass
    pass --> layout["(app)/layout.tsx<br/>getUser() again (defence in depth)<br/>getMe() for name + photo"]
```

| Piece | File | Notes |
|---|---|---|
| Session cookie | `@supabase/ssr` | Set by server actions and the callback route; refreshed by middleware on every request. |
| Login / signup / Google / logout | `lib/auth/actions.ts` | Server actions. Signup stores `full_name` in Supabase `user_metadata`. |
| Sync | `lib/auth/sync.ts` → `POST /auth/sync` | Called after login, signup (if there's a session) and the callback. A failure doesn't block login. |
| Self-heal | `(app)/dashboard/page.tsx` | If `/auth/me` returns 404, Home calls `/auth/sync` and continues. |
| Token to API | `lib/api-client.ts` | Reads the session from the cookie, then sends `Authorization: Bearer <access_token>`. |
| Shell fallback | `(app)/layout.tsx` | If the API is down, the name and photo come from Supabase metadata, so the shell still renders. |

---

## 5. Mutations

| User action | Action (in `lib/`) | API call | Then |
|---|---|---|---|
| Save new purchase | `purchases/actions.ts · createPurchaseAction` | `POST /portfolios/{id}/purchases` | upload receipts, go to the purchase page |
| Save edits | `updatePurchaseAction` | `PUT /purchases/{id}` | `revalidatePath` |
| Delete purchase | `deletePurchaseAction` | `DELETE /purchases/{id}` | to `/transactions` |
| Sell / undo | `sales/actions.ts` | `POST` / `DELETE /holdings/{id}/sale` | refresh |
| Upload receipt | `purchases/upload.ts` (browser) + `file-actions.ts` | sign-upload → PUT to Storage → register | refresh |
| Delete receipt | `file-actions.ts` | `DELETE /files/{id}` | refresh |
| Save preferences / manual rates | `settings/actions.ts` | `PATCH /auth/me` · `PUT /prices/manual` | refresh |
| Name / photo | `profile/actions.ts` | `PATCH /auth/me` · avatar endpoints | refresh |

Actions return `{ ok: true, data } | { ok: false, error }` rather than throwing, so forms can show the error inline. `apiErrorMessage()` turns FastAPI 422 lists into "field: message" text.

### Receipt upload (browser side)

```mermaid
sequenceDiagram
    participant U as ReceiptUploader (browser)
    participant SA as Server action
    participant A as API
    participant S as Storage
    U->>U: validateReceipts() type and size (jpg/png/pdf ≤ 5 MB)
    loop one file at a time (progress shown)
        U->>SA: signUploadAction(purchaseId, meta)
        SA->>A: POST /purchases/{id}/files/sign-upload
        A-->>U: upload_url, storage_path
        U->>S: fetch(upload_url, PUT, file)
        U->>SA: registerFileAction(...)
        SA->>A: POST /purchases/{id}/files
    end
    U->>U: show failures per file, refresh
```

---

## 6. Theming

```mermaid
flowchart LR
    t["globals.css<br/>:root tokens (light)<br/>.dark tokens (outside @layer)"] --> tw["tailwind.config.ts<br/>bg-surface, text-foreground,<br/>bg-primary … → rgb(var(--x))"]
    tw --> comp["components use semantic classes only"]
    s["THEME_INIT_SCRIPT in &lt;head&gt;<br/>reads localStorage 'mintfolio-theme'<br/>adds .dark before paint"] --> html["&lt;html class='dark'&gt;"]
    m["UserMenu → useTheme()<br/>Light · Dark · System"] --> html
    html --> cc["useChartColors()<br/>reads CSS vars, re-reads on change"] --> charts["Recharts colours"]
```

- **Tokens:** surfaces, text, brand (`primary`, `accent` + hover), states, chart (`chart-value`, `chart-baseline`, `series-gold`, `series-silver`), notices. Values are RGB triplets, so `bg-primary/50` works.
- **Why dark sits outside `@layer`:** Tailwind drops layered CSS for classes it never sees in the source, and `dark` is only added at runtime.
- **Charts:** SVG attributes can't use `var()`, so `useChartColors()` resolves the tokens and updates when the theme changes.
- Visual rules (palette, type scale, spacing): [design-system.md](design-system.md). Current token values: `app/globals.css`.

---

## 7. Other conventions

| Topic | How |
|---|---|
| **URL state** | Holdings and Transactions filters, and the Rates metal/range, live in the query string. They're written with `history.replaceState` in an effect, so reload and share keep the view. |
| **Loading** | Each route has `loading.tsx` using skeletons from `components/shell/page-skeletons.tsx` (`role="status"`, announced once). |
| **Errors** | `(app)/error.tsx` keeps the shell and shows "Try again" (`reset()`) plus the error digest. Unknown routes and missing purchases → `not-found.tsx`. |
| **Navigation** | `components/shell/nav.ts` is the single list of sections. `isActive()` marks `aria-current="page"`; `/purchases/*` counts as Transactions. |
| **Money and weights** | Always via `formatCurrency` / `formatSignedCurrency` / `formatWeight(grams, unit)` from `lib/utils.ts`. The weight unit comes from the user's profile. Numbers get the `num` class (tabular digits). |
| **Typed routes** | `typedRoutes: true` in `next.config.mjs`; links use the `Route` type. |
| **Images** | `next/image` allows the Supabase Storage host (from `NEXT_PUBLIC_SUPABASE_URL`). |
| **API types** | `lib/api-types.ts` must match `mintfolio-api/app/schemas`. Decimals are `string`. |
