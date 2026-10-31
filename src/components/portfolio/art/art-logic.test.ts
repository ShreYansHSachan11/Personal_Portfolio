import { describe, expect, it } from "vitest";
import { bandAt, blockHash, matchScore, mulberry32, nearest, parseCaseFile } from "./art-logic";

describe("parseCaseFile", () => {
  it("separates plain text from tagged entities", () => {
    expect(parseCaseFile("Met [Ana|PERSON] on [Monday|DATE].")).toEqual([
      { text: "Met ", kind: null },
      { text: "Ana", kind: "PERSON" },
      { text: " on ", kind: null },
      { text: "Monday", kind: "DATE" },
      { text: ".", kind: null },
    ]);
  });
  it("keeps unknown entity kinds as plain text", () => {
    expect(parseCaseFile("[x|SECRET]")).toEqual([{ text: "[x|SECRET]", kind: null }]);
  });
});

describe("nearest", () => {
  const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }];
  it("orders neighbours by distance and limits to k", () => {
    expect(nearest(points, { x: 1, y: 1 }, 2).map((n) => n.index)).toEqual([0, 2]);
  });
  it("accounts for the canvas aspect ratio", () => {
    expect(nearest(points, { x: 4, y: 4 }, 1, 3)[0]?.index).toBe(2);
  });
  it("handles k of zero", () => {
    expect(nearest(points, { x: 0, y: 0 }, 0)).toEqual([]);
  });
});

describe("artwork helpers", () => {
  it("clamps match scores", () => {
    expect(matchScore(0)).toBe(0.99);
    expect(matchScore(500)).toBe(0.5);
  });
  it("is deterministic", () => {
    const a = mulberry32(7), b = mulberry32(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(blockHash(1024)).toBe(blockHash(1024));
    expect(blockHash(1024)).toMatch(/^0x[0-9a-f]{4}…[0-9a-f]{3}$/);
  });
  it("maps positions to bands, clamping the edges", () => {
    expect(bandAt(0, 6)).toBe(0);
    expect(bandAt(0.5, 6)).toBe(3);
    expect(bandAt(1, 6)).toBe(5);
    expect(bandAt(-0.2, 6)).toBe(0);
  });
});
