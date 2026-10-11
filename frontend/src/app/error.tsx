"use client";

import { LogoMark } from "@/components/shell/logo";
import { ErrorState } from "@/components/ui/error-state";

/**
 * Catches errors thrown while rendering layouts, e.g. the workspace layout
 * when the API is down or the account is deactivated.
 */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-md text-center">
        <LogoMark className="mx-auto size-11" />
        <ErrorState title="DevHub couldn't load" message={error.message || "Check that the API is running, then try again."} onRetry={reset} />
      </div>
    </main>
  );
}
