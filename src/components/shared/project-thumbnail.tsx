"use client";

import { useEffect, useId, useSyncExternalStore, type ReactNode } from "react";
import {
  assignThumbnails,
  defaultSpec,
  getThumbnailsServerSnapshot,
  getThumbnailsSnapshot,
  PALETTES,
  PATTERNS,
  subscribeThumbnails,
  type ThumbSpec,
} from "@/lib/project-thumbnails";
import { cn } from "@/lib/utils";

const W = 400;
const H = 220;

/** [background A, background B, accent 1, accent 2, accent 3] */
const PALETTE_COLORS: string[][] = [
  ["#1a0b2e", "#3b1066", "#ff2e93", "#ffd166", "#06d6a0"], // Neon candy
  ["#2b1055", "#7a1c63", "#ff512f", "#f09819", "#ffe29a"], // Sunset tag
  ["#0b3d2e", "#064e3b", "#00f5a0", "#00d9f5", "#f7ff56"], // Mint spray
  ["#05103a", "#0b2a8a", "#2563ff", "#00e5ff", "#ff4d8d"], // Electric blue
  ["#ffd1e8", "#ffb3d9", "#ff6bb5", "#7c5cff", "#00c2ff"], // Bubblegum
  ["#1b0000", "#5c0a0a", "#ff3b1f", "#ff9a00", "#ffd23f"], // Lava
  ["#012a4a", "#014f86", "#00b4d8", "#90e0ef", "#ff8fab"], // Ocean drip
  ["#0d0d0d", "#1c1c1c", "#b6ff00", "#00ffa3", "#ff00e5"], // Toxic
  ["#240046", "#3c096c", "#c77dff", "#ff9e00", "#7b2cbf"], // Grape soda
  ["#fff0e0", "#ffd9c9", "#ff9a8b", "#ff6a88", "#6a82fb"], // Peach fizz
  ["#081c15", "#1b4332", "#95d5b2", "#ffb703", "#52b788"], // Forest mural
  ["#14002e", "#2d0a5c", "#ff00a8", "#00e0ff", "#fffb00"], // Cyber pink
  ["#0a0a0a", "#262626", "#f5f5f5", "#ff3d00", "#8a8a8a"], // Mono ink
  ["#fff7cc", "#ffe98a", "#ff8a00", "#00c853", "#ff3d71"], // Citrus
  ["#031926", "#0a3d52", "#0fb9b1", "#26de81", "#fed330"], // Midnight teal
  ["#2d142c", "#510a32", "#ee4540", "#f8b195", "#c72c41"], // Rose gold
];

/** mulberry32: small, fast, seedable PRNG. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Ctx {
  r: () => number;
  pal: string[];
  id: string;
}

const between = (r: () => number, a: number, b: number) => a + r() * (b - a);
const n = (v: number) => Math.round(v * 10) / 10;

/* ------------------------------ patterns ------------------------------ */

const PATTERN_FNS: Array<(c: Ctx) => ReactNode> = [
  // 0 · aurora blobs
  ({ r, pal, id }) => (
    <g filter={`url(#${id}-blur)`}>
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={i} cx={n(between(r, 0, W))} cy={n(between(r, 0, H))} r={n(between(r, 50, 120))} fill={pal[2 + (i % 3)]} opacity={0.8} />
      ))}
    </g>
  ),

  // 1 · graffiti brush strokes with drips
  ({ r, pal }) => (
    <g strokeLinecap="round" fill="none">
      {Array.from({ length: 5 }, (_, i) => {
        const y = between(r, 24, H - 24);
        const a = between(r, 14, 48);
        const w = between(r, 22, 40);
        const color = pal[2 + (i % 3)];
        const d = `M -20 ${n(y)} C ${n(between(r, 60, 140))} ${n(y - a)} ${n(between(r, 180, 260))} ${n(y + a)} ${n(between(r, 300, 360))} ${n(y - a / 2)} S ${W + 10} ${n(y + a / 2)} ${W + 30} ${n(y)}`;
        const drips = Array.from({ length: 3 }, () => {
          const x = n(between(r, 40, W - 40));
          return { x, len: n(between(r, 14, 48)) };
        });
        return (
          <g key={i}>
            <path d={d} stroke="#000" strokeOpacity={0.28} strokeWidth={w + 6} transform="translate(3 5)" />
            <path d={d} stroke={color} strokeWidth={w} />
            <path d={d} stroke="#fff" strokeOpacity={0.32} strokeWidth={Math.max(3, w / 7)} transform={`translate(0 ${-w / 4})`} />
            {drips.map((dr, k) => (
              <g key={k}>
                <line x1={dr.x} x2={dr.x} y1={n(y + a * 0.1)} y2={n(y + w / 2 + dr.len)} stroke={color} strokeWidth={5} />
                <circle cx={dr.x} cy={n(y + w / 2 + dr.len + 3)} r={4.5} fill={color} stroke="none" />
              </g>
            ))}
          </g>
        );
      })}
    </g>
  ),

  // 2 · mesh gradient
  ({ r, pal, id }) => (
    <g>
      <defs>
        {Array.from({ length: 4 }, (_, i) => (
          <radialGradient key={i} id={`${id}-m${i}`} cx={n(r())} cy={n(r())} r={0.75}>
            <stop offset="0" stopColor={pal[2 + (i % 3)]} stopOpacity={0.95} />
            <stop offset="1" stopColor={pal[2 + (i % 3)]} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      {Array.from({ length: 4 }, (_, i) => (
        <rect key={i} width={W} height={H} fill={`url(#${id}-m${i})`} />
      ))}
    </g>
  ),

  // 3 · halftone spray dots
  ({ r, pal }) => {
    const fx = between(r, 60, W - 60);
    const fy = between(r, 40, H - 40);
    const dots: ReactNode[] = [];
    for (let y = 9; y < H + 18; y += 18) {
      for (let x = 9; x < W + 18; x += 18) {
        const d = Math.hypot(x - fx, y - fy);
        const rad = Math.max(0.6, 8.5 - d / 38);
        dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={n(rad)} fill={pal[2]} />);
        if (rad > 4) dots.push(<circle key={`b${x}-${y}`} cx={x + 4} cy={y + 4} r={n(rad / 2.4)} fill={pal[3]} />);
      }
    }
    return <g>{dots}</g>;
  },

  // 4 · bold diagonal stripes + sun
  ({ r, pal }) => (
    <g>
      <g transform={`rotate(${n(between(r, -35, 35))} ${W / 2} ${H / 2})`}>
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={-260 + i * 48} y={-200} width={n(between(r, 14, 30))} height={700} fill={pal[2 + (i % 3)]} opacity={0.85} />
        ))}
      </g>
      <circle cx={n(between(r, 80, W - 80))} cy={n(between(r, 50, H - 50))} r={n(between(r, 34, 58))} fill={pal[4]} stroke="#fff" strokeOpacity={0.5} strokeWidth={3} />
    </g>
  ),

  // 5 · concentric rings
  ({ r, pal }) => {
    const cx = between(r, 80, W - 80);
    const cy = between(r, 50, H - 50);
    return (
      <g fill="none">
        {Array.from({ length: 11 }, (_, i) => (
          <circle key={i} cx={n(cx)} cy={n(cy)} r={14 + i * 24} stroke={pal[2 + (i % 3)]} strokeWidth={n(between(r, 6, 14))} opacity={0.9} />
        ))}
      </g>
    );
  },

  // 6 · layered waves
  ({ r, pal }) => (
    <g>
      {Array.from({ length: 4 }, (_, layer) => {
        const base = 70 + layer * 32;
        const amp = between(r, 10, 30);
        const freq = between(r, 0.012, 0.03);
        const phase = between(r, 0, 6.28);
        let d = `M 0 ${H}`;
        for (let x = 0; x <= W; x += 10) d += ` L ${x} ${n(base + Math.sin(x * freq + phase) * amp)}`;
        d += ` L ${W} ${H} Z`;
        return <path key={layer} d={d} fill={pal[2 + (layer % 3)]} opacity={0.82} />;
      })}
    </g>
  ),

  // 7 · low-poly shards
  ({ r, pal }) => {
    const cols = 7;
    const rows = 4;
    const pts: Array<Array<[number, number]>> = [];
    for (let j = 0; j <= rows; j++) {
      pts.push([]);
      for (let i = 0; i <= cols; i++) {
        const jitter = (edge: boolean) => (edge ? 0 : between(r, -16, 16));
        pts[j].push([(i * W) / cols + jitter(i === 0 || i === cols), (j * H) / rows + jitter(j === 0 || j === rows)]);
      }
    }
    const tris: ReactNode[] = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i + 1], d = pts[j + 1][i];
        const flip = r() > 0.5;
        const sets = flip ? [[a, b, d], [b, c, d]] : [[a, b, c], [a, c, d]];
        sets.forEach((t, k) => tris.push(<polygon key={`${i}-${j}-${k}`} points={t.map((p) => `${n(p[0])},${n(p[1])}`).join(" ")} fill={pal[2 + Math.floor(r() * 3)]} opacity={n(between(r, 0.3, 0.92))} />));
      }
    }
    return <g stroke="#fff" strokeOpacity={0.12} strokeWidth={1}>{tris}</g>;
  },

  // 8 · looping spray-tag squiggles
  ({ r, pal }) => (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {Array.from({ length: 4 }, (_, i) => {
        const y0 = between(r, 30, H - 30);
        const amp = between(r, 18, 46);
        const loops = between(r, 5, 9);
        const speed = between(r, 0.9, 1.4);
        let d = "";
        for (let t = 0; t <= 100; t++) {
          const u = t / 100;
          const x = -20 + u * (W + 40) * speed + Math.cos(u * loops * 6.28) * amp * 0.9;
          const y = y0 + Math.sin(u * loops * 6.28) * amp;
          d += `${t === 0 ? "M" : "L"} ${n(x)} ${n(y)} `;
        }
        const w = between(r, 9, 16);
        return (
          <g key={i}>
            <path d={d} stroke="#000" strokeOpacity={0.25} strokeWidth={w + 4} transform="translate(2 4)" />
            <path d={d} stroke={pal[2 + (i % 3)]} strokeWidth={w} />
            <path d={d} stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
          </g>
        );
      })}
    </g>
  ),

  // 9 · pop-art shape grid
  ({ r, pal }) => {
    const cols = 8;
    const rows = 4;
    const cw = W / cols;
    const ch = H / rows;
    const cells: ReactNode[] = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * cw;
        const y = j * ch;
        const fill = pal[2 + Math.floor(r() * 3)];
        const kind = Math.floor(r() * 4);
        const key = `${i}-${j}`;
        if (kind === 0) cells.push(<circle key={key} cx={x + cw / 2} cy={y + ch / 2} r={Math.min(cw, ch) / 2 - 3} fill={fill} />);
        else if (kind === 1) cells.push(<path key={key} d={`M ${x} ${y + ch} A ${cw} ${ch} 0 0 1 ${x + cw} ${y} L ${x + cw} ${y + ch} Z`} fill={fill} />);
        else if (kind === 2) cells.push(<rect key={key} x={x + 4} y={y + 4} width={cw - 8} height={ch - 8} rx={8} fill={fill} />);
        else cells.push(<polygon key={key} points={`${x + cw / 2},${y + 4} ${x + cw - 4},${y + ch - 4} ${x + 4},${y + ch - 4}`} fill={fill} />);
      }
    }
    return <g opacity={0.9}>{cells}</g>;
  },

  // 10 · sunburst
  ({ r, pal }) => {
    const cx = between(r, 100, W - 100);
    const cy = between(r, 60, H - 60);
    const rays = 18;
    const offset = between(r, 0, 6.28);
    return (
      <g>
        {Array.from({ length: rays }, (_, i) => {
          const a1 = offset + (i / rays) * 6.283;
          const a2 = offset + ((i + 0.5) / rays) * 6.283;
          const R = 600;
          return <path key={i} d={`M ${n(cx)} ${n(cy)} L ${n(cx + Math.cos(a1) * R)} ${n(cy + Math.sin(a1) * R)} L ${n(cx + Math.cos(a2) * R)} ${n(cy + Math.sin(a2) * R)} Z`} fill={pal[2 + (i % 2)]} opacity={0.7} />;
        })}
        <circle cx={n(cx)} cy={n(cy)} r={30} fill={pal[4]} stroke="#fff" strokeOpacity={0.6} strokeWidth={4} />
      </g>
    );
  },

  // 11 · paint splatter
  ({ r, pal }) => (
    <g>
      {Array.from({ length: 3 }, (_, b) => {
        const cx = between(r, 60, W - 60);
        const cy = between(r, 45, H - 45);
        const color = pal[2 + b];
        const main = between(r, 26, 44);
        return (
          <g key={b} fill={color}>
            <circle cx={n(cx)} cy={n(cy)} r={n(main)} />
            {Array.from({ length: 9 }, (_, k) => {
              const ang = (k / 9) * 6.283 + between(r, -0.3, 0.3);
              const dist = main * between(r, 0.85, 1.6);
              return <circle key={k} cx={n(cx + Math.cos(ang) * dist)} cy={n(cy + Math.sin(ang) * dist)} r={n(between(r, 4, 15))} />;
            })}
            {Array.from({ length: 7 }, (_, k) => (
              <circle key={`d${k}`} cx={n(cx + between(r, -110, 110))} cy={n(cy + between(r, -80, 80))} r={n(between(r, 1.5, 4))} />
            ))}
          </g>
        );
      })}
    </g>
  ),
];

/* ------------------------------- artwork ------------------------------- */

export function ThumbnailArt({ spec, className }: { spec: ThumbSpec; className?: string }) {
  const id = `t${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const pal = PALETTE_COLORS[spec.c % PALETTES];
  const r = rng(spec.s ^ (spec.p * 7919 + spec.c * 104729));
  const angle = n(between(r, 100, 170));
  const art = PATTERN_FNS[spec.p % PATTERNS]({ r, pal, id });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={cn("block size-full", className)} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} gradientTransform={`rotate(${angle} .5 .5)`}>
          <stop offset="0" stopColor={pal[0]} />
          <stop offset="1" stopColor={pal[1]} />
        </linearGradient>
        <filter id={`${id}-blur`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <pattern id={`${id}-dots`} width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.9" fill="#fff" fillOpacity="0.16" />
        </pattern>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-bg)`} />
      {art}
      <rect width={W} height={H} fill={`url(#${id}-dots)`} />
      <rect width={W} height={H} fill={`url(#${id}-gloss)`} />
    </svg>
  );
}

/** The saved (or, until saved, id-derived) thumbnail for one project. */
export function ProjectThumbnail({ projectId, className }: { projectId: string; className?: string }) {
  const saved = useSyncExternalStore(subscribeThumbnails, getThumbnailsSnapshot, getThumbnailsServerSnapshot);
  const spec = saved[projectId] ?? defaultSpec(projectId);
  return (
    <div aria-hidden className={cn("relative overflow-hidden", className)}>
      <ThumbnailArt spec={spec} />
    </div>
  );
}

/** Call once with the visible projects so each gets its own unique, permanent thumbnail. */
export function useAssignThumbnails(projects: ReadonlyArray<{ id: string; created_at: string }> | undefined) {
  useEffect(() => {
    if (projects?.length) assignThumbnails(projects);
  }, [projects]);
}
