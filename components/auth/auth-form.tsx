"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/lib/auth/actions";

type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

interface AuthFormProps {
  action: AuthAction;
  submitLabel: string;
  variant?: "primary" | "accent";
  passwordHint?: string;
  passwordMinLength?: number;
}

function SubmitButton({
  label,
  variant = "primary",
}: {
  label: string;
  variant?: "primary" | "accent";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      className="w-full"
      disabled={pending}
    >
      {pending ? "Working…" : label}
      {!pending && <ArrowRight />}
    </Button>
  );
}

export function AuthForm({
  action,
  submitLabel,
  variant = "primary",
  passwordHint,
  passwordMinLength = 8,
}: AuthFormProps) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={submitLabel === "Sign in" ? "current-password" : "new-password"}
          required
          minLength={passwordMinLength}
          placeholder="••••••••"
        />
        {passwordHint ? (
          <p className="text-caption text-foreground-subtle">{passwordHint}</p>
        ) : null}
      </div>

      {state && !state.ok ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-body-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton label={submitLabel} variant={variant} />
    </form>
  );
}
