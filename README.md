# mintfolio-web

Frontend for **Mintfolio** — a portfolio management platform for physical precious metals.

This repo is the Next.js client. It handles auth UI, the dashboard, holdings management, and receipt uploads. All data flows through the FastAPI service in [`mintfolio-api`](https://github.com/aamir/mintfolio-api). The frontend never talks to Supabase tables directly.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| Components | shadcn/ui (custom theme) |
| Forms | react-hook-form + zod |
| Server state | TanStack Query |
| Client state | Zustand (used sparingly) |
| Charts | Recharts |
| Icons | lucide-react |
| Auth client | `@supabase/supabase-js` (session only) |
| Hosting | Vercel |

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
  layout.tsx              Root layout + font setup
  globals.css             Theme tokens + base styles
  page.tsx                Marketing landing page
  (auth)/                 Login, signup, forgot-password (to be added)
  (app)/                  Authenticated dashboard area (to be added)
components/
  ui/                     Base primitives (button, card, ...)
  dashboard/              Dashboard widgets (to be added)
lib/
  utils.ts                cn(), formatCurrency, formatPercent, formatWeight
  api-client.ts           (to be added) Fetch wrapper with Supabase JWT
  supabase.ts             (to be added) Browser-side auth client
docs/
  design-system.md        Visual system source of truth
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
