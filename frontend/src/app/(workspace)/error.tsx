"use client";

import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";

/** Page-level error boundary: the shell stays usable if one page fails. */
export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card>
      <ErrorState title="This page hit an error" message={error.message || undefined} onRetry={reset} />
    </Card>
  );
}
