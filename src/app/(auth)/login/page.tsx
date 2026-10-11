import type { Metadata } from "next";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <>
      <AuthHeading title="Welcome back" description="Sign in to your DevHub workspace." />
      <LoginForm next={typeof next === "string" ? next : undefined} error={typeof error === "string" ? error : undefined} />
      <p className="mt-8 text-center text-[13px] font-medium text-muted">
        Accounts are created by your workspace administrator.
      </p>
    </>
  );
}
