/**
 * Line illustrations for empty states. Strokes use currentColor (muted) with
 * one accent detail, so they adapt to both themes without separate assets.
 */
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const accent = { fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", className: "stroke-accent" } as const;

export function BoardIllustration({ className = "h-24 w-32" }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 96" className={className} aria-hidden>
      <rect x="8" y="14" width="34" height="70" rx="6" {...base} />
      <rect x="47" y="14" width="34" height="70" rx="6" {...base} />
      <rect x="86" y="14" width="34" height="70" rx="6" {...base} strokeDasharray="4 4" />
      <rect x="13" y="24" width="24" height="12" rx="3" {...base} />
      <rect x="13" y="41" width="24" height="12" rx="3" {...base} />
      <rect x="52" y="24" width="24" height="12" rx="3" className="fill-accent-soft stroke-accent" strokeWidth={1.6} />
      <path d="M103 44v10M98 49h10" {...base} />
    </svg>
  );
}

export function FolderIllustration({ className = "h-24 w-32" }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 96" className={className} aria-hidden>
      <path d="M18 28a6 6 0 0 1 6-6h22l8 8h50a6 6 0 0 1 6 6v40a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z" {...base} />
      <path d="M18 40h92" {...base} />
      <path d="M54 58l-6 5 6 5M74 58l6 5-6 5M66 55l-4 16" {...accent} />
    </svg>
  );
}

export function RocketIllustration({ className = "h-24 w-32" }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 96" className={className} aria-hidden>
      <path d="M64 12c12 8 18 22 18 38l-8 12H54l-8-12c0-16 6-30 18-38z" {...base} />
      <circle cx="64" cy="38" r="6" className="fill-accent-soft stroke-accent" strokeWidth={1.6} />
      <path d="M46 50l-10 10 8 4M82 50l10 10-8 4" {...base} />
      <path d="M58 70l-2 10M64 70v14M70 70l2 10" {...accent} />
    </svg>
  );
}

export function TimelineIllustration({ className = "h-24 w-32" }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 96" className={className} aria-hidden>
      <path d="M30 14v68" {...base} />
      <circle cx="30" cy="24" r="5" className="fill-accent-soft stroke-accent" strokeWidth={1.6} />
      <circle cx="30" cy="48" r="5" {...base} />
      <circle cx="30" cy="72" r="5" {...base} strokeDasharray="3 3" />
      <path d="M44 22h48M44 28h30M44 46h56M44 52h22M44 70h40" {...base} />
    </svg>
  );
}

export function VaultIllustration({ className = "h-24 w-32" }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 96" className={className} aria-hidden>
      <rect x="28" y="14" width="72" height="68" rx="8" {...base} />
      <circle cx="64" cy="48" r="16" {...base} />
      <circle cx="64" cy="48" r="5" className="fill-accent-soft stroke-accent" strokeWidth={1.6} />
      <path d="M64 32v6M64 58v6M48 48h6M74 48h6" {...base} />
      <path d="M36 82v6M92 82v6" {...base} />
    </svg>
  );
}

/**
 * Hero art for the sign-in screens: an editor window, a commit graph and a
 * build card floating together, i.e. what DevHub keeps in one place.
 */
export function WorkspaceArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 440 360" className={className} aria-hidden>
      <defs>
        <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" className="fill-line" />
        </pattern>
      </defs>
      <rect width="440" height="360" fill="url(#dots)" opacity="0.7" />

      {/* Editor window */}
      <g transform="translate(40 50)">
        <rect width="270" height="190" rx="14" className="fill-surface stroke-line" strokeWidth="1.5" />
        <path d="M0 14a14 14 0 0 1 14-14h242a14 14 0 0 1 14 14v18H0z" className="fill-raised" />
        <circle cx="18" cy="16" r="4.5" className="fill-coral" />
        <circle cx="33" cy="16" r="4.5" className="fill-accent" />
        <circle cx="48" cy="16" r="4.5" className="fill-mint" />
        {/* Code lines. Literal class names so Tailwind can find them at build time. */}
        {(
          [
            [20, 56, 60, "fill-iris"], [88, 56, 90, "fill-line-strong"],
            [36, 78, 48, "fill-accent"], [92, 78, 110, "fill-line-strong"],
            [36, 100, 130, "fill-line-strong"],
            [52, 122, 70, "fill-mint"], [130, 122, 60, "fill-line-strong"],
            [36, 144, 96, "fill-line-strong"],
            [20, 166, 40, "fill-iris"],
          ] as const
        ).map(([x, y, w, fill], i) => (
          <rect key={i} x={x} y={y} width={w} height="8" rx="4" className={fill} />
        ))}
      </g>

      {/* Commit graph card */}
      <g transform="translate(250 150)">
        <rect width="160" height="150" rx="14" className="fill-surface stroke-line" strokeWidth="1.5" />
        <path d="M34 26v100M34 56c0 20 40 10 40 32v6" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-accent" />
        <circle cx="34" cy="28" r="7" className="fill-accent" />
        <circle cx="34" cy="76" r="7" className="fill-surface stroke-accent" strokeWidth="3" />
        <circle cx="74" cy="96" r="7" className="fill-accent" />
        <circle cx="34" cy="124" r="7" className="fill-accent" />
        <rect x="56" y="24" width="80" height="8" rx="4" className="fill-line-strong" />
        <rect x="56" y="72" width="56" height="8" rx="4" className="fill-line-strong" />
        <rect x="92" y="92" width="44" height="8" rx="4" className="fill-line-strong" />
        <rect x="56" y="120" width="70" height="8" rx="4" className="fill-line-strong" />
      </g>

      {/* Build status pill */}
      <g transform="translate(70 262)">
        <rect width="150" height="44" rx="22" className="fill-surface stroke-line" strokeWidth="1.5" />
        <circle cx="24" cy="22" r="9" className="fill-mint-soft" />
        <path d="M19.5 22l3 3 6-6" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="stroke-mint" />
        <rect x="42" y="14" width="56" height="7" rx="3.5" className="fill-ink" opacity="0.8" />
        <rect x="42" y="25" width="86" height="6" rx="3" className="fill-line-strong" />
      </g>
    </svg>
  );
}
