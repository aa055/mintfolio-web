import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-h1 font-medium tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription>
          Sign in to your Mintfolio portfolio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="rounded-md border border-border bg-surface-muted px-4 py-3 text-body-sm text-foreground-muted">
          Supabase Auth wiring coming next — this page is a placeholder so the
          design system has somewhere to land.
        </p>
        <Button variant="outline" className="w-full" disabled>
          Continue with Google
        </Button>
        <Button variant="primary" className="w-full" disabled>
          Continue with email
        </Button>
        <p className="text-center text-caption text-foreground-muted">
          New to Mintfolio?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
