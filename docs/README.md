# mintfolio-web docs

The Next.js frontend for Mintfolio. It has every page and form, holds the login session, and calls the API **from the server**. It never touches the database.

## Read in this order

| # | Doc | Read it to… |
|---|---|---|
| 1 | [architecture.md](architecture.md) | understand routes, server-side fetching, server actions, auth/session, uploads, theming and the folder map |
| 2 | [ui-ux.md](ui-ux.md) | see every screen, what it does, responsive behaviour, states, and accessibility rules |
| 3 | [development.md](development.md) | set up, run, test (Playwright + axe) and deploy to Vercel |
| — | [design-system.md](design-system.md) | colours, typography, spacing, component defaults |
| — | [ui-ux-plan.md](ui-ux-plan.md) | the completed revamp plan (Oct 2026): research, decisions and results per step |

## Project-wide docs

Product requirements, the cross-repo architecture, database operations, deployment, testing, status and the development plan live in the **[mintfolio-docs](https://github.com/aa055/mintfolio-docs)** repo, which is the workspace folder this repo is cloned into. Start at [docs/README.md](https://github.com/aa055/mintfolio-docs/blob/main/docs/README.md).

## Where things are in the code

| I want to change… | Go to |
|---|---|
| A page's data or layout | `app/(app)/<page>/page.tsx` |
| What a widget looks like | `components/<area>/…` |
| Navigation items | `components/shell/nav.ts` |
| Which pages need sign-in | `lib/supabase/middleware.ts` (`PROTECTED_PREFIXES`) |
| A form's save / delete behaviour | `lib/<area>/actions.ts` |
| API response types | `lib/api-types.ts` (keep in sync with `mintfolio-api/app/schemas`) |
| How money / weight is formatted | `lib/utils.ts` |
| Theme colours | `app/globals.css` (tokens) + `tailwind.config.ts` |
| Chart colours | `--chart-*` / `--series-*` tokens, read by `lib/use-chart-colors.ts` |
| Loading placeholders | `components/shell/page-skeletons.tsx` + each route's `loading.tsx` |
| E2E tests | `e2e/*.spec.ts`, shared helpers in `e2e/support.ts` |
