"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { googleLoginAction } from "@/lib/auth/actions";

export function GoogleButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={() => startTransition(() => googleLoginAction())}
    >
      <GoogleMark className="h-4 w-4" />
      {pending ? "Redirecting…" : label}
    </Button>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.8h5.3c-.2 1.4-1.6 4-5.3 4-3.2 0-5.8-2.6-5.8-5.9S8.8 6.2 12 6.2c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.7 3.9 14.6 3 12 3 6.9 3 2.8 7.1 2.8 12.1S6.9 21.2 12 21.2c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12z"
      />
    </svg>
  );
}
