import { redirect } from "next/navigation";

import { MobileTabBar } from "@/components/shell/mobile-tab-bar";
import { BrandMark, Sidebar } from "@/components/shell/sidebar";
import { UserMenu, type MenuUser } from "@/components/shell/user-menu";
import { getMe } from "@/lib/me";
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

  // Profile from the API when available; Supabase metadata (set at signup
  // or by Google) as the fallback so the shell renders even if the API is down.
  const me = await getMe().catch(() => null);
  const meta = user.user_metadata as Record<string, string | undefined>;
  const menuUser: MenuUser = {
    name: me?.user.display_name ?? meta.full_name ?? meta.name ?? null,
    email: user.email ?? me?.user.email ?? "",
    avatarUrl: me?.user.avatar_url ?? meta.avatar_url ?? meta.picture ?? null,
  };

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-surface px-3 py-2 text-body-sm font-medium focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="sm:pl-16 lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-surface/90 px-4 backdrop-blur sm:justify-end sm:px-6 lg:px-8">
          <div className="sm:hidden">
            <BrandMark />
          </div>
          <UserMenu user={menuUser} />
        </header>

        <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pb-12 lg:px-8">
          {children}
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}
