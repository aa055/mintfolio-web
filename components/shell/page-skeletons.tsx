import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A grey placeholder block; pulses (briefly, with reduced motion). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-surface-muted", className)} />;
}

/** Announces loading once to screen readers; the blocks themselves are hidden. */
function Loading({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading {label}…</span>
      {children}
    </div>
  );
}

function Heading({ wide = false }: { wide?: boolean }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className={cn("h-9", wide ? "w-80 max-w-full" : "w-56")} />
    </div>
  );
}

function CardBlock({ className }: { className?: string }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className={cn("h-7 w-32", className)} />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function Rows({ count }: { count: number }) {
  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Chart() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="h-64 w-full sm:h-72" />
      </CardContent>
    </Card>
  );
}

export function HomeSkeleton() {
  return (
    <Loading label="your portfolio">
      <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
        <Heading wide />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 w-40" />
          <Skeleton className="h-24 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <CardBlock key={i} />
        ))}
      </div>
      <Chart />
    </Loading>
  );
}

export function HoldingsSkeleton() {
  return (
    <Loading label="holdings">
      <Heading />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CardBlock />
        <CardBlock />
      </div>
      <Skeleton className="h-10 w-full" />
      <Rows count={5} />
    </Loading>
  );
}

export function TransactionsSkeleton() {
  return (
    <Loading label="transactions">
      <Heading wide />
      <Skeleton className="h-10 w-full max-w-xl" />
      <Rows count={6} />
    </Loading>
  );
}

export function RatesSkeleton() {
  return (
    <Loading label="metal rates">
      <Heading wide />
      <Skeleton className="h-10 w-40" />
      <CardBlock className="h-10 w-48" />
      <Chart />
    </Loading>
  );
}

export function PurchaseSkeleton() {
  return (
    <Loading label="purchase">
      <Skeleton className="h-8 w-32" />
      <div className="flex justify-between gap-4">
        <Heading />
        <Skeleton className="h-10 w-40" />
      </div>
      <Rows count={3} />
      <Card>
        <CardContent className="flex gap-3 p-6">
          <Skeleton className="h-24 w-24" />
          <Skeleton className="h-24 w-24" />
        </CardContent>
      </Card>
    </Loading>
  );
}

/** Settings, Profile and the purchase form: a heading over form cards. */
export function FormSkeleton({ label, cards = 2 }: { label: string; cards?: number }) {
  return (
    <Loading label={label}>
      <div className="mx-auto max-w-2xl space-y-8">
        <Heading />
        {Array.from({ length: cards }, (_, i) => (
          <Card key={i}>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-5 w-36" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Loading>
  );
}
