import type { Metadata } from "next";
import { NotesView } from "@/features/notes/notes-view";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage({ searchParams }: PageProps<"/notes">) {
  const { new: openNew } = await searchParams;
  return <NotesView openNew={openNew === "1"} />;
}
