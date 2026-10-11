import type { ReactNode } from "react";

export function AuthHeading({ title, description }: { title: string; description: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-[26px] font-medium tracking-[-0.035em] text-ink">{title}</h1>
      <p className="mt-2 text-sm font-medium text-muted">{description}</p>
    </div>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-[var(--radius-control)] border border-coral/30 bg-coral-soft px-3.5 py-3 text-sm text-coral"
          : "rounded-[var(--radius-control)] border border-mint/30 bg-mint-soft px-3.5 py-3 text-sm text-mint"
      }
    >
      {children}
    </div>
  );
}
