"use client";

import { useMemo } from "react";
import { highlight } from "@/lib/highlight";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

/**
 * Highlighted code with a copy button. highlight.js escapes the source before
 * adding <span> tags, so injecting its output is safe.
 */
export function CodeBlock({
  code,
  language,
  maxLines,
  className,
  showCopy = true,
}: {
  code: string;
  language?: string;
  maxLines?: number;
  className?: string;
  showCopy?: boolean;
}) {
  const shown = useMemo(() => (maxLines ? code.split("\n").slice(0, maxLines).join("\n") : code), [code, maxLines]);
  const html = useMemo(() => highlight(shown, language), [shown, language]);
  const truncated = maxLines !== undefined && code.split("\n").length > maxLines;

  return (
    <div className={cn("group relative overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-2", className)}>
      {showCopy && <CopyButton text={code} label="Copy code" className="absolute top-1.5 right-1.5 z-10 bg-surface-2/90 backdrop-blur" />}
      <pre className="overflow-x-auto p-3.5 pr-11 font-mono text-[12.5px] leading-relaxed">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
      {truncated && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface-2 to-transparent" />}
    </div>
  );
}
