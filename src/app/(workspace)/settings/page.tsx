import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { AccountCard, AppearanceCard } from "@/features/settings/components/preferences";
import { ProfileForm } from "@/features/settings/components/profile-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Your profile, appearance and account." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <ProfileForm />
        <div className="space-y-5">
          <AppearanceCard />
          <AccountCard />
        </div>
      </div>
    </>
  );
}
