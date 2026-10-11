"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { api } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, safeNext, type LoginValues } from "../schemas";
import { FormAlert } from "./auth-heading";

const LINK_ERRORS: Record<string, string> = {
  link_invalid: "That sign-in link is invalid or has expired. Request a new one.",
};

export function LoginForm({ next, error: initialError }: { next?: string; error?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(initialError ? (LINK_ERRORS[initialError] ?? null) : null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const { error } = await createClient().auth.signInWithPassword(values);
    if (error) {
      // Same message for "no such user" and "wrong password", so the form
      // doesn't reveal which emails have accounts.
      setFormError(
        error.code === "email_not_confirmed"
          ? "Confirm your email first: check your inbox for the link we sent."
          : error.status === 429
            ? "Too many attempts. Wait a minute, then try again."
            : "Email or password is incorrect.",
      );
      return;
    }
    // Audit the sign-in; never block the user if the API is unreachable.
    await api.post("/activity/auth", { event: "login" }).catch(() => undefined);
    router.replace(safeNext(next));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {formError && <FormAlert>{formError}</FormAlert>}
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        trailingLabel={
          <Link href="/forgot-password" className="text-[13px] font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        }
        {...register("password")}
      />
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}
