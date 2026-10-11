import type { Metadata } from "next";
import { LinksView } from "@/features/links/links-view";

export const metadata: Metadata = { title: "Links" };

export default async function LinksPage({ searchParams }: PageProps<"/links">) {
  const { new: openNew } = await searchParams;
  return <LinksView openNew={openNew === "1"} />;
}
