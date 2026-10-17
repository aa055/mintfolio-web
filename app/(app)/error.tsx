"use client";

import { useEffect } from "react";
import { CircleAlert, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown inside the app shell when a page fails to load — usually the API
 * being unreachable. The sidebar stays, so the user can go elsewhere too.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] page failed:", error);
  }, [error]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-muted text-destructive">
          <CircleAlert className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-h3 font-semibold text-foreground">Something went wrong loading this page</h1>
        <p className="max-w-md text-body-sm text-foreground-muted">
          Your data is safe. This is usually a brief connection problem with the server — try again
          in a moment.
        </p>
        {error.digest ? (
          <p className="text-caption text-foreground-subtle">Reference: {error.digest}</p>
        ) : null}
        <Button variant="accent" className="mt-2" onClick={reset}>
          <RotateCcw />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
