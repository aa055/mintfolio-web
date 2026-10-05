"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LogOut, Settings, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export interface MenuUser {
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

function initials(user: MenuUser) {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (user.name ? (parts[1]?.[0] ?? "") : "")).toUpperCase() || "?";
}

export function UserAvatar({ user, className }: { user: MenuUser; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-caption font-semibold text-primary",
        className,
      )}
    >
      {user.avatarUrl ? (
        // Google avatars refuse requests that send a referrer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        initials(user)
      )}
    </span>
  );
}

export function UserMenu({ user }: { user: MenuUser }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Account menu"
      >
        <UserAvatar user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <p className="truncate text-body-sm font-medium text-foreground">
            {user.name || "Your account"}
          </p>
          <p className="truncate text-caption text-foreground-muted">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onSelect={() => startTransition(() => logoutAction())}
        >
          <LogOut />
          {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
