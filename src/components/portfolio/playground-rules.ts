/** Pure, framework-free rules for the ricochet game (logical board: 840 × 460). */

export type Point = readonly [x: number, y: number];
/** Static wall centred at (x, y) with the given width and height. */
export type Wall = readonly [x: number, y: number, width: number, height: number];
export type Scenario = { readonly name: string; readonly gravity: number; readonly targets: readonly Point[]; readonly walls: readonly Wall[] };

export const scenarios: readonly Scenario[] = [
  { name: "First bounce", gravity: 0.3, targets: [[420, 210], [600, 150], [690, 320]], walls: [[490, 360, 220, 16]] },
  { name: "Cross current", gravity: -0.12, targets: [[390, 310], [560, 190], [720, 280]], walls: [[450, 180, 16, 160], [650, 370, 180, 16]] },
  { name: "The vault", gravity: 0.45, targets: [[440, 120], [610, 240], [720, 130]], walls: [[530, 300, 16, 180], [690, 340, 150, 16]] },
];

export const SHOT_LIMIT = 5;
export const TARGET_POINTS = 100;
/** How long the final shot may keep bouncing before the round is lost. */
export const LAST_SHOT_GRACE_MS = 9000;

const MIN_SPEED = 5;
const MAX_SPEED = 22;
const DEFAULT_VELOCITY = { x: 15, y: -10 } as const;

/** Converts an aim vector (from the launcher to the pointer) into a launch velocity. */
export function launchVelocity(x: number, y: number) {
  const length = Math.hypot(x, y);
  if (length === 0) return { ...DEFAULT_VELOCITY };
  const power = Math.min(MAX_SPEED, Math.max(MIN_SPEED, length / 12));
  return { x: (x / length) * power, y: (y / length) * power };
}

/** Points for touching a target: each target scores once, repeat collisions are worth nothing. */
export function hitScore(hitIds: readonly number[], targetId: number) {
  return hitIds.includes(targetId) ? 0 : TARGET_POINTS;
}

/** A challenge is lost once every shot is spent and the last one has had its grace period. */
export function isOutOfShots(shots: number, msSinceLastShot: number) {
  return shots >= SHOT_LIMIT && msSinceLastShot > LAST_SHOT_GRACE_MS;
}
