import type { Route } from "next";
import { ArrowLeftRight, Home, Layers, LineChart, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
  /** Other path prefixes that belong to this section. */
  matches?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/holdings", label: "Holdings", icon: Layers },
  // Purchase detail / edit pages sit under Transactions.
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight, matches: ["/purchases"] },
  { href: "/rates", label: "Metal rates", icon: LineChart },
];

export function isActive(item: { href: string; matches?: string[] }, pathname: string) {
  return [item.href, ...(item.matches ?? [])].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
