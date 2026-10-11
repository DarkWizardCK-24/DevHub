"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas";
import { FormAlert } from "./auth-heading";

/**
 * Reached from the reset email: /auth/callback has already exchanged the
 * link for a session, so updateUser() is allowed to change the password.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit({ password }: ResetPasswordValues) {
    setFormError(null);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setFormError(error.code === "same_password" ? "Choose a password you haven't used before." : error.message);
      return;
    }
    toast.success("Password updated");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {formError && <FormAlert>{formError}</FormAlert>}
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}
