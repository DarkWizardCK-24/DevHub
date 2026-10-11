"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export async function copyToClipboard(text: string, what = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(what);
    return true;
  } catch {
    toast.error("Couldn't copy: clipboard access was blocked by the browser.");
    return false;
  }
}

export function CopyButton({ text, label = "Copy", className, toastLabel }: { text: string | (() => Promise<string> | string); label?: string; className?: string; toastLabel?: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    const value = typeof text === "function" ? await text() : text;
    if (await copyToClipboard(value, toastLabel ?? "Copied to clipboard")) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("grid size-8 place-items-center rounded-lg text-faint transition-colors hover:bg-raised hover:text-ink", className)}
    >
      {copied ? <Check className="size-4 text-mint" /> : <Copy className="size-4" />}
    </button>
  );
}
