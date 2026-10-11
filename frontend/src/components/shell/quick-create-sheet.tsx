"use client";

import Link from "next/link";
import { CodeXml, FolderPlus, KeyRound, Link2, ListPlus, NotebookPen, Package } from "lucide-react";
import { Modal } from "@/components/ui/modal";

// Each page opens its create form when it sees ?new=1.
const ACTIONS = [
  { label: "Task", hint: "Something to do", href: "/tasks?new=1", icon: ListPlus, tone: "bg-accent-soft text-accent" },
  { label: "Project", hint: "A new thing to build", href: "/projects?new=1", icon: FolderPlus, tone: "bg-iris-soft text-iris" },
  { label: "Note", hint: "Markdown doc", href: "/notes?new=1", icon: NotebookPen, tone: "bg-sky-soft text-sky" },
  { label: "Snippet", hint: "Code to reuse", href: "/snippets?new=1", icon: CodeXml, tone: "bg-mint-soft text-mint" },
  { label: "Link", hint: "URL to remember", href: "/links?new=1", icon: Link2, tone: "bg-raised text-ink" },
  { label: "Build", hint: "Record a release", href: "/builds?new=1", icon: Package, tone: "bg-accent-soft text-accent" },
  { label: "Credential", hint: "Key or login", href: "/vault?new=1", icon: KeyRound, tone: "bg-coral-soft text-coral" },
];

export function QuickCreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Create">
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {ACTIONS.map(({ label, hint, href, icon: Icon, tone }) => (
          <li key={label}>
            <Link href={href} onClick={onClose} className="flex w-full items-center gap-3.5 rounded-[var(--radius-control)] px-2 py-2.5 hover:bg-raised active:bg-raised">
              <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold tracking-tight text-ink">{label}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
