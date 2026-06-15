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
import { signupAction } from "@/lib/auth/actions";

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-h1 font-medium tracking-tight">
          Create your portfolio
        </CardTitle>
        <CardDescription>
          Start tracking your gold and silver in a calmer place than a spreadsheet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleButton label="Sign up with Google" />

        <Divider>or</Divider>

        <AuthForm
          action={signupAction}
          submitLabel="Create account"
          variant="accent"
          passwordHint="At least 8 characters."
          passwordMinLength={8}
        />

        <p className="text-center text-caption text-foreground-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
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
