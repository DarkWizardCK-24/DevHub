import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Reset your password" description="Enter your account email and we'll send you a link to choose a new password." />
      <ForgotPasswordForm />
      <Link href="/login" className="mt-8 flex items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </>
  );
}
