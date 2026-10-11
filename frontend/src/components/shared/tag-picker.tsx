"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { refresh, useApi } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAG_COLORS = ["#F25F5C", "#FFAA33", "#3CCB9A", "#5CB2F0", "#8B8FFF", "#E86FD6"];

export function TagChip({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs font-medium"
      style={{ color: tag.color, borderColor: `${tag.color}55`, backgroundColor: `${tag.color}14` }}
    >
      #{tag.name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${tag.name}`} className="-mr-0.5 rounded-full p-0.5 hover:bg-black/10">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

/** Pick existing tags or create one by typing a new name and pressing Enter. */
export function TagPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const { data: tags = [] } = useApi<Tag[]>("/tags");
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = tags.filter((t) => value.includes(t.id));
  const available = tags.filter((t) => !value.includes(t.id) && t.name.toLowerCase().includes(draft.trim().toLowerCase()));
  const exact = tags.find((t) => t.name.toLowerCase() === draft.trim().toLowerCase());

  async function create() {
    const name = draft.trim();
    if (!name) return;
    if (exact) {
      if (!value.includes(exact.id)) onChange([...value, exact.id]);
      setDraft("");
      return;
    }
    setCreating(true);
    try {
      const tag = await api.post<Tag>("/tags", { name, color: TAG_COLORS[tags.length % TAG_COLORS.length] });
      await refresh("/tags");
      onChange([...value, tag.id]);
      setDraft("");
    } catch (error) {
      toast.error("Tag not created", { description: errorMessage(error) });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <span className="text-[13px] font-medium">Tags</span>
      <div className="rounded-[var(--radius-control)] border border-line bg-surface-2 p-2 focus-within:border-accent">
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.map((tag) => (
            <TagChip key={tag.id} tag={tag} onRemove={() => onChange(value.filter((id) => id !== tag.id))} />
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                create();
              }
            }}
            maxLength={40}
            placeholder={selected.length ? "Add tag" : "Type to find or create a tag"}
            aria-label="Add tag"
            disabled={creating}
            className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm placeholder:text-faint focus:outline-none"
          />
        </div>
        {(draft || available.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-2">
            {available.slice(0, 12).map((tag) => (
              <button key={tag.id} type="button" onClick={() => onChange([...value, tag.id])} className="opacity-80 hover:opacity-100">
                <TagChip tag={tag} />
              </button>
            ))}
            {draft.trim() && !exact && (
              <button
                type="button"
                onClick={create}
                disabled={creating}
                className={cn("inline-flex h-6 items-center gap-1 rounded-full border border-dashed border-line-strong px-2 text-xs text-muted hover:text-ink")}
              >
                <Plus className="size-3" /> Create &ldquo;{draft.trim()}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
