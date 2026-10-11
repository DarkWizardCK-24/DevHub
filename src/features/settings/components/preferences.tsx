"use client";

import Link from "next/link";
import { KeyRound, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { useTheme, type Theme } from "@/components/theme/use-theme";
import { useSignOut } from "@/hooks/use-sign-out";
import { useProfile } from "@/lib/auth/profile-context";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <Card>
      <CardHeader title="Appearance" icon={<Monitor />} />
      <div className="grid grid-cols-2 gap-3 px-5 pb-5" role="radiogroup" aria-label="Theme">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={theme === value}
            onClick={() => setTheme(value)}
            className={cn(
              "overflow-hidden rounded-[var(--radius-control)] border-2 text-left transition-colors",
              theme === value ? "border-accent" : "border-line hover:border-line-strong",
            )}
          >
            {/* Mini preview of each theme, using fixed colors on purpose. */}
            <div className={cn("flex h-16 gap-1.5 p-2", value === "dark" ? "bg-[#0e131f]" : "bg-[#f2f4f9]")}>
              <div className={cn("w-5 rounded", value === "dark" ? "bg-[#151b2a]" : "bg-white")} />
              <div className={cn("flex-1 space-y-1.5 rounded p-1.5", value === "dark" ? "bg-[#151b2a]" : "bg-white")}>
                <div className="h-1.5 w-2/3 rounded-full bg-[#ffaa33]" />
                <div className={cn("h-1.5 w-full rounded-full", value === "dark" ? "bg-[#242c40]" : "bg-[#e1e5ee]")} />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
              <Icon className="size-4" /> {label}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

export function AccountCard() {
  const { profile } = useProfile();
  const { signOut, signingOut } = useSignOut();

  return (
    <Card>
      <CardHeader title="Account" icon={<KeyRound />} />
      <dl className="divide-y divide-line px-5 text-sm">
        <div className="flex items-center justify-between py-3">
          <dt className="text-muted">Email</dt>
          <dd className="truncate pl-4 font-medium">{profile.email}</dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-muted">Role</dt>
          <dd>
            <Badge tone={profile.role === "admin" ? "iris" : "neutral"}>{profile.role === "admin" ? "Admin" : "User"}</Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-muted">Member since</dt>
          <dd className="font-medium">{formatDate(profile.created_at, { dateStyle: "medium" })}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-2 p-5 pt-3 md:flex-row">
        <Link href="/reset-password" className={cn(buttonStyles({ variant: "secondary" }), "flex-1")}>
          Change password
        </Link>
        <Button variant="secondary" className="flex-1 text-coral" onClick={signOut} loading={signingOut}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </Card>
  );
}
