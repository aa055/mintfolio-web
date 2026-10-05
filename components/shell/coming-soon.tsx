import { Card, CardContent } from "@/components/ui/card";

/** Temporary page body for sections that land in a later revamp step. */
export function ComingSoon({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-display-md font-medium tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      <Card>
        <CardContent className="px-6 py-12 text-center text-body-sm text-foreground-muted">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
