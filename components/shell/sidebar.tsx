"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { Coins, Plus, Settings, type LucideIcon } from "lucide-react";

import { isActive, NAV_ITEMS } from "@/components/shell/nav";
import { cn } from "@/lib/utils";

/** Logo + wordmark; the wordmark hides when `compact`. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2" aria-label="Mintfolio home">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
        <Coins className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span
        className={cn("font-display text-h3 font-medium tracking-tight", compact && "hidden lg:inline")}
      >
        Mintfolio
      </span>
    </Link>
  );
}

/**
 * Desktop navigation. Icon rail from 640px (labels appear as tooltips),
 * full width with labels from 1024px. Phones use MobileTabBar instead.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r border-border bg-surface sm:flex lg:w-60">
      <div className="flex h-16 items-center justify-center border-b border-border px-3 lg:justify-start lg:px-5">
        <BrandMark compact />
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 p-2 lg:p-3">
        <Link
          href="/purchases/new"
          className={cn(
            "group relative mb-3 flex h-10 items-center justify-center gap-2 rounded-md bg-accent text-body-sm font-medium text-accent-foreground shadow-sm",
            "transition-colors hover:bg-copper-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span className="sr-only lg:not-sr-only">Add purchase</span>
          <RailTooltip label="Add purchase" />
        </Link>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item, pathname)}
          />
        ))}

        <div className="mt-auto">
          <NavLink
            href="/settings"
            label="Settings"
            icon={Settings}
            active={isActive({ href: "/settings" }, pathname)}
          />
        </div>
      </nav>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: Route;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center justify-center gap-3 rounded-md px-3 text-body-sm font-medium transition-colors lg:justify-start",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/10 text-primary"
          : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="sr-only lg:not-sr-only">{label}</span>
      <RailTooltip label={label} />
    </Link>
  );
}

/** Label shown beside an icon-only rail item on hover/focus (640–1023px). */
function RailTooltip({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1 text-caption font-medium text-foreground shadow-sm group-hover:block group-focus-visible:block lg:!hidden"
    >
      {label}
    </span>
  );
}
