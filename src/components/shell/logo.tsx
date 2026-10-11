import { cn } from "@/lib/utils";

/** Mark: a commit graph — a main line with a branch merging back in. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 drop-shadow-[0_6px_10px_var(--accent-glow)]", className)} aria-hidden>
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6a6cf5" />
          <stop offset="1" stopColor="#9061f9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" fill="url(#logo-grad)" />
      <path d="M11 8v16M11 13c0 4 10 2 10 7" fill="none" strokeWidth="2.2" strokeLinecap="round" className="stroke-accent-ink" />
      <circle cx="11" cy="9" r="2.5" className="fill-accent-ink" />
      <circle cx="11" cy="23.5" r="2.5" className="fill-accent-ink" />
      <circle cx="21" cy="20.5" r="2.5" fill="#7d63f7" className="stroke-accent-ink" strokeWidth="2" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-sans text-[17px] font-semibold tracking-[-0.03em] text-ink">DevHub</span>
    </span>
  );
}
