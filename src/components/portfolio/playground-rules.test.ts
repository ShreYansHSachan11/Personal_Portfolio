import { describe, expect, it } from "vitest";
import { hitScore, isOutOfShots, launchVelocity, scenarios, SHOT_LIMIT, TARGET_POINTS } from "./playground-rules";

describe("ricochet rules", () => {
  it("caps launch speed and supplies a usable default", () => {
    expect(Math.hypot(...Object.values(launchVelocity(10000, 0)))).toBe(22);
    expect(Math.hypot(...Object.values(launchVelocity(1, 1)))).toBeCloseTo(5);
    expect(launchVelocity(0, 0)).toEqual({ x: 15, y: -10 });
  });

  it("keeps the aim direction when scaling speed", () => {
    const v = launchVelocity(120, -120);
    expect(v.x).toBeCloseTo(-v.y);
    expect(v.x).toBeGreaterThan(0);
  });

  it("scores a target only once", () => {
    expect(hitScore([], 1)).toBe(100);
    expect(hitScore([1], 1)).toBe(0);
    expect(hitScore([1], 2)).toBe(100);
  });

  it("caps a perfect round at 300 points", () => {
    for (const s of scenarios) expect(s.targets.length * TARGET_POINTS).toBe(300);
  });

  it("provides three distinct physics scenarios", () => {
    expect(scenarios).toHaveLength(3);
    expect(new Set(scenarios.map((s) => s.name)).size).toBe(3);
    expect(new Set(scenarios.map((s) => s.gravity)).size).toBe(3);
    expect(new Set(scenarios.map((s) => JSON.stringify(s.targets))).size).toBe(3);
  });

  it("keeps every target and wall inside the 840 × 460 board", () => {
    for (const s of scenarios) {
      for (const [x, y] of s.targets) expect(x > 24 && x < 816 && y > 24 && y < 436).toBe(true);
      for (const [x, y, w, h] of s.walls) expect(x - w / 2 >= 0 && x + w / 2 <= 840 && y - h / 2 >= 0 && y + h / 2 <= 460).toBe(true);
    }
  });

  it("only loses after the final shot's grace period", () => {
    expect(isOutOfShots(SHOT_LIMIT - 1, 20_000)).toBe(false);
    expect(isOutOfShots(SHOT_LIMIT, 8_000)).toBe(false);
    expect(isOutOfShots(SHOT_LIMIT, 9_001)).toBe(true);
  });
});
