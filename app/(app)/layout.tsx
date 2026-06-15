import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-surface">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Coins className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="font-display text-h3 font-medium tracking-tight">
              Mintfolio
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <span className="hidden text-caption text-foreground-muted sm:inline">
              {user.email}
            </span>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="container py-10">{children}</main>
    </div>
  );
}
