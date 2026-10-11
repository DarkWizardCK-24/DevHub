"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "./account-menu";
import { QuickCreateSheet } from "./quick-create-sheet";

/** Desktop-only top bar: global search (Ctrl/⌘ K), quick create, theme and account. */
export function TopBar() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <header className="sticky top-0 z-30 hidden h-15 items-center gap-4 border-b border-line/50 glass px-6 md:flex lg:px-8">
      <Link
        href="/search"
        className="flex h-9 w-full max-w-sm items-center gap-2.5 rounded-full border border-line/80 bg-surface/80 px-3 text-xs text-muted shadow-xs transition-all hover:border-line-strong hover:bg-surface hover:text-ink"
      >
        <Search className="size-3.5 text-muted" />
        <span className="flex-1 truncate">Search workspace…</span>
        <kbd className="rounded border border-line bg-raised/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted">Ctrl K</kbd>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" onClick={() => setCreateOpen(true)} className="h-9 gap-1.5 rounded-full px-4 text-xs">
          <Plus className="size-3.5" /> Create
        </Button>
        <ThemeToggle />
        <AccountMenu />
      </div>
      <QuickCreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </header>
  );
}
