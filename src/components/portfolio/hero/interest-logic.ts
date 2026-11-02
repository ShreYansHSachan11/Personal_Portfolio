/** Pure helpers for the hero card holder. No React, no DOM. */
import type { ChessStats } from "../content";

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const at = (v: unknown, ...path: string[]): unknown =>
  path.reduce<unknown>((cur, key) => (isRecord(cur) ? cur[key] : undefined), v);

/**
 * Reads chess.com's public /player/{name} and /player/{name}/stats responses.
 * Treats both as untrusted: anything missing or malformed becomes null instead of throwing.
 */
export function parseChessCom(profile: unknown, stats: unknown): ChessStats {
  const games = ["chess_rapid", "chess_blitz", "chess_bullet", "chess_daily"].reduce((sum, mode) => {
    const record = at(stats, mode, "record");
    return sum + (num(at(record, "win")) ?? 0) + (num(at(record, "loss")) ?? 0) + (num(at(record, "draw")) ?? 0);
  }, 0);
  const avatar = at(profile, "avatar");
  const league = at(profile, "league");
  return {
    rapid: num(at(stats, "chess_rapid", "last", "rating")),
    puzzles: num(at(stats, "tactics", "highest", "rating")),
    games,
    league: typeof league === "string" && league ? league : null,
    // Only accept chess.com's own image host for the avatar.
    avatar: typeof avatar === "string" && /^https:\/\/images\.chesscomfiles\.com\//.test(avatar) ? avatar : null,
  };
}

export const chessComUrls = (username: string) => {
  const name = encodeURIComponent(username);
  return {
    profileApi: `https://api.chess.com/pub/player/${name}`,
    statsApi: `https://api.chess.com/pub/player/${name}/stats`,
    profile: `https://www.chess.com/member/${name}`,
    challenge: `https://www.chess.com/play/online/new?opponent=${name}`,
  };
};

/** Spotify has no keyless lookup API, so link to its search for the song and artist. */
export function spotifySearchUrl(title: string, artist: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist.replace(/\s*&\s*/g, " ")}`)}`;
}
