"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api/client";
import type { Profile } from "@/lib/auth/types";

const schema = z.object({
  fullName: z.string().trim().max(120, "Use 120 characters or fewer"),
  email: z.string().trim().min(1, "Enter an email").email("Enter a valid email address"),
  password: z.string().min(6, "Use at least 6 characters").max(72, "Use 72 characters or fewer"),
  role: z.enum(["user", "admin"]),
});
type Values = z.infer<typeof schema>;

export function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (profile: Profile) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { fullName: "", email: "", password: "", role: "user" } });

  async function onSubmit(values: Values) {
    try {
      const created = await api.post<Profile>("/admin/users", {
        email: values.email,
        password: values.password,
        full_name: values.fullName || null,
        role: values.role,
      });
      toast.success("Account created", { description: `${created.email} can sign in now.` });
      reset();
      onCreated(created);
      onClose();
    } catch (err) {
      setError("email", { message: (err as Error).message });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create user" description="Share the email and password with them. They sign in on the login page.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <TextField label="Full name" autoComplete="off" error={errors.fullName?.message} {...register("fullName")} />
        <TextField label="Email" type="email" autoComplete="off" error={errors.email?.message} {...register("email")} />
        <TextField label="Temporary password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
        <label className="block space-y-1.5">
          <span className="text-xs font-medium tracking-tight text-ink">Role</span>
          <select
            {...register("role")}
            className="h-9 w-full rounded-[var(--radius-control)] border border-line/80 bg-surface px-3 text-xs text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create account
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ResetPasswordDialog({ user, onClose }: { user: Profile | null; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ password: string }>({
    resolver: zodResolver(z.object({ password: schema.shape.password })),
    defaultValues: { password: "" },
  });

  async function onSubmit({ password }: { password: string }) {
    if (!user) return;
    try {
      await api.post(`/admin/users/${user.id}/password`, { password });
      toast.success("Password updated", { description: user.email });
      reset();
      onClose();
    } catch (err) {
      setError("password", { message: (err as Error).message });
    }
  }

  return (
    <Modal open={user !== null} onClose={onClose} title="Reset password" description={user?.email}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <TextField label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Update password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
