import { describe, expect, it } from "vitest";
import { interests } from "../content";
import { Chess } from "chess.js";
import { chessComUrls, parseChessCom, peekLift } from "./interest-logic";

describe("chess.com", () => {
  it("reads ratings, totals and the avatar from API responses", () => {
    const stats = parseChessCom(
      { avatar: "https://images.chesscomfiles.com/uploads/a.jpg", league: "Champion" },
      {
        chess_rapid: { last: { rating: 756 }, record: { win: 2, loss: 1, draw: 1 } },
        chess_blitz: { last: { rating: 531 }, record: { win: 1, loss: 0, draw: 0 } },
        tactics: { highest: { rating: 1640 } },
      },
    );
    expect(stats).toEqual({ rapid: 756, puzzles: 1640, games: 5, league: "Champion", avatar: "https://images.chesscomfiles.com/uploads/a.jpg" });
  });

  it("tolerates junk and refuses avatars from other hosts", () => {
    const stats = parseChessCom({ avatar: "javascript:alert(1)", league: 3 }, { chess_rapid: { last: { rating: "high" } } });
    expect(stats).toEqual({ rapid: null, puzzles: null, games: 0, league: null, avatar: null });
    expect(parseChessCom(null, "nope").games).toBe(0);
  });

  it("builds encoded URLs", () => {
    expect(chessComUrls("a b").challenge).toBe("https://www.chess.com/play/online/new?opponent=a%20b");
  });
});

describe("peekLift", () => {
  it("rests at the ends of a period and peaks in the middle", () => {
    expect(peekLift(0, 2)).toBeCloseTo(0);
    expect(peekLift(1, 2)).toBeCloseTo(1);
    expect(peekLift(2, 2)).toBeCloseTo(0);
    expect(peekLift(-1, 2)).toBeCloseTo(1);
  });
});

describe("interests content", () => {
  it("has one card per kind with a usable list", () => {
    const kinds = interests.map((i) => i.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
    for (const interest of interests) {
      if (interest.kind !== "chess") {
        expect(interest.items.length).toBeGreaterThanOrEqual(3);
        expect(interest.items.length).toBeLessThanOrEqual(6);
      } else {
        // The puzzle must have exactly one mating move, and it must be the stored solution.
        const mates = new Chess(interest.fen).moves({ verbose: true }).filter((m) => {
          const g = new Chess(interest.fen);
          g.move(m.san);
          return g.isCheckmate();
        });
        expect(mates.map((m) => `${m.from}${m.to}`)).toEqual([`${interest.solution.from}${interest.solution.to}`]);
        expect(interest.chessCom.username).toMatch(/^[A-Za-z0-9_-]+$/);
      }
    }
  });
});
