import type { Metadata } from "next";
import { BuildsView } from "@/features/builds/builds-view";

export const metadata: Metadata = { title: "Builds" };

export default async function BuildsPage({ searchParams }: PageProps<"/builds">) {
  const { new: openNew } = await searchParams;
  return <BuildsView openNew={openNew === "1"} />;
}
