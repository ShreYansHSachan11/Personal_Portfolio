#!/usr/bin/env node
/**
 * Finds real cover art for the hero's "what I'm into" lists and writes the image URLs to
 * src/components/portfolio/hero/covers.ts, keyed by item title.
 *
 *   books  → Open Library covers (free, no key)
 *   music  → iTunes Search API album artwork (free, no key)
 *   movies → Wikipedia page-summary posters (free, no key)
 *
 * Songs also get their 30-second iTunes preview clip and Apple Music link, written to
 * src/components/portfolio/hero/previews.ts.
 *
 * Run `npm run covers` after editing the lists in content.ts. Only URLs are stored; the
 * images and audio stay on those services' CDNs. Items it cannot match are reported and simply
 * fall back to the drawn placeholder cover in the panel.
 */
import { readFile, writeFile } from "node:fs/promises";

const CONTENT = new URL("../src/components/portfolio/content.ts", import.meta.url);
const OUT = new URL("../src/components/portfolio/hero/covers.ts", import.meta.url);
const PREVIEWS_OUT = new URL("../src/components/portfolio/hero/previews.ts", import.meta.url);
/** Only these hosts are written out, so a bad API answer can't put arbitrary URLs in the app. */
const isHttpsOn = (url, hosts) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

/** Node can import the TypeScript content file directly (built-in type stripping, Node 22.18+). */
const { interests } = await import(CONTENT.href);

const norm = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)|\[.*?\]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const sameish = (a, b) => norm(a) === norm(b) || norm(a).startsWith(`${norm(b)} `) || norm(b).startsWith(`${norm(a)} `);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "portfolio-cover-resolver/1.0" } });
      if (res.ok) {
        const data = await res.json();
        // iTunes sometimes answers an empty list under load; retry those too.
        if (!("resultCount" in data) || data.resultCount > 0 || i === tries - 1) return data;
      } else if (res.status === 404) {
        return null;
      }
    } catch {
      // Network hiccup: retry below.
    }
    await sleep(800 * (i + 1));
  }
  return null;
}

/** iTunes artwork URLs end in /100x100bb.jpg; the CDN serves any size we ask for. */
const bigArt = (url, size) => url.replace(/\/\d+x\d+bb\.(jpg|png)$/, `/${size}bb.$1`);

async function book({ title, meta }) {
  const q = new URLSearchParams({ title, author: meta.split(/&| and /)[0].trim(), limit: "5", fields: "title,cover_i" });
  const data = await getJson(`https://openlibrary.org/search.json?${q}`);
  const hit = data?.docs?.find((d) => d.cover_i && sameish(d.title, title)) ?? data?.docs?.find((d) => d.cover_i);
  return hit ? `https://covers.openlibrary.org/b/id/${hit.cover_i}-L.jpg` : null;
}

async function song({ title, meta }) {
  const artist = meta.split(/&| and /)[0].trim();
  const q = new URLSearchParams({ term: `${title} ${artist}`, media: "music", entity: "song", limit: "25" });
  const data = await getJson(`https://itunes.apple.com/search?${q}`);
  const results = data?.results ?? [];
  // Score candidates so the original release beats remixes, live cuts and covers.
  const score = (r) =>
    (norm(r.artistName) === norm(artist) ? 4 : norm(r.artistName).includes(norm(artist)) ? 2 : -10) +
    (r.trackName.toLowerCase() === title.toLowerCase() ? 4 : norm(r.trackName) === norm(title) ? 2 : sameish(r.trackName, title) ? 1 : -10) +
    (/remix|live|version|acoustic|instrumental|karaoke|sped|slowed|lo-?fi|flip|mashup|reverb|\b8d\b/i.test(`${r.trackName} ${r.collectionName}`) ? -5 : 0) +
    // Prefer the original album (e.g. a film soundtrack) over "best of" compilations.
    (/best of|hits|greatest|mix\b|collection|essentials/i.test(r.collectionName) ? -2 : 0);
  const hit = results.map((r) => ({ r, s: score(r) })).filter((c) => c.s > 0).sort((a, b) => b.s - a.s)[0]?.r;
  if (!hit) return null;
  if (isHttpsOn(hit.previewUrl, ["itunes.apple.com"]) && isHttpsOn(hit.trackViewUrl, ["music.apple.com"])) {
    // Keep only `i` (the track within the album); drop the tracking params iTunes appends.
    const link = new URL(hit.trackViewUrl);
    for (const key of [...link.searchParams.keys()]) if (key !== "i") link.searchParams.delete(key);
    previews[title] = { audio: hit.previewUrl, link: link.href };
  }
  return bigArt(hit.artworkUrl100, "600x600");
}

/** Film posters come from the Wikipedia page summary; the description must name the year and "film". */
async function movie({ title, meta }) {
  const pages = [`${title} (${meta} film)`, `${title} (film)`, title];
  for (const page of pages) {
    const data = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.replaceAll(" ", "_"))}`, 2);
    const src = data?.originalimage?.source;
    if (src && /film/i.test(data.description ?? "") && (data.description ?? "").includes(meta)) return src.split("?")[0];
  }
  return null;
}

const resolvers = { books: book, music: song, movies: movie };
// Keep earlier matches when a lookup fails this time (APIs are occasionally flaky).
const previous = {};
const existing = await readFile(OUT, "utf8").catch(() => "");
for (const [, key, url] of existing.matchAll(/^\s*(".*?"): (".*?"),?$/gm)) previous[JSON.parse(key)] = JSON.parse(url);
const covers = {};
const previews = {};
const missing = [];

for (const interest of interests) {
  const resolve = resolvers[interest.kind];
  if (!resolve) continue;
  for (const item of interest.items) {
    const url = (await resolve(item)) ?? previous[item.title] ?? null;
    if (url) covers[item.title] = url;
    else missing.push(`${interest.label}: ${item.title} (${item.meta})`);
    await sleep(350); // Be polite to both APIs.
  }
}

const body = Object.entries(covers).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n");
await writeFile(
  OUT,
  `// Generated by scripts/resolve-covers.mjs (npm run covers). Cover art URLs keyed by item title.\nexport const covers: Readonly<Record<string, string>> = {\n${body}\n};\n`,
);
console.log(`Wrote ${Object.keys(covers).length} covers to ${OUT.pathname}`);

// Keep earlier previews for songs whose lookup failed this run.
const oldPreviews = await readFile(PREVIEWS_OUT, "utf8").catch(() => "");
for (const [, key, audio, link] of oldPreviews.matchAll(/^\s*(".*?"): \{ audio: (".*?"), link: (".*?") \},?$/gm)) {
  const title = JSON.parse(key);
  const stillListed = interests.some((i) => i.kind === "music" && i.items.some((it) => it.title === title));
  if (stillListed && !previews[title]) previews[title] = { audio: JSON.parse(audio), link: JSON.parse(link) };
}
const previewBody = Object.entries(previews)
  .map(([k, v]) => `  ${JSON.stringify(k)}: { audio: ${JSON.stringify(v.audio)}, link: ${JSON.stringify(v.link)} },`)
  .join("\n");
await writeFile(
  PREVIEWS_OUT,
  `// Generated by scripts/resolve-covers.mjs (npm run covers). 30-second iTunes preview clips and Apple Music links, keyed by song title.\nexport const previews: Readonly<Record<string, { audio: string; link: string }>> = {\n${previewBody}\n};\n`,
);
console.log(`Wrote ${Object.keys(previews).length} song previews to ${PREVIEWS_OUT.pathname}`);
if (missing.length) console.log(`No match (placeholder art will be used):\n  ${missing.join("\n  ")}`);
