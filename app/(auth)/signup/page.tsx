import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        <p className="rounded-md border border-border bg-surface-muted px-4 py-3 text-body-sm text-foreground-muted">
          Supabase Auth wiring coming next — this page is a placeholder so the
          design system has somewhere to land.
        </p>
        <Button variant="accent" className="w-full" disabled>
          Continue with Google
        </Button>
        <Button variant="outline" className="w-full" disabled>
          Continue with email
        </Button>
        <p className="text-center text-caption text-foreground-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
