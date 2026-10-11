import type { Metadata } from "next";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { requireProfile } from "@/lib/auth/session";
import { displayName } from "@/lib/auth/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await requireProfile(); // deduped with the layout's call
  return <DashboardView name={displayName(profile).split(" ")[0]} />;
}
