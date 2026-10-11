import type { Metadata } from "next";
import { SnippetsView } from "@/features/snippets/snippets-view";

export const metadata: Metadata = { title: "Snippets" };

export default async function SnippetsPage({ searchParams }: PageProps<"/snippets">) {
  const { new: openNew, snippet } = await searchParams;
  return <SnippetsView openNew={openNew === "1"} openSnippetId={typeof snippet === "string" ? snippet : undefined} />;
}
