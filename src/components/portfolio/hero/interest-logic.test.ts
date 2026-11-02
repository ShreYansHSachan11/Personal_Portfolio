import { describe, expect, it } from "vitest";
import { interests } from "../content";
import { Chess } from "chess.js";
import { chessComUrls, parseChessCom, spotifySearchUrl } from "./interest-logic";
import { previews } from "./previews";

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

describe("music previews", () => {
  const music = interests.find((i) => i.kind === "music");
  const songs = music && "items" in music ? music.items : [];

  it("has a preview clip and Apple Music link for every listed song, on Apple hosts only", () => {
    for (const song of songs) {
      const p = previews[song.title];
      expect(p, song.title).toBeDefined();
      if (!p) continue;
      const audio = new URL(p.audio);
      const link = new URL(p.link);
      expect(audio.protocol).toBe("https:");
      expect(audio.hostname.endsWith(".itunes.apple.com")).toBe(true);
      expect(link.hostname).toBe("music.apple.com");
      expect([...link.searchParams.keys()].every((k) => k === "i")).toBe(true);
    }
  });

  it("builds an encoded Spotify search link", () => {
    expect(spotifySearchUrl("cold/mess", "Prateek Kuhad")).toBe("https://open.spotify.com/search/cold%2Fmess%20Prateek%20Kuhad");
    expect(spotifySearchUrl("Kyon", "Papon & Sunidhi Chauhan")).toBe("https://open.spotify.com/search/Kyon%20Papon%20Sunidhi%20Chauhan");
  });
});
