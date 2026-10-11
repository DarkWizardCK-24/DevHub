import type { Metadata } from "next";
import { NoteEditor } from "@/features/notes/note-editor";

export const metadata: Metadata = { title: "Note" };

export default async function NotePage({ params }: PageProps<"/notes/[id]">) {
  const { id } = await params;
  return <NoteEditor key={id} noteId={id} />;
}
