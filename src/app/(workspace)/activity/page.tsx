import type { Metadata } from "next";
import { ActivityTimeline } from "@/features/activity/activity-timeline";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return <ActivityTimeline />;
}
