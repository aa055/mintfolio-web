"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { isActive, NAV_ITEMS, type NavItem } from "@/components/shell/nav";
import { cn } from "@/lib/utils";

const SHORT_LABEL: Record<string, string> = { "/rates": "Rates" };

/** Phone navigation (<640px): four sections with a raised Add button in the middle. */
export function MobileTabBar() {
  const pathname = usePathname();
  const [home, holdings, transactions, rates] = NAV_ITEMS;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="grid grid-cols-5">
        <Tab item={home} pathname={pathname} />
        <Tab item={holdings} pathname={pathname} />
        <li className="flex justify-center">
          <Link
            href="/purchases/new"
            className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg ring-4 ring-background focus-visible:outline-none focus-visible:ring-ring"
          >
            <Plus className="h-6 w-6" aria-hidden />
            <span className="sr-only">Add purchase</span>
          </Link>
        </li>
        <Tab item={transactions} pathname={pathname} />
        <Tab item={rates} pathname={pathname} />
      </ul>
    </nav>
  );
}

function Tab({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(item, pathname);
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          active ? "text-primary" : "text-foreground-muted",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
        {SHORT_LABEL[item.href] ?? item.label}
      </Link>
    </li>
  );
}
