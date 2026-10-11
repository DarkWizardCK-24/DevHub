"use client";

import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { useSignOut } from "@/hooks/use-sign-out";

/**
 * Shown instead of the app shell when the API refuses or can't be reached for the signed-in user.
 * The message is passed in as plain props, so it survives production builds (unlike a thrown error).
 */
export function SessionProblem({ status, message, requestId }: { status: number; message: string; requestId?: string }) {
  const router = useRouter();
  const { signOut, signingOut } = useSignOut();

  const title =
    status === 403 ? "Your account can't be used yet" : status === 0 ? "Can't reach the DevHub API" : "DevHub couldn't load";
  const hint =
    status === 403
      ? "Ask an administrator to activate your account, or sign in with a different one."
      : status === 0
        ? "The API may be waking up. Wait a few seconds and try again."
        : requestId
          ? `Reference: ${requestId}`
          : undefined;

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-md text-center">
        <LogoMark className="mx-auto size-11" />
        <ErrorState title={title} message={hint ? `${message} ${hint}` : message} onRetry={() => router.refresh()} />
        <Button variant="ghost" loading={signingOut} onClick={signOut}>
          Sign out
        </Button>
      </div>
    </main>
  );
}
