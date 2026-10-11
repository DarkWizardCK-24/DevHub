import type { Metadata } from "next";
import { FilesView } from "@/features/files/files-view";

export const metadata: Metadata = { title: "Files" };

export default function FilesPage() {
  return <FilesView />;
}
