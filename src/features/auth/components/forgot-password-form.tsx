"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";
import { FormAlert } from "./auth-heading";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit({ email }: ForgotPasswordValues) {
    setRateLimited(false);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error?.status === 429) {
      setRateLimited(true);
      return;
    }
    // Shown whether or not the account exists, so this form can't be used
    // to find out which emails are registered.
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {sent && <FormAlert tone="success">If an account exists for that email, a reset link is on its way.</FormAlert>}
      {rateLimited && <FormAlert>Too many requests. Wait a minute, then try again.</FormAlert>}
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Send reset link
      </Button>
    </form>
  );
}
