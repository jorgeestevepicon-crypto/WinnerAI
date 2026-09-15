"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Technical details go to the server console via digest correlation —
    // never shown to the user directly.
    console.error("Unhandled error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We hit an unexpected error. It&apos;s been logged — try again, and if it keeps happening, let us know what you were doing.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
