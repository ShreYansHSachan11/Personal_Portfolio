/** Pure helpers behind the project artworks — kept free of React and the DOM so they are easy to test. */

export const ENTITY_KINDS = ["PERSON", "PHONE", "PLACE", "DATE", "ID"] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];
export interface CaseToken { text: string; kind: EntityKind | null }

const ENTITY = /\[([^|\]]+)\|([A-Z]+)\]/g;
const isEntityKind = (value: string): value is EntityKind => (ENTITY_KINDS as readonly string[]).includes(value);

/** Splits `[value|KIND]` markup into plain runs and tagged entities. Unknown kinds stay as plain text. */
export function parseCaseFile(source: string): CaseToken[] {
  const tokens: CaseToken[] = [];
  let last = 0;
  for (const match of source.matchAll(ENTITY)) {
    const [whole, text = "", kind = ""] = match;
    if (match.index > last) tokens.push({ text: source.slice(last, match.index), kind: null });
    tokens.push(isEntityKind(kind) ? { text, kind } : { text: whole, kind: null });
    last = match.index + whole.length;
  }
  if (last < source.length) tokens.push({ text: source.slice(last), kind: null });
  return tokens;
}

export interface Point { x: number; y: number }
export interface Neighbour { index: number; distance: number }

/** The `k` nearest points to `from`; `aspect` stretches x so distances match a non-square canvas. */
export function nearest(points: readonly Point[], from: Point, k: number, aspect = 1): Neighbour[] {
  return points
    .map((p, index) => ({ index, distance: Math.hypot((p.x - from.x) * aspect, p.y - from.y) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.max(0, k));
}

/** Maps a distance in canvas-percent units to a 0.50–0.99 "match" score. */
export const matchScore = (distance: number) => Math.min(0.99, Math.max(0.5, 1 - distance / 90));

/** Small deterministic PRNG so generated artwork is identical on every render and visit. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable, hash-looking label for ledger block `n` (decorative, not a real hash). */
export function blockHash(n: number): string {
  const hex = (Math.imul(n, 2654435761) >>> 0).toString(16).padStart(8, "0");
  return `0x${hex.slice(0, 4)}…${hex.slice(-3)}`;
}

/** Which of `count` equal horizontal bands the normalised position `x` (0–1) falls in. */
export const bandAt = (x: number, count: number) => Math.min(count - 1, Math.max(0, Math.floor(x * count)));
