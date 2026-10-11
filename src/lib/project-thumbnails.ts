/**
 * Project thumbnails: which piece of artwork each project gets.
 *
 * A "spec" is a pattern (0..PATTERNS-1) + palette (0..PALETTES-1) + seed. The pair is unique per
 * project, so no two projects share a look, and once a project has a spec it is saved and never
 * changes. The default spec is derived from the project id, so every device starts from the same
 * assignment; the saved copy (localStorage) then keeps it frozen even if projects are added or removed.
 */

export const PATTERNS = 12;
export const PALETTES = 16;

export interface ThumbSpec {
  /** pattern index */
  p: number;
  /** palette index */
  c: number;
  /** seed for the small random details (stroke positions, dots...) */
  s: number;
}

const STORAGE_KEY = "devhub.project-thumbnails.v1";
const MAX_SAVED = 150; // stay below the 192 distinct pattern/palette pairs

/** FNV-1a 32-bit hash. */
export function hashString(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic spec for an id (no uniqueness guarantee; see assignThumbnails). */
export function defaultSpec(id: string): ThumbSpec {
  const h = hashString(id);
  return { p: h % PATTERNS, c: (h >>> 8) % PALETTES, s: hashString(`${id}:seed`) };
}

type Saved = Record<string, ThumbSpec>;
const EMPTY: Saved = {};

let cache: Saved | null = null;
const listeners = new Set<() => void>();

function valid(spec: unknown): spec is ThumbSpec {
  const s = spec as ThumbSpec;
  return !!s && Number.isInteger(s.p) && s.p >= 0 && s.p < PATTERNS && Number.isInteger(s.c) && s.c >= 0 && s.c < PALETTES && Number.isFinite(s.s);
}

function read(): Saved {
  if (cache) return cache;
  const out: Saved = {};
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
    for (const [id, spec] of Object.entries(raw)) if (valid(spec)) out[id] = spec;
  } catch {
    /* storage unavailable or corrupt: start empty */
  }
  cache = out;
  return out;
}

function write(next: Saved) {
  cache = next; // new object identity so subscribers re-render
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota: keep working in memory */
  }
  listeners.forEach((l) => l());
}

export function subscribeThumbnails(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null; // another tab assigned something
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const getThumbnailsSnapshot = (): Saved => read();
export const getThumbnailsServerSnapshot = (): Saved => EMPTY;

/**
 * Gives every project without a saved spec its own unused pattern/palette pair. New projects are
 * processed oldest first starting from their id-derived spec, preferring the least-used pattern and
 * palette so the first 12 projects all have different patterns and the first 16 different palettes.
 * Already-saved projects are never touched.
 */
export function assignThumbnails(projects: ReadonlyArray<{ id: string; created_at: string }>) {
  const saved = read();
  const fresh = projects.filter((p) => !saved[p.id]).sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  if (fresh.length === 0) return;

  const next: Saved = { ...saved };
  // drop the oldest saved entries if we're running out of distinct pairs (insertion order = age)
  const keys = Object.keys(next);
  for (const k of keys.slice(0, Math.max(0, keys.length + fresh.length - MAX_SAVED))) delete next[k];

  const usedPairs = new Set<number>();
  const patternUse = new Array<number>(PATTERNS).fill(0);
  const paletteUse = new Array<number>(PALETTES).fill(0);
  for (const s of Object.values(next)) {
    usedPairs.add(s.p * PALETTES + s.c);
    patternUse[s.p]++;
    paletteUse[s.c]++;
  }

  for (const project of fresh) {
    const start = defaultSpec(project.id);
    const startIndex = start.p * PALETTES + start.c;
    let best = -1;
    let bestScore = Infinity;
    for (let k = 0; k < PATTERNS * PALETTES; k++) {
      const idx = (startIndex + k) % (PATTERNS * PALETTES);
      if (usedPairs.has(idx)) continue;
      const score = patternUse[Math.floor(idx / PALETTES)] * 1000 + paletteUse[idx % PALETTES];
      if (score < bestScore) {
        bestScore = score;
        best = idx;
      }
    }
    if (best < 0) best = startIndex; // every pair is taken (200+ projects): reuse the hashed one
    const spec: ThumbSpec = { p: Math.floor(best / PALETTES), c: best % PALETTES, s: start.s };
    next[project.id] = spec;
    usedPairs.add(best);
    patternUse[spec.p]++;
    paletteUse[spec.c]++;
  }
  write(next);
}
