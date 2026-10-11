import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tones = {
  accent: "bg-accent-soft text-accent",
  iris: "bg-iris-soft text-iris",
  mint: "bg-mint-soft text-mint",
  sky: "bg-sky-soft text-sky",
  coral: "bg-coral-soft text-coral",
} as const;

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "accent",
  href,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon: ReactNode;
  tone?: keyof typeof tones;
  /** Makes the whole card a link. */
  href?: string;
}) {
  const body = (
    <Card className={cn("h-full p-4 md:p-5", href && "group-hover:-translate-y-0.5 group-hover:border-line-strong group-hover:shadow-pop")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <span className={cn("grid size-9 place-items-center rounded-xl transition-transform group-hover:scale-110 [&>svg]:size-[18px]", tones[tone])}>{icon}</span>
      </div>
      <p className="mt-2 font-sans text-2xl leading-none font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      {detail && <p className="mt-2 text-xs text-faint">{detail}</p>}
    </Card>
  );
  return href ? (
    <Link href={href} className="group block rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
      {body}
    </Link>
  ) : (
    body
  );
}
