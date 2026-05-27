import Link from "next/link";
import { Coins } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Coins className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="font-display text-h3 font-medium tracking-tight">
              Mintfolio
            </span>
          </Link>
        </div>
      </header>
      <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        {children}
      </main>
    </div>
  );
}
