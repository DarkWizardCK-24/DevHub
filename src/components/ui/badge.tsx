import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "accent" | "iris" | "mint" | "coral" | "sky" | "amber";

const tones: Record<Tone, string> = {
  neutral: "bg-raised text-muted border-line",
  accent: "bg-accent-soft text-accent border-accent/20",
  iris: "bg-iris-soft text-iris border-iris/20",
  mint: "bg-mint-soft text-mint border-mint/20",
  coral: "bg-coral-soft text-coral border-coral/20",
  sky: "bg-sky-soft text-sky border-sky/20",
  amber: "bg-amber-soft text-amber border-amber/20",
};

export function Badge({ tone = "neutral", dot = false, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-5.5 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium tracking-tight", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />}
      {children}
    </span>
  );
}
