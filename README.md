# mintfolio-web

Frontend for **Mintfolio** — a portfolio management platform for physical precious metals.

This repo is the Next.js client. It handles auth UI, the dashboard, holdings management, and receipt uploads. All data flows through the FastAPI service in [`mintfolio-api`](https://github.com/aa055/mintfolio-api). The frontend never talks to Supabase tables directly.

## Documentation

| Doc | What's in it |
|---|---|
| [docs/README.md](docs/README.md) | Index of this repo's docs |
| [docs/architecture.md](docs/architecture.md) | Routes, data fetching, server actions, auth, uploads, theming |
| [docs/ui-ux.md](docs/ui-ux.md) | Every screen, responsive layout, states, accessibility |
| [docs/development.md](docs/development.md) | Setup, scripts, e2e tests, Vercel deploy |
| [docs/design-system.md](docs/design-system.md) | Colours, type, spacing |
| [docs/ui-ux-plan.md](docs/ui-ux-plan.md) | The completed UI/UX revamp plan and results |

Project-wide docs (PRD/FRD, cross-repo architecture, database operations, deployment, testing, status and plan) live in the **[mintfolio-docs](https://github.com/aa055/mintfolio-docs)** repo. Start at its [docs/README.md](https://github.com/aa055/mintfolio-docs/blob/main/docs/README.md).

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| Components | shadcn/ui (custom theme) |
| Forms | react-hook-form + zod |
| Data fetching | Server Components + Server Actions (TanStack Query / Zustand installed, unused) |
| Charts | Recharts |
| Icons | lucide-react |
| Auth client | `@supabase/supabase-js` (session only) |
| Hosting | Vercel (planned; not deployed yet) |

See [`docs/design-system.md`](./docs/design-system.md) for the visual system — color tokens, typography scale, spacing, and component defaults.

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in values
cp .env.example .env.local

# 3. Start dev server
npm run dev
```

The app runs at `http://localhost:3000`.

### Environment variables

See [`.env.example`](./.env.example). You'll need:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — for auth
- `NEXT_PUBLIC_API_BASE_URL` — the FastAPI base URL (default `http://localhost:8000`)

---

## Project layout

```
app/                      App Router pages
  layout.tsx              Root layout, fonts, theme init script
  globals.css             Theme tokens (light + dark) + base styles
  page.tsx                Marketing landing page
  (auth)/                 Login, signup, signup/success
  (app)/                  Signed-in area: dashboard (Home), holdings, transactions,
                          purchases/new|[id]|[id]/edit, rates, profile, settings
  auth/callback/          OAuth + email-confirmation code exchange
components/
  ui/                     Base primitives (button, card, dialog, select, ...)
  shell/                  Sidebar, tab bar, avatar menu, skeletons
  home/ holdings/ transactions/ purchases/ rates/ profile/ settings/ auth/
lib/
  api-client.ts           apiFetch(): server-side fetch with the Supabase JWT
  api-types.ts            TypeScript mirror of the API schemas
  */actions.ts            Server actions (purchases, sales, settings, profile, auth)
  supabase/               Session clients + middleware helper
  utils.ts                cn(), formatCurrency, formatWeight, ...
e2e/                      Playwright + axe end-to-end suite
docs/                     See "Documentation" above
```

---

## Tests

End-to-end browser tests (Playwright + axe accessibility checks) live in [`e2e/`](./e2e/README.md). With the API and `npm run dev` running:

```bash
npx playwright install chromium   # once
cp .env.e2e.example .env.e2e      # once; set SUPABASE_SERVICE_ROLE_KEY
npm run test:e2e
```

---

## Conventions

- **Use semantic color tokens** (`bg-primary`, `text-foreground`), not brand scales (`bg-olive-600`), in component code. The design system maps tokens to brand colors so themes can shift in one place.
- **Use the type-scale utilities** (`text-display-lg`, `text-h2`, `text-body-sm`) rather than raw sizes. The scale is defined in [`tailwind.config.ts`](./tailwind.config.ts).
- **Numeric values always get `num` (or `tabular-nums`)** so columns align.
- **Never remove a focus ring** — restyle it via `:focus-visible` instead.

---

## Roadmap (Phase 1 — MVP)

- [x] Project scaffold + design system
- [x] Marketing landing page
- [x] Auth pages (Supabase email + Google OAuth)
- [x] Dashboard shell + navigation
- [x] Add / edit / delete purchase (multi-item)
- [x] Sale flow (record + undo)
- [x] Receipt upload (signed URL → Supabase Storage)
- [x] Portfolio summary widgets (value, P/L, allocation)
- [x] Live + manual price toggle
- [x] Holdings table with filters + sorting (/holdings)
- [x] Settings (currency, timezone, pricing mode, manual rates)
