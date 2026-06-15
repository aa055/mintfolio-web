import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginAction } from "@/lib/auth/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirmed?: string }>;
}) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-h1 font-medium tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription>Sign in to your Mintfolio portfolio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Banner promise={searchParams} />

        <GoogleButton label="Sign in with Google" />

        <Divider>or</Divider>

        <AuthForm
          action={loginAction}
          submitLabel="Sign in"
          variant="primary"
        />

        <p className="text-center text-caption text-foreground-muted">
          New to Mintfolio?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

async function Banner({
  promise,
}: {
  promise: Promise<{ error?: string; confirmed?: string }>;
}) {
  const params = await promise;
  if (params.confirmed) {
    return (
      <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-body-sm text-success">
        Email confirmed — sign in to continue.
      </p>
    );
  }
  if (params.error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-body-sm text-destructive">
        {params.error}
      </p>
    );
  }
  return null;
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-center">
      <div className="flex-1 border-t border-border" />
      <span className="px-3 text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
        {children}
      </span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}
