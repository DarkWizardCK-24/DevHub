"use client";

import { CheckCircle2, CloudUpload, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { refresh } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { StoredFile } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";

const MAX_BYTES = 50 * 1024 * 1024; // matches the bucket / API limit

interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  state: "uploading" | "done" | "error";
  error?: string;
}

/** Drag files in (or tap to choose). Each file uploads with its own progress bar. */
export function UploadZone({ projectId }: { projectId?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);

  const patch = (id: string, changes: Partial<UploadItem>) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...changes } : it)));

  async function uploadAll(files: FileList | File[]) {
    const list = Array.from(files);
    for (const file of list) {
      const id = crypto.randomUUID();
      if (file.size > MAX_BYTES) {
        setItems((prev) => [...prev, { id, name: file.name, size: file.size, progress: 0, state: "error", error: "Larger than 50 MB" }]);
        continue;
      }
      setItems((prev) => [...prev, { id, name: file.name, size: file.size, progress: 0, state: "uploading" }]);
      const form = new FormData();
      form.append("file", file);
      if (projectId) form.append("project_id", projectId);
      try {
        await api.upload<StoredFile>("/files", form, (progress) => patch(id, { progress }));
        patch(id, { state: "done", progress: 100 });
        setTimeout(() => setItems((prev) => prev.filter((it) => it.id !== id)), 2500);
      } catch (error) {
        patch(id, { state: "error", error: errorMessage(error) });
      }
    }
    await refresh("/files", "/projects", "/dashboard", "/activity");
    if (list.length > 1) toast.success(`Uploaded ${list.length} files`);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) uploadAll(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-accent bg-accent-soft/50" : "border-line-strong bg-surface hover:border-accent/60",
        )}
      >
        <motion.span animate={dragging ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }} className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
          <CloudUpload className="size-6" />
        </motion.span>
        <span className="font-semibold">
          <span className="hidden md:inline">Drop files here or </span>
          <span className="text-accent">choose files</span>
        </span>
        <span className="text-sm text-muted">Screenshots, PDFs, designs, docs, builds. Up to 50 MB each.</span>
      </button>
      <input ref={input} type="file" multiple hidden onChange={(e) => e.target.files && (uploadAll(e.target.files), (e.target.value = ""))} />

      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2.5">
              {item.state === "done" ? <CheckCircle2 className="size-5 text-mint" /> : item.state === "error" ? <XCircle className="size-5 text-coral" /> : <CloudUpload className="size-5 text-accent" />}
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{item.name}</span>
                  <span className="shrink-0 text-xs text-faint">{item.state === "error" ? item.error : `${formatBytes(item.size)} · ${item.progress}%`}</span>
                </div>
                {item.state !== "error" && (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised">
                    <div className={cn("h-full rounded-full transition-[width]", item.state === "done" ? "bg-mint" : "bg-accent")} style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>
              {item.state === "error" && (
                <button type="button" onClick={() => setItems((prev) => prev.filter((it) => it.id !== item.id))} className="text-xs text-muted hover:text-ink">
                  Dismiss
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
