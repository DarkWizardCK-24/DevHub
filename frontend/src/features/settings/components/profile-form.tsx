"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { UserAvatar } from "@/components/shell/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { TextAreaField, TextField } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api/client";
import { useProfile } from "@/lib/auth/profile-context";
import { displayName, type Profile } from "@/lib/auth/types";

// Mirrors backend ProfileUpdate limits so users see errors before submitting.
const schema = z.object({
  full_name: z.string().trim().max(120, "Use 120 characters or fewer"),
  bio: z.string().trim().max(500, "Use 500 characters or fewer"),
  avatar_url: z.union([z.literal(""), z.string().trim().url("Enter a full URL starting with https://")]),
  timezone: z.string().min(1),
});
type Values = z.infer<typeof schema>;

export function ProfileForm() {
  const router = useRouter();
  const { profile, setProfile } = useProfile();
  // Browsers' lists can omit "UTC" (the profile default), so always include the current value.
  const timezones = useMemo(() => {
    const zones = Intl.supportedValuesOf("timeZone");
    return zones.includes(profile.timezone) ? zones : [profile.timezone, ...zones];
  }, [profile.timezone]);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      bio: profile.bio ?? "",
      avatar_url: profile.avatar_url ?? "",
      timezone: profile.timezone,
    },
  });

  async function onSubmit(values: Values) {
    try {
      const updated = await api.patch<Profile>("/me", {
        full_name: values.full_name || null,
        bio: values.bio || null,
        avatar_url: values.avatar_url || null,
        timezone: values.timezone,
      });
      setProfile(updated);
      reset(values);
      toast.success("Profile saved");
      router.refresh(); // re-render server components that show the name
    } catch (error) {
      if (error instanceof ApiError && error.code === "validation_error") {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof Values, { message });
        }
        return;
      }
      toast.error("Profile not saved", { description: error instanceof Error ? error.message : undefined });
    }
  }

  // useWatch (not watch) so React Compiler can still optimize this component.
  const [watchedName, watchedAvatar] = useWatch({ control, name: ["full_name", "avatar_url"] });
  const previewName = watchedName || displayName(profile);

  return (
    <Card>
      <CardHeader title="Profile" />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 px-5 pb-5">
        <div className="flex items-center gap-4 rounded-[var(--radius-control)] bg-surface-2 p-3">
          <UserAvatar name={previewName} src={watchedAvatar || null} className="size-14 text-lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{previewName}</p>
            <p className="truncate text-sm text-muted">{profile.email}</p>
          </div>
        </div>
        <TextField label="Name" autoComplete="name" error={errors.full_name?.message} {...register("full_name")} />
        <TextField label="Avatar URL" type="url" placeholder="https://…" error={errors.avatar_url?.message} {...register("avatar_url")} />
        <TextAreaField label="Bio" rows={3} placeholder="What are you building?" error={errors.bio?.message} {...register("bio")} />
        <div className="space-y-1.5">
          <label htmlFor="timezone" className="text-[13px] font-medium">
            Time zone
          </label>
          <select
            id="timezone"
            className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface-2 px-3 text-[15px] focus:border-accent focus:outline-none md:text-sm"
            {...register("timezone")}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end pt-1">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty} className="w-full md:w-auto">
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  );
}
