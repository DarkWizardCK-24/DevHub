"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "./button";

/** Says what failed and offers a retry. Errors explain; they don't apologize. */
export function ErrorState({
  title = "This section didn't load",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-coral-soft text-coral">
        <TriangleAlert className="size-5" />
      </span>
      <h3 className="font-sans text-base font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-muted">{message ?? "Check your connection, then try again."}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
