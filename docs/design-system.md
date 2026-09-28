# Mintfolio — Design System

This document is the single source of truth for visual decisions. Tailwind config, `globals.css`, and component variants must all derive from the tokens defined here.

---

## 1. Design Principles

1. **Premium, not loud.** This is a financial tool for serious investors. Calm surfaces, restrained motion, generous whitespace. No drop-shadow heavy, no neon gradients.
2. **Numbers are the hero.** Portfolio value, P/L, weights — these are what users come for. Display them in the largest, most confident type on the screen. Use tabular numerals everywhere money appears so columns align.
3. **Earthy, warm, trustworthy.** The palette evokes harvest, gold, copper, and grounded wealth — fitting for physical precious metals. Avoid steel-blue fintech clichés.
4. **One accent at a time.** Copper is the high-priority CTA color. Use it sparingly so it stays meaningful. Olive is the "everywhere" brand color.
5. **Light mode first.** Dark mode is supported (Black Forest base) but the default and marketing surface is light (Cornsilk base).

---

## 2. Color Tokens

### Brand palette ("Olive Garden Feast")

| Token | Hex | Role |
|---|---|---|
| `olive` | `#606c38` | Primary brand. Buttons, links, brand marks, positive accents. |
| `forest` | `#283618` | Deepest text, dark surfaces, dark-mode background. |
| `cornsilk` | `#fefae0` | Light page background, hero panels. |
| `caramel` | `#dda15e` | Secondary actions, badges, hover states, warm highlights. |
| `copper` | `#bc6c25` | High-emphasis CTAs (Add Purchase, Sell), critical info, gold-rate indicators. |

### Extended scale (derived, for hover/focus/disabled states)

Each brand color gets a 50–950 scale. Values below are mathematically derived (HSL lightness shifts of ~6% per step). These are what Tailwind classes (`bg-olive-100`, `text-copper-700`) resolve to.

**Olive** (`#606c38` is `olive-600`)
- 50: `#f5f7ec`, 100: `#e7ecd3`, 200: `#d0d8a9`, 300: `#b3c079`, 400: `#94a553`, **600: `#606c38`**, 700: `#4c562d`, 800: `#3d4525`, 900: `#333a20`, 950: `#1c2010`

**Forest** (`#283618` is `forest-900`)
- 50: `#f3f5f0`, 100: `#dfe5d4`, 200: `#bfcbac`, 300: `#9ab081`, 400: `#7a945e`, 500: `#5d7747`, 600: `#475c37`, 700: `#384a2c`, 800: `#2f3d26`, **900: `#283618`**, 950: `#15200d`

**Cornsilk** (`#fefae0` is `cornsilk-100`)
- 50: `#fffef5`, **100: `#fefae0`**, 200: `#fcf3bd`, 300: `#f9e98c`, 400: `#f4d957`, 500: `#ecc432`, 600: `#cda517`, 700: `#a17e16`, 800: `#856518`, 900: `#705419`, 950: `#412e08`

**Caramel** (`#dda15e` is `caramel-400`)
- 50: `#fdf8ef`, 100: `#faedd3`, 200: `#f4d8a4`, 300: `#ecbd72`, **400: `#dda15e`**, 500: `#d18737`, 600: `#c3702c`, 700: `#a25827`, 800: `#834826`, 900: `#6c3c22`, 950: `#3a1d10`

**Copper** (`#bc6c25` is `copper-600`)
- 50: `#fcf5ec`, 100: `#f7e6cf`, 200: `#eecb9b`, 300: `#e4a861`, 400: `#dc8b3a`, 500: `#cf7625`, **600: `#bc6c25`**, 700: `#984e1f`, 800: `#7a3f1f`, 900: `#65351c`, 950: `#3a1a0c`

### Semantic tokens (what components actually reference)

These are CSS variables in `globals.css`. **Components should always use semantic tokens, never brand tokens directly.** This makes dark mode and theme tweaks trivial.

| Token | Light value | Dark value | Use |
|---|---|---|---|
| `--background` | `cornsilk-100` | `forest-900` | Page background |
| `--surface` | `#ffffff` (paper white) | `forest-800` | Cards, panels, modals |
| `--surface-muted` | `cornsilk-200` | `forest-800` slightly lighter | Filled inputs, table-row hover |
| `--foreground` | `forest-900` | `cornsilk-100` | Body text |
| `--foreground-muted` | `forest-700` | `cornsilk-100` at 70% | Secondary text, labels |
| `--foreground-subtle` | `forest-500` | `cornsilk-100` at 50% | Captions, metadata |
| `--border` | `cornsilk-300` (alpha 80%) | `forest-700` | Card edges, dividers |
| `--border-strong` | `olive-300` | `olive-700` | Focused inputs, active tabs |
| `--primary` | `olive-600` | `olive-400` | Brand buttons, links |
| `--primary-foreground` | `cornsilk-100` | `forest-900` | Text on primary |
| `--accent` | `copper-600` | `copper-400` | High-emphasis CTAs |
| `--accent-foreground` | `cornsilk-100` | `forest-900` | Text on accent |
| `--secondary` | `caramel-400` | `caramel-500` | Secondary actions, badges |
| `--secondary-foreground` | `forest-900` | `forest-900` | Text on secondary |
| `--success` | `olive-600` | `olive-400` | Profit, gain, positive delta (reuses brand) |
| `--destructive` | `#a04632` (terracotta) | `#c25a3f` | Loss, delete, danger |
| `--destructive-foreground` | `cornsilk-100` | `cornsilk-100` | Text on destructive |
| `--ring` | `olive-400` at 60% | `olive-300` at 60% | Focus ring |

**Why terracotta for destructive instead of pure red?** A bright Material-red would clash with the warm earthy palette and create a jarring "danger zone" feeling. Terracotta sits in the same warm family, reads clearly as loss/danger, and keeps the visual harmony intact.

---

## 3. Typography

### Font stack

| Role | Family | Source | Weights loaded |
|---|---|---|---|
| Display | **Fraunces** | next/font/google (variable, opsz axis) | 400, 500, 600 |
| Body / UI | **Inter** | next/font/google (variable) | 400, 500, 600, 700 |
| Mono | system monospace | (system) | — |

**Why this pairing:**
- **Fraunces** is a variable serif with an optical-sizing axis (`opsz`). At large sizes it shows confident contrast and subtle warmth — perfect for portfolio value displays and hero headings. At smaller sizes its proportions stay friendly, not stuffy.
- **Inter** is the cleanest, most legible UI sans-serif at small sizes and supports tabular numerals, which is non-negotiable for financial data alignment.

Loaded via `next/font/google` with `display: 'swap'` and exposed as CSS variables `--font-display` and `--font-sans`.

### Type scale

All sizes are rem-based on a 16px root. Line heights are tuned per-step (tighter at display sizes, looser at body sizes).

| Token | Size (px) | Size (rem) | Line-height | Tracking | Family | Use |
|---|---|---|---|---|---|---|
| `display-2xl` | 72 | 4.5 | 1.05 | -0.02em | Fraunces 500 | Marketing hero only |
| `display-xl` | 60 | 3.75 | 1.05 | -0.02em | Fraunces 500 | Landing hero |
| `display-lg` | 48 | 3 | 1.1 | -0.018em | Fraunces 500 | **Dashboard portfolio value** |
| `display-md` | 36 | 2.25 | 1.15 | -0.015em | Fraunces 500 | Section hero |
| `h1` | 30 | 1.875 | 1.2 | -0.01em | Inter 600 | Page title |
| `h2` | 24 | 1.5 | 1.25 | -0.01em | Inter 600 | Subsection |
| `h3` | 20 | 1.25 | 1.3 | -0.005em | Inter 600 | Card title |
| `h4` | 18 | 1.125 | 1.35 | 0 | Inter 600 | Small heading |
| `body-lg` | 17 | 1.0625 | 1.55 | 0 | Inter 400 | Important paragraph |
| `body` | 16 | 1 | 1.55 | 0 | Inter 400 | Default body |
| `body-sm` | 14 | 0.875 | 1.5 | 0 | Inter 400 | Secondary text, table cells |
| `caption` | 13 | 0.8125 | 1.45 | 0.005em | Inter 500 | Captions, metadata |
| `micro` | 12 | 0.75 | 1.4 | 0.04em uppercase | Inter 600 | Labels, eyebrows, badges |

### Number rendering rules

- Anywhere a number represents money, weight, percentage, or quantity: apply `font-variant-numeric: tabular-nums;` (Tailwind: `tabular-nums` utility).
- Portfolio value uses `display-lg` Fraunces with `font-feature-settings: "ss01"` if visually nicer (verify in browser).
- Negative numbers in tables: prefix with a minus and color `text-destructive`; positive: color `text-success`. Never use parentheses for negatives (less scannable).
- Currency symbol: always render in `--foreground-muted` so the digits stand out.

---

## 4. Spacing

Tailwind's default 4px scale. Common project-level groupings:

| Use | Tailwind |
|---|---|
| Inside a chip/badge | `px-2 py-1` |
| Inside an input/button | `px-4 py-2.5` |
| Card inner padding | `p-6` (or `p-8` for hero cards) |
| Card-to-card gap in dashboards | `gap-6` |
| Section vertical rhythm | `space-y-12` (large), `space-y-8` (medium), `space-y-4` (tight) |

---

## 5. Radii

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 4px | Small badges, chips |
| `radius-sm` | 6px | Inputs, dropdown items |
| `radius-md` | 10px | Buttons, small cards |
| `radius-lg` | 14px | Standard cards |
| `radius-xl` | 20px | Hero cards, modals |
| `radius-full` | 9999px | Avatars, pills |

shadcn variable mapping: `--radius: 0.625rem` (10px) — buttons/inputs derive from this.

---

## 6. Elevation (Shadows)

Subtle, warm. All shadow colors are tinted with `forest` (the dark brand color) rather than pure black, to keep the warm palette coherent.

| Token | Value |
|---|---|
| `shadow-sm` | `0 1px 2px 0 rgba(40, 54, 24, 0.05)` |
| `shadow` | `0 1px 3px 0 rgba(40, 54, 24, 0.08), 0 1px 2px -1px rgba(40, 54, 24, 0.05)` |
| `shadow-md` | `0 4px 6px -1px rgba(40, 54, 24, 0.08), 0 2px 4px -2px rgba(40, 54, 24, 0.05)` |
| `shadow-lg` | `0 10px 15px -3px rgba(40, 54, 24, 0.08), 0 4px 6px -4px rgba(40, 54, 24, 0.05)` |
| `shadow-xl` | `0 20px 25px -5px rgba(40, 54, 24, 0.10), 0 8px 10px -6px rgba(40, 54, 24, 0.06)` |

Use `shadow` for cards by default. Reserve `shadow-md` and above for floating elements (popovers, modals, dropdowns).

---

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 120ms | Hover state on buttons/links |
| `duration` | 200ms | Default — most transitions |
| `duration-slow` | 320ms | Sheet/modal enters, layout shifts |
| `ease` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Default ease ("standard ease-out") |

Reduce motion (`prefers-reduced-motion`) shortens all durations to 50ms and disables transform animations.

---

## 8. Iconography

- **Library:** `lucide-react` (clean, modern, paired well with shadcn/ui).
- **Size scale:** 14px (inline with body), 16px (buttons), 20px (nav, card actions), 24px (page headers).
- **Stroke:** Default `1.75` for a slightly finer, more "premium" feel than Lucide's default `2`.

---

## 9. Component Defaults

| Component | Visual rule |
|---|---|
| **Primary button** | Olive bg, cornsilk text, `radius-md`, `px-4 py-2.5`, weight 500. Hover: darken to `olive-700`. |
| **Accent button** (Add Purchase) | Copper bg, cornsilk text, same shape as primary. Use only on the highest-priority action per view. |
| **Secondary button** | Transparent bg, olive text, `border-border-strong`. Hover: `bg-olive-50`. |
| **Ghost button** | Transparent bg, foreground text. Hover: `bg-cornsilk-200`. |
| **Destructive button** | Terracotta bg, cornsilk text. Used in confirmation dialogs only. |
| **Card** | Surface bg, `radius-lg`, `shadow`, `border border-border`, `p-6`. |
| **Input** | Surface-muted bg, `radius-md`, `border border-border`. Focus: ring + `border-border-strong`. |
| **Badge** | `radius-full`, `px-2.5 py-0.5`, `micro` type, semantic color variants. |
| **Table** | No outer border. Row separators `border-border`. Hover row: `bg-surface-muted`. Numeric cells: `text-right tabular-nums`. |
| **Chart axis labels** | `caption` size, `--foreground-subtle`. |
| **Positive delta** | `text-success`, prefix `+`. |
| **Negative delta** | `text-destructive`, prefix `−` (true minus, U+2212). |

---

## 10. Accessibility Rules

- Contrast: every text-on-background pair must meet WCAG AA (4.5:1 for body, 3:1 for large/display). The brand palette has been chosen to satisfy this — but verify any combination not listed in semantic tokens before using it.
- Focus rings: 2px `--ring` ring with 2px offset on every interactive element. Never remove the focus ring; restyle it instead.
- Tap targets: minimum 44×44px for any touch-interactive element on mobile breakpoints.
- Icons that convey state (profit/loss arrows, status dots) must always be paired with text — never icon-only.

---

## 11. What This Doc Does NOT Cover (Yet)

These will be added when the relevant feature lands:

- Chart color sequences (when we build `PortfolioValueChart`)
- Empty state illustrations
- Toast/notification styling
- Dark mode color contrast verification matrix
- Email template styling
