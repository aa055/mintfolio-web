import Link from "next/link";
import { Coins } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground">
          <Coins className="h-6 w-6" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-6 text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
          404
        </p>
        <h1 className="mt-2 font-display text-display-md font-medium tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-body text-foreground-muted">
          This page doesn&apos;t exist, or the purchase it showed has been deleted.
        </p>
        <Button asChild variant="accent" className="mt-6">
          <Link href="/dashboard">Back to Home</Link>
        </Button>
      </div>
    </main>
  );
}
