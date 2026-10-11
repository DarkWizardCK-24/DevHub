import type { Metadata } from "next";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

// Not in proxy.ts PUBLIC_PATHS: it needs the session created by the reset link.
export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading title="Choose a new password" description="You'll stay signed in on this device." />
      <ResetPasswordForm />
    </>
  );
}
