import { File, FileArchive, FileCode, FileImage, FileText, NotebookText, Package, PenTool } from "lucide-react";
import type { FileCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<FileCategory, { icon: typeof File; tone: string }> = {
  screenshot: { icon: FileImage, tone: "bg-sky-soft text-sky" },
  pdf: { icon: FileText, tone: "bg-coral-soft text-coral" },
  markdown: { icon: NotebookText, tone: "bg-iris-soft text-iris" },
  code: { icon: FileCode, tone: "bg-mint-soft text-mint" },
  design: { icon: PenTool, tone: "bg-accent-soft text-accent" },
  documentation: { icon: FileText, tone: "bg-iris-soft text-iris" },
  build_artifact: { icon: Package, tone: "bg-accent-soft text-accent" },
  other: { icon: FileArchive, tone: "bg-raised text-muted" },
};

export function FileIcon({ category, className }: { category: FileCategory; className?: string }) {
  const { icon: Icon, tone } = ICONS[category];
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tone, className)}>
      <Icon className="size-5" />
    </span>
  );
}
