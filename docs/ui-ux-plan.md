# Mintfolio: UI/UX Revamp Plan

> Status: **planned, 2026-10-01**. Steps are executed one at a time, each verified before the next.
> Covers both repos. Backend work happens in `mintfolio-api`, UI work in `mintfolio-web`.

## 1. Goals

The app works, but everything currently lives on one long dashboard. The revamp turns it into a proper investment app shell:

1. **Home stays short.** It is a glance at portfolio health: value, today's move, all-time result, a performance chart, today's rates, allocation and recent activity. Detail lives on dedicated pages.
2. **Navigation is predictable.** A left sidebar on desktop, a bottom tab bar on phones, and an avatar menu top-right. This follows the conventions of Robinhood, Delta, Getquin, Sharesight and Coinbase.
3. **Price history becomes a feature.** Charts of gold and silver rates over time, and the portfolio's value over time, backed by years of backfilled data.
4. **Metals-specific touches** that generic trackers lack: a UAE karat rate board, weights in g / oz / tola, and the premium paid over spot.

## 2. Decisions (confirmed 2026-10-01)

| Topic | Decision |
|---|---|
| Price history | One-time backfill from **metals.dev** (free key, ~5 years daily, ~61 calls), then the daily GoldAPI job keeps it current |
| Navigation | Sidebar: **Home · Holdings · Transactions · Metal rates**. Transactions combines purchases and sales in tabs |
| User menu | **Avatar menu, top-right**: Profile, Settings, Theme, Sign out |
| Mobile nav | **Bottom tab bar**: Home · Holdings · ＋ · Transactions · Rates |
| Profile | Edit **name + photo** (initials avatar until a photo is set) |
| Extras in scope | UAE karat rate table · weight unit toggle (g/oz/tola) · premium over spot · dark mode toggle |

Assumptions. I chose these; flag any you disagree with:

- **Home keeps the `/dashboard` URL.** The sidebar says "Home". This avoids touching the auth redirects.
- **"Today's change" means since the previous daily price.** Prices are daily, so it compares the latest price day to the one before, with the date shown. It is hidden in manual pricing mode, where it is meaningless.
- **History is in USD, AED and SAR only.** AED (3.6725) and SAR (3.75) are pegged to USD, so they convert exactly. EUR/GBP/INR history needs historical FX rates, which stays Phase 2 with the rest of currency conversion.
- **Tola is display-only.** Item entry keeps g/kg/oz for now; adding tola as an input unit is a schema change and is listed as a follow-up.

## 3. Research: what established tools do

| Pattern | Seen in | Use in Mintfolio |
|---|---|---|
| Left sidebar (icons-only on tablets), bottom tabs on phones | Coinbase, Kubera; Robinhood/Delta/Getquin mobile | App shell (Step 1) |
| Hero value + today's change + one chart with range chips | Robinhood, Delta | Home (Step 2) |
| Chart of **value vs net invested** over time | Delta "Portfolio History" | Home performance chart |
| Recent activity with "View all" | most trackers | Home → Transactions |
| Combined buy/sell feed, type tabs, date filter, month groups | Snowball, Sharesight "Trades" | Transactions (Step 3) |
| Positions → lots drill-down | Yahoo Finance, Sharesight | Holdings → purchase detail (Steps 3–4) |
| Per-metal summary cards (weight, avg cost, value, gain) | StakTrakr | Holdings (Step 4) |
| Rate page: change, ranges, period high/low, karat and unit table | Kitco, BullionVault | Metal rates (Step 5) |
| AED per gram for 24K/22K/21K/18K + per tola | UAE gold-rate boards (DGJG) | Karat table (Step 5) |
| Premium paid over melt value per lot | INGOTX, StakTrakr | Holdings + purchase detail (Step 4) |
| Avatar upload with preview, editable name | Sharesight, most SaaS | Profile (Step 6) |
| Data-source credit under charts | BullionVault, Kitco | "Data: GoldAPI.io · history: metals.dev" |

## 4. Information architecture

```
Desktop ≥1024px                         Tablet 640–1023px: sidebar collapses to icons
┌────────────┬──────────────────────────────────────────────┐
│ ◉ Mintfolio│  Page title                    [◐] [Avatar ▾] │  ← top bar
│            ├──────────────────────────────────────────────┤
│ [+ Add]    │                                              │
│            │                                              │
│ ⌂ Home     │               page content                   │
│ ▤ Holdings │                                              │
│ ⇄ Transact.│                                              │
│ 〽 Metal    │                                              │
│   rates    │                                              │
│            │                                              │
│ ⚙ Settings │                                              │
└────────────┴──────────────────────────────────────────────┘

Phone <640px
┌──────────────────────────┐
│ ◉ Mintfolio     [Avatar] │
│                          │
│       page content       │
│                          │
├──────────────────────────┤
│ ⌂    ▤    (＋)   ⇄    〽  │  ← bottom tab bar, ＋ = Add purchase
└──────────────────────────┘
```

| Route | Page | Status |
|---|---|---|
| `/dashboard` | **Home** | redesigned |
| `/holdings` | Holdings (what you own now) | revamped |
| `/transactions` | Transactions: All / Purchases / Sales | new |
| `/purchases/[id]` | Purchase detail: items, receipts, sales, edit/delete | new |
| `/purchases/new`, `/purchases/[id]/edit` | Purchase form | unchanged |
| `/rates` | Metal rates | new |
| `/profile` | Profile: name, photo, account | new |
| `/settings` | Preferences: currency, timezone, pricing, manual rates, weight unit | trimmed |

Avatar menu: name + email, then **Profile**, **Settings**, **Theme** (Light / Dark / System), **Sign out**.

## 5. Page designs

### 5.1 Home (`/dashboard`)

```
Good evening, Aamir                       ┌ Gold 24K ──────┐ ┌ Silver 999 ────┐
Wednesday, 1 October                      │ AED 491.75 /g  │ │ AED 7.27 /g    │
                                          │ ▲ 0.42% today  │ │ ▼ 0.18% today  │
                                          └────────────────┘ └────────────────┘
┌ Total invested ┐ ┌ Current value ┐ ┌ Today ─────────┐ ┌ All-time ───────┐
│ AED 20,800     │ │ AED 27,025    │ │ ▲ +AED 112     │ │ ▲ +AED 6,225    │
│ 3 active items │ │               │ │ +0.41%         │ │ +29.9% · 850 rlz│
└────────────────┘ └───────────────┘ └────────────────┘ └─────────────────┘
┌ Portfolio value ────────────────────────── [1M][3M][6M][YTD][1Y][ALL] ┐
│  ▁▂▃▅▆▇█ area = value          - - - dashed = net invested            │
│  hover: date · value · invested · gain                                 │
└───────────────────────────────────────────────────────────────────────┘
┌ Allocation by metal ─────────┐ ┌ Recent transactions ─ [7D][1M][1Y][All] ┐
│ ████████████████░░░░         │ │ BUY  10 Mar  Emirates Gold   AED 16,900 │
│ Gold 83% · Silver 17%        │ │ SELL  1 Oct  Silver 999 coin AED  4,800 │
│ (table: weight/value/P/L)    │ │ …                        View all →     │
└──────────────────────────────┘ └─────────────────────────────────────────┘
```

- The **rate cards** sit on the right of the welcome line, as requested. They link to `/rates`, and on phones they stack under the greeting.
- **Tiles:** Total invested · Current value · Today's gain/loss · All-time gain/loss (unrealized + realized, with the split in small text).
- **Chart:** Recharts area chart.
  - It plots portfolio value with a dashed "net invested" line. Both are money in the same currency, so one axis is enough; no dual axis.
  - It has a hover crosshair and tooltip, range chips, and a legend.
  - Colors come from validated tokens, re-checked for dark mode.
- **Allocation:** the existing bar + table, made compact.
- **Recent transactions** replaces the purchase cards. It shows the last 5 buys and sells in the chosen window, with a "View all" link to `/transactions`.

### 5.2 Holdings (`/holdings`)

- The **per-metal summary cards** are new. Each shows total weight held, current value, cost basis, P/L and average cost per gram.
- **The status filter defaults to "Active"**: Holdings is what you own now, and sold lots are in Transactions. An "Include sold" option remains.
- **Premium over spot** is a new column. It shows how much above the metal value you paid, as an amount and a %, using your own spot rate if you entered one, otherwise the historical rate on the purchase date.
- **Rows link to the purchase detail page.** Everything else (filters, sorting, URL state, phone card list) stays as built.

### 5.3 Transactions (`/transactions`)

- Tabs **All · Purchases · Sales**, plus a date range (7D · 1M · 3M · 1Y · All · custom), a metal filter and a search box. All filters are kept in the URL.
- Rows are grouped under month headers.
  - **A purchase row** shows date, dealer, an item summary ("Gold 24K bar + 1 more"), total, a receipt icon and payment method.
  - **A sale row** shows date, item, buyer, sale price and realized P/L.
  - Rows open the purchase detail page.
- The footer shows totals for the visible window: bought, sold and net.

### 5.4 Purchase detail (`/purchases/[id]`), new

- **Header:** dealer, date, payment method, total, with Edit and Delete.
- **Items table:** weight, cost, current value, P/L, premium over spot, and Sell / Undo per item.
- **Receipts gallery:** view, upload more, delete.
- **Notes**, and the sale details for any sold items.

The dashboard's purchase cards move here.

### 5.5 Metal rates (`/rates`)

- A **Gold | Silver** switch. Each metal gets its own chart; the two are never on one axis, since their scales differ by ~70×.
- **Header:** current per-gram price (pure), day change, and per-oz and per-tola prices.
- **Chart:** rate over time, with ranges 1M · 3M · 6M · 1Y · 5Y. Hovering shows the date and rate.
- **Stats:** period change %, period high/low, 52-week high/low.
- **Karat table (gold):** 24K / 22K / 21K / 18K, per gram and per tola, in your currency. **Silver table:** 999 / 925.
- **Credit line:** "Daily rates: GoldAPI.io · History: metals.dev".

### 5.6 Profile (`/profile`)

- **Avatar:** click to upload a JPG/PNG/WebP up to 2 MB, with a preview before saving; Remove reverts to initials. Display priority is uploaded photo, then Google photo, then initials.
- **Name:** editable display name. It moves here from Settings.
- **Read-only account info:** email, sign-in method (Email / Google), and member-since date.
- **Fixes a bug:** the name from signup never reaches the app today. The signup form has no name field, and `/auth/sync` is always called with an empty body, so real users have no `display_name`. The plan adds a name field to signup and passes Supabase `user_metadata` (name and Google photo) into sync.

### 5.7 Settings (`/settings`)

Currency, timezone, pricing mode, manual rates, and the new **weight unit** (g / troy oz / tola). Theme stays in the avatar menu.

## 6. Steps

Each step ends with type-check and lint, API tests, a browser run-through on desktop and phone, and screenshots. Nothing is committed for you.

### Step 0: Price data foundation (API)
The charts on Home and Rates depend on this, so it comes first.
- [x] **Migration:** allow `price_history.source = 'metalsdev'`, and add a unique index per (metal, purity, currency, source, day) so a re-run can't duplicate rows.
- [x] **`app/jobs/backfill_prices.py`:**
  - Calls the metals.dev timeseries endpoint in 30-day windows, about 61 calls for 5 years.
  - Converts USD/oz to per-gram, then to AED and SAR via the pegs.
  - Stores the pure rates (24K / 999) and is idempotent, with a `--dry-run` option.
  - **You do:** create a free metals.dev key and add `METALS_DEV_KEY` to `.env`.
  - I'll verify the exact endpoint and response against their docs before writing it.
- [x] **`GET /prices/history?metal=&range=&currency=`:** one point per day, the last price of each day, with weekends carried forward.
- [x] **Schedule the daily GoldAPI job** as a GitHub Actions workflow (free). It needs the repos pushed, and doubles as the keep-alive that stops Supabase pausing. *Workflow written; it goes live once the repo is pushed and the two secrets are set.*
- **Done when:** the history endpoint returns about 5 years of daily gold and silver in AED, and a second backfill run inserts 0 rows.
- **Result (2026-10-01):** 1,817 days stored (30 Sep 2021 to 30 Sep 2026), using 63 metals.dev calls. metals.dev itself has no data for 10–11 Dec 2024 and 25 Dec 2024 – 1 Jan 2025; the history carries the previous price across those days.

### Step 1: App shell
- [x] `app/(app)/layout.tsx` becomes sidebar + top bar + content. Below 640px it becomes a top bar + bottom tab bar.
- [x] Components: `Sidebar`, `TopBar`, `MobileTabBar`, `UserMenu` (Radix dropdown, already installed). The current section is highlighted.
- [x] Remove the current header links.
- [x] Add placeholder pages for `/transactions`, `/rates` and `/profile` so navigation works end to end.
- [x] Add the new routes to the protected list in middleware.
- **Done when:** every page renders in the shell at 1280, 800 and 390px widths with no sideways scroll, and the keyboard can reach every nav item.
- **Result (2026-10-04):** browser-tested at all three widths on all 7 pages. The test found and fixed two layout bugs: an invisible table label widening the page, and Holdings columns too cramped beside the rail.

### Step 2: Home redesign
- [ ] **API:**
  - `GET /portfolios/{id}/history?range=` returns daily value and net invested. It counts each holding from its purchase date until its sale date.
  - The summary gains `today_change` (amount, %, price dates), `all_time_pl` and previous-day rates.
  - `GET /portfolios/{id}/transactions?type=&since=&limit=` returns a combined feed.
- [ ] **UI:** greeting and rate cards, the 4 tiles, the performance chart with range chips, the compact allocation, and the Recent transactions widget with its range filter.
- [ ] The purchase list moves off Home.
- **Done when:** the chart's last point equals the "Current value" tile; changing ranges re-plots; recent transactions respects the window; and a test confirms the history math.

### Step 3: Transactions + purchase detail
- [ ] `/transactions` with tabs, filters, month groups and totals.
- [ ] `/purchases/[id]` detail page with items, receipts, sales, edit/delete and sell/undo.
- [ ] Links from Home's recent transactions and from Holdings rows point here.
- **Done when:** every buy and sell appears exactly once, and filters survive a reload.

### Step 4: Holdings revamp
- [ ] Per-metal summary cards, the status filter defaulting to Active, and the premium-over-spot column.
- [ ] **API:** premium per holding. It uses `spot_rate_at_purchase` if the user entered one, otherwise the backfilled rate on the purchase date.
- **Done when:** premium is right for an item with an entered spot and for one without (unit test).

### Step 5: Metal rates page
- [ ] Gold/silver switch, header prices, chart with ranges, period and 52-week stats, karat/purity table, data credit.
- **Done when:** the stats match the raw history, and the karat rows equal the pure rate × k/24.

### Step 6: Profile, signup name, weight unit
- [ ] **Signup** gets a name field.
- [ ] **Sync** passes `user_metadata` (name, Google photo) into `/auth/sync`, and that also backfills existing users on their next login.
- [ ] **API:**
  - `users.avatar_path` and `users.weight_unit` columns.
  - Avatar sign-upload / register / delete endpoints, using a new private `avatars` bucket (images only, 2 MB).
  - `PATCH /auth/me` accepts `weight_unit`.
- [ ] **UI:**
  - `/profile` page.
  - The avatar shows in the top bar.
  - The weight unit applies to every displayed weight through `formatWeight`.
  - Display name moves from Settings to Profile.
- **Done when:** a photo can be uploaded, replaced and removed; the initials fallback works; and every page shows weights in tola after switching.

### Step 7: Dark mode
- [ ] Find out why forcing the `.dark` class had no visible effect, and fix the tokens. Replace hard-coded brand classes (`bg-cornsilk-*`, `text-caramel-900`, …) with semantic tokens where needed.
- [ ] Theme toggle in the avatar menu: Light / Dark / System, saved per device, with no flash on load.
- [ ] Re-validate chart colors against the dark surface.
- **Done when:** every page is readable in both themes, checked with screenshots, and charts pass the palette validator in both.

### Step 8: Polish + QA
- [ ] Loading skeletons (`loading.tsx` per route), empty states on every page, and error boundaries.
- [ ] Accessibility pass: focus order, labels, contrast, `aria-current` on the active nav item.
- [ ] Add a favicon (fixes the 404 on every page).
- [ ] Move the end-to-end browser flows into the repo as a test suite.

## 7. Follow-ups (not in this plan)

- Tola as an **input** unit on purchases (DB check constraint change).
- EUR/GBP/INR price history via historical FX rates (Frankfurter API). Part of Phase 2 currency conversion.
- Benchmark line on the performance chart (e.g. "if you'd bought gold at spot").
- Change email / password and delete account on Profile. These were deselected for now.
