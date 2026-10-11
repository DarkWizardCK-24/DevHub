"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

/**
 * Renders note Markdown (GitHub flavour: tables, task lists, strikethrough).
 * react-markdown never uses dangerouslySetInnerHTML for the document and
 * ignores raw HTML by default, so a note can't inject scripts.
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          code: ({ className: codeClass, children }) => {
            const match = /language-(\w+)/.exec(codeClass ?? "");
            const text = String(children).replace(/\n$/, "");
            // Fenced blocks have a language class or contain newlines; the rest is inline code.
            if (match || text.includes("\n")) return <CodeBlock code={text} language={match?.[1]} className="my-4" />;
            return <code className="inline-code">{children}</code>;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
