import Link from "next/link";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupSuccessPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-md bg-olive-100 text-olive-800">
          <Mail className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <CardTitle className="font-display text-h1 font-medium tracking-tight">
          Check your email
        </CardTitle>
        <CardDescription>
          We sent you a verification link. Click it to activate your account,
          then come back to sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
