"use client";

import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Card>
      <ErrorState title="Admin data didn't load" message={error.message || undefined} onRetry={reset} />
    </Card>
  );
}
