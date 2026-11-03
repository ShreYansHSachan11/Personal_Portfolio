#!/usr/bin/env node
/**
 * Generates the animated SVG artwork for the GitHub profile README.
 *
 * GitHub shows README images through <img>, so there is no JavaScript and no web fonts. Each piece is a
 * self-contained SVG animated with SMIL + CSS, text uses system font stacks, and what the pointer drove on
 * the website becomes a precomputed, seamlessly looping "autopilot" timeline.
 *
 * Run: node github-profile/generate.mjs   →   writes github-profile/assets/*.svg
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "assets");

/* ---------- colour: the site's OKLCH tokens, converted to hex for every SVG renderer ---------- */

const ok = (L, C, h) => ({ L, C, h });
function hex({ L, C, h }) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${linear
    .map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055))
    .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}
/** Like CSS color-mix(in oklch, a t, b): `t` is the weight of `a`. */
function mix(a, b, t) {
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return { L: a.L * t + b.L * (1 - t), C: a.C * t + b.C * (1 - t), h: a.h + dh * (1 - t) };
}

const T = {
  background: ok(0.975, 0.012, 85), foreground: ok(0.2, 0.02, 270), card: ok(0.99, 0.006, 85),
  primary: ok(0.66, 0.2, 35), secondary: ok(0.52, 0.2, 262), secondaryForeground: ok(0.99, 0.01, 85),
  muted: ok(0.94, 0.015, 85), mutedForeground: ok(0.48, 0.02, 270), accent: ok(0.9, 0.17, 125), pink: ok(0.82, 0.11, 350),
  ink: ok(0.16, 0.01, 260), cream: ok(0.975, 0.008, 85), amber: ok(0.8, 0.14, 75), violet: ok(0.66, 0.2, 300),
};
const C = {
  ...Object.fromEntries(Object.entries(T).map(([k, v]) => [k, hex(v)])),
  peach: hex(mix(T.primary, T.background, 0.35)),
  rose: hex(mix(T.pink, T.card, 0.72)),
  deepBlue: hex(mix(T.secondary, T.foreground, 0.65)),
  torusBack: hex(mix(T.secondary, T.foreground, 0.7)),
  sphereLight: hex(mix(T.primary, T.card, 0.55)),
  sphereDark: hex(mix(T.primary, T.foreground, 0.72)),
  lime2: hex(mix(T.accent, T.secondary, 0.72)),
  person: hex(T.pink), phone: hex(mix(T.secondary, T.card, 0.4)), place: hex(mix(T.primary, T.card, 0.55)),
  date: hex(T.accent), id: hex(mix(T.secondary, T.accent, 0.22)), lensTint: hex(mix(T.accent, T.card, 0.22)),
  ticket: hex(mix(T.cream, T.ink, 0.06)),
};

/* ---------- shared helpers ---------- */

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const f = (v) => +v.toFixed(2);
const pt = ([x, y]) => `${f(x)} ${f(y)}`;
const loop = (values) => [...values, values[0]];
const repeat = (s, n) => Array.from({ length: n }, () => s).join(";");

const BASE_CSS = `
.d{font-family:'Arial Black','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900}
.s{font-family:Georgia,'Times New Roman',serif;font-style:italic}
.q{font-family:Georgia,'Times New Roman',serif}
.t{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
.m{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace}`;
const REDUCED = (extra = "") => `@media (prefers-reduced-motion:reduce){*{animation:none!important}${extra}}`;

function svg(w, h, title, body, css = "", defs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title">
<title id="title">${esc(title)}</title>
<style>${BASE_CSS}${css}</style>
<defs>
<clipPath id="frame"><rect width="${w}" height="${h}" rx="18"/></clipPath>
<filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="${C.foreground}" flood-opacity=".22"/></filter>
<filter id="lift" x="-20%" y="-40%" width="140%" height="200%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="${C.foreground}" flood-opacity=".18"/></filter>
${defs}
</defs>
<g clip-path="url(#frame)">${body}</g>
</svg>
`;
}

const animate = (attr, values, dur, extra = "") =>
  `<animate attributeName="${attr}" values="${values.join(";")}" dur="${dur}s" repeatCount="indefinite" ${extra}/>`;
const translate = (values, dur, extra = "") =>
  `<animateTransform attributeName="transform" type="translate" values="${values.join(";")}" dur="${dur}s" repeatCount="indefinite" ${extra}/>`;
const spline = (segments, curve = ".45 0 .55 1") =>
  `calcMode="spline" keyTimes="${Array.from({ length: segments + 1 }, (_, i) => f(i / segments)).join(";")}" keySplines="${repeat(curve, segments)}"`;

/** Deterministic PRNG (same as the website) so the generated layout never changes between runs. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- 1. header banner ---------- */

function star(x, y, r = 9) {
  return `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${C.foreground}"/>`;
}

function header() {
  const W = 1200, H = 400;
  const skills = ["React.js", "Redux", "JavaScript", "Node.js", "Express.js", "Python", "C++", "FastAPI", "MongoDB", "Redis", "Socket.io", "RAG pipelines"];
  let x = 0;
  let items = "";
  for (const s of skills) {
    items += `<text x="${x}" y="0" class="d" font-size="22" fill="${C.foreground}">${esc(s)}</text>${star(x + s.length * 16 + 22, -8)}`;
    x += s.length * 16 + 64;
  }
  const period = x;

  const css = `
.flow{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 3.2s .3s cubic-bezier(.3,.7,.2,1) forwards}
@keyframes draw{to{stroke-dashoffset:0}}
.marquee{animation:marquee 46s linear infinite}
@keyframes marquee{to{transform:translateX(-${period}px)}}
.float-a{animation:float 6s ease-in-out infinite}
.float-b{animation:float 7s -2s ease-in-out infinite}
.float-c{animation:float 8s -4s ease-in-out infinite}
@keyframes float{50%{transform:translateY(-12px)}}
.spin{transform-box:fill-box;transform-origin:center;animation:spin 16s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.rise{opacity:0;animation:rise .9s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
${REDUCED(".flow{stroke-dashoffset:0}.rise{opacity:1}")}`;

  const defs = `
<radialGradient id="sphere" cx=".34" cy=".3" r=".8"><stop offset="0" stop-color="${C.sphereLight}"/><stop offset=".5" stop-color="${C.primary}"/><stop offset="1" stop-color="${C.sphereDark}"/></radialGradient>
<radialGradient id="pinkball" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".35" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.pink}"/></radialGradient>
<pattern id="grain" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${C.foreground}" fill-opacity=".07"/></pattern>`;

  const body = `
<rect width="${W}" height="${H}" fill="${C.background}"/>
<rect width="${W}" height="${H}" fill="url(#grain)"/>
<path class="flow" pathLength="1" d="M1180 -20C1000 90 1140 230 905 300S560 300 470 430" fill="none" stroke="${C.pink}" stroke-width="3" stroke-linecap="round"/>

<g class="rise">
  <circle cx="70" cy="86" r="5" fill="${C.primary}"/>
  <text x="84" y="91" class="t" font-size="14" font-weight="700" letter-spacing="2" fill="${C.foreground}">FRONTEND DEVELOPER @ PINNTAG</text>
  <text x="62" y="176" class="d" font-size="80" fill="${C.foreground}">Shreyansh<tspan fill="${C.primary}">.</tspan></text>
  <text x="64" y="246" class="s" font-size="70" fill="${C.secondary}">Code meets</text>
  <text x="62" y="316" class="d" font-size="68" fill="${C.foreground}">curiosity.</text>
</g>

<g transform="translate(900 172)"><g class="float-a">
  <g transform="rotate(-16)"><ellipse rx="160" ry="54" fill="none" stroke="${C.torusBack}" stroke-width="28"/></g>
  <circle r="96" fill="url(#sphere)"/>
  <ellipse cx="-30" cy="-38" rx="26" ry="16" fill="#fff" fill-opacity=".28" transform="rotate(-30 -30 -38)"/>
  <g transform="rotate(-16)">
    <path d="M-160 0A160 54 0 0 0 160 0" fill="none" stroke="${C.secondary}" stroke-width="28" stroke-linecap="round"/>
    <path d="M-148 10A150 46 0 0 0 148 10" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="5" stroke-linecap="round"/>
  </g>
</g></g>
<g transform="translate(712 282)"><g class="float-b"><g class="spin">
  <rect x="-30" y="-30" width="60" height="60" rx="11" fill="${C.accent}"/>
  <path d="M-30 14L30 14L30 19Q30 30 19 30L-19 30Q-30 30 -30 19Z" fill="${C.lime2}"/>
</g></g></g>
<g transform="translate(1040 76)"><g class="float-c"><circle r="20" fill="url(#pinkball)"/></g></g>
<g transform="translate(1062 292)"><g class="float-a">
  <circle r="25" fill="none" stroke="${C.muted}" stroke-width="15"/>
  <circle r="25" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="3" stroke-dasharray="30 200"/>
</g></g>

<g transform="rotate(-2.2 600 360)">
  <rect x="-60" y="334" width="1320" height="54" fill="${C.accent}" stroke="${C.foreground}" stroke-width="3"/>
  <g transform="translate(0 370)"><g class="marquee"><g>${items}</g><g transform="translate(${period} 0)">${items}</g></g></g>
</g>`;
  return svg(W, H, "Shreyansh Sachan — Code meets curiosity. Frontend developer at Pinntag.", body, css, defs);
}

/* ---------- 2. Sherlock: redaction lens ---------- */

function sherlock() {
  const W = 600, H = 380, CW = 8.4, X0 = 88, Y0 = 152, LH = 27;
  const LINES = [
    ["On ", ["DATE", 13], ", ", ["PERSON", 13], " reported a"],
    ["stolen phone near ", ["PLACE", 18], "."],
    ["Reach him on ", ["PHONE", 11], "."],
    ["Witness ", ["PERSON", 10], " saw a scooter,"],
    ["plate ", ["ID", 13], ", seen at ", ["DATE", 5], "."],
    ["Recorded by ", ["PERSON", 14], ", badge ", ["ID", 6], "."],
  ];
  const ENTITY = { PERSON: C.person, PHONE: C.phone, PLACE: C.place, DATE: C.date, ID: C.id };
  const texts = [];
  const bars = [];
  LINES.forEach((line, i) => {
    let x = X0;
    const y = Y0 + i * LH;
    for (const item of line) {
      if (typeof item === "string") {
        texts.push({ x, y, s: item });
        x += item.length * CW;
      } else {
        const [kind, chars] = item;
        bars.push({ x: x + 2, y, w: chars * CW, kind });
        x += chars * CW + 4;
      }
    }
  });

  const paper = (detected) => {
    const textFill = detected ? `fill="${C.foreground}" fill-opacity=".32"` : `fill="${C.foreground}" fill-opacity=".82"`;
    return `
<rect x="60" y="42" width="480" height="300" rx="9" fill="${detected ? C.lensTint : C.card}" ${detected ? "" : 'filter="url(#shadow)"'}/>
${detected ? `<rect x="60" y="42" width="480" height="300" rx="9" fill="url(#grid)"/>` : ""}
<text x="${X0}" y="74" class="m" font-size="10" letter-spacing="1" fill="${C.mutedForeground}">CASE FILE № 2291</text>
<rect x="424" y="58" width="92" height="22" rx="5" fill="none" stroke="${detected ? C.secondary : C.primary}" stroke-width="2" transform="rotate(4 470 69)"/>
<text x="470" y="73" text-anchor="middle" class="t" font-size="10" font-weight="800" letter-spacing="1" fill="${detected ? C.secondary : C.primary}" transform="rotate(4 470 69)">${detected ? "DETECTED" : "ANONYMIZED"}</text>
<text x="${X0}" y="116" class="q" font-size="31" ${detected ? textFill : `fill="${C.foreground}"`}>Statement of record<tspan fill="${C.primary}">.</tspan></text>
${texts.map((t) => `<text x="${f(t.x)}" y="${t.y}" class="m" font-size="14" xml:space="preserve" ${textFill}>${esc(t.s)}</text>`).join("")}
${bars
  .map((b) =>
    detected
      ? `<rect x="${f(b.x)}" y="${b.y - 13}" width="${f(b.w)}" height="17" rx="3" fill="${ENTITY[b.kind]}"/><text x="${f(b.x + b.w / 2)}" y="${b.y - 1.5}" text-anchor="middle" class="t" font-size="8.5" font-weight="800" letter-spacing="1" fill="${C.foreground}">${b.kind}</text>`
      : `<rect x="${f(b.x)}" y="${b.y - 13}" width="${f(b.w)}" height="17" rx="3" fill="${C.foreground}"/>`,
  )
  .join("")}
<line x1="${X0}" y1="306" x2="512" y2="306" stroke="${C.foreground}" stroke-opacity=".15" stroke-dasharray="4 4"/>
<text x="${X0}" y="326" class="m" font-size="10" fill="${C.mutedForeground}">${bars.length} entities found</text>
<text x="512" y="326" text-anchor="end" class="m" font-size="10" fill="${C.mutedForeground}">0 exposed</text>`;
  };

  // The lens tours the redactions; clip circle and lens frame share one timeline so they stay locked.
  const tour = [0, 3, 1, 2, 4, 6, 8, 7].map((i) => {
    const b = bars[i];
    return [b.x + b.w / 2, b.y - 5];
  });
  const DUR = 16;
  const path = loop(tour);
  const timing = spline(tour.length);
  const r = 64;

  const defs = `
<pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="${C.secondary}" stroke-opacity=".14"/></pattern>
<clipPath id="lens"><circle r="${r - 3}">${animate("cx", path.map((p) => f(p[0])), DUR, timing)}${animate("cy", path.map((p) => f(p[1])), DUR, timing)}</circle></clipPath>`;

  const body = `
<rect width="${W}" height="${H}" fill="${C.peach}"/>
<g transform="rotate(-2.5 300 192)">
  ${paper(false)}
  <g clip-path="url(#lens)">${paper(true)}</g>
  <g>
    ${translate(path.map(pt), DUR, timing)}
    <circle r="${r}" fill="none" stroke="${C.foreground}" stroke-width="7" filter="url(#lift)"/>
    <circle r="${r - 5}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>
    <line x1="${f(r * 0.72)}" y1="${f(r * 0.72)}" x2="${f(r * 0.72 + 34)}" y2="${f(r * 0.72 + 34)}" stroke="${C.foreground}" stroke-width="11" stroke-linecap="round"/>
  </g>
</g>`;
  return svg(W, H, "Sherlock — a case file with personal data redacted; a magnifying lens reveals what kind of data each redaction hides.", body, REDUCED(), defs);
}

/* ---------- 3. NextHire: embedding space ---------- */

function nexthire() {
  const W = 600, H = 380, N = 72, DUR = 26, K = 3;
  const CLUSTERS = [
    { name: "Frontend", x: 22, y: 32, tone: C.accent, roles: ["Frontend Engineer", "React Developer", "UI Engineer"] },
    { name: "AI / ML", x: 76, y: 30, tone: C.pink, roles: ["ML Engineer", "AI Engineer", "NLP Engineer"] },
    { name: "Full-stack", x: 50, y: 56, tone: C.secondaryForeground, roles: ["Full-stack Engineer", "Product Engineer", "Software Engineer"] },
    { name: "Backend", x: 23, y: 76, tone: C.primary, roles: ["Backend Engineer", "Node.js Developer", "Platform Engineer"] },
    { name: "Data", x: 78, y: 75, tone: C.accent, roles: ["Data Engineer", "Data Analyst", "Analytics Engineer"] },
  ];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const rand = mulberry32(11);
  const jobs = CLUSTERS.flatMap((c) =>
    Array.from({ length: 7 }, (_, i) => ({
      x: (clamp(c.x + (rand() - 0.5) * 22, 5, 95) / 100) * W,
      y: (clamp(c.y + (rand() - 0.5) * 20, 10, 92) / 100) * H,
      tone: c.tone,
      role: c.roles[i % c.roles.length],
    })),
  );

  // Autopilot: a closed figure-eight, sampled N times; nearest neighbours are precomputed per sample.
  const you = Array.from({ length: N }, (_, i) => {
    const s = i / N;
    return [(0.5 + 0.31 * Math.sin(2 * Math.PI * s)) * W, (0.52 + 0.27 * Math.sin(4 * Math.PI * s + 1.3)) * H];
  });
  const near = you.map(([x, y]) =>
    jobs
      .map((j, index) => ({ index, d: Math.hypot(j.x - x, j.y - y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, K),
  );
  const score = (d) => Math.min(0.99, Math.max(0.5, 1 - d / 330)).toFixed(2);

  const youPath = loop(you);
  const rings = Array.from({ length: 10 }, (_, k) =>
    `<circle r="${(k + 1) * 34}" fill="none" stroke="${C.secondaryForeground}" stroke-opacity=".1">${animate("cx", youPath.map((p) => f(p[0])), DUR)}${animate("cy", youPath.map((p) => f(p[1])), DUR)}</circle>`,
  ).join("");
  const lines = Array.from({ length: K }, (_, k) => {
    const end = loop(near.map((n) => jobs[n[k].index]));
    const style = k === 0 ? `stroke="${C.accent}" stroke-width="2.5"` : `stroke="${C.secondaryForeground}" stroke-opacity=".7" stroke-width="1.4" stroke-dasharray="4 5"`;
    return `<line ${style}>${animate("x1", youPath.map((p) => f(p[0])), DUR)}${animate("y1", youPath.map((p) => f(p[1])), DUR)}${animate("x2", end.map((j) => f(j.x)), DUR)}${animate("y2", end.map((j) => f(j.y)), DUR)}</line>`;
  }).join("");
  const points = jobs
    .map((j, i) => {
      const matched = near.map((n) => n.some((m) => m.index === i));
      const anim = matched.some(Boolean)
        ? animate("r", matched.map((m) => (m ? 7 : 4)), DUR, 'calcMode="discrete"') + animate("fill-opacity", matched.map((m) => (m ? 1 : 0.55)), DUR, 'calcMode="discrete"')
        : "";
      return `<circle cx="${f(j.x)}" cy="${f(j.y)}" r="4" fill="${j.tone}" fill-opacity=".55">${anim}</circle>`;
    })
    .join("");

  // Best-match card: discrete position, with one text element per role / score toggled on when active.
  const best = near.map((n) => ({ job: jobs[n[0].index], score: score(n[0].d) }));
  const cardW = 160;
  const cardPos = best.map(({ job }) => [job.x > W * 0.6 ? job.x - 22 - cardW : job.x + 22, Math.max(10, job.y - 66)]);
  const toggles = (key, values) =>
    [...new Set(values)].map((v) => ({ v, on: values.map((x) => (x === v ? 1 : 0)) })).map(({ v, on }) => key(v, animate("opacity", on, DUR, 'calcMode="discrete"')));
  const roleTexts = toggles((v, a) => `<text x="12" y="19" class="t" font-size="12.5" font-weight="700" fill="${C.foreground}" opacity="0">${esc(v)}${a}</text>`, best.map((b) => b.job.role)).join("");
  const scoreTexts = toggles((v, a) => `<text x="12" y="35" class="s" font-size="14" fill="${C.secondary}" opacity="0">${v}${a}</text>`, best.map((b) => b.score)).join("");

  const defs = `<radialGradient id="space" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="${C.secondary}"/><stop offset="1" stop-color="${C.deepBlue}"/></radialGradient>`;
  const body = `
<rect width="${W}" height="${H}" fill="url(#space)"/>
${rings}
${CLUSTERS.map((c) => `<text x="${f((c.x / 100) * W)}" y="${f(((c.y - 13) / 100) * H)}" text-anchor="middle" class="t" font-size="9.5" letter-spacing="2" fill="${C.secondaryForeground}" fill-opacity=".6">${esc(c.name.toUpperCase())}</text>`).join("")}
${lines}
${points}
<g>${translate(youPath.map(pt), DUR)}
  <path d="M-12 -14C2 -20 18 -6 14 8C10 20 -8 20 -14 6C-18 -4 -18 -11 -12 -14Z" fill="${C.accent}"/>
  <path d="M14 8C10 20 -8 20 -14 6C-6 12 6 12 14 8Z" fill="${C.lime2}"/>
  <text y="34" text-anchor="middle" class="t" font-size="10" letter-spacing=".5" fill="${C.secondaryForeground}">your resume</text>
</g>
<g>${translate(cardPos.map(pt), DUR, 'calcMode="discrete"')}
  <rect width="${cardW}" height="44" rx="8" fill="${C.card}" filter="url(#lift)"/>
  ${roleTexts}${scoreTexts}
  <text x="50" y="35" class="t" font-size="10" fill="${C.mutedForeground}">match</text>
</g>
<text x="24" y="30" class="t" font-size="10" letter-spacing="1.5" fill="${C.secondaryForeground}" fill-opacity=".75">SEMANTIC SEARCH · TOP ${K}</text>
<text x="24" y="${H - 22}" class="t" font-size="10" letter-spacing="1.5" fill="${C.secondaryForeground}" fill-opacity=".75">NEXTHIRE — MATCHED BY MEANING</text>`;
  return svg(W, H, "NextHire — jobs in an embedding space; a resume finds its nearest roles by meaning.", body, REDUCED(), defs);
}

/* ---------- 4. Guardian: relief pulses and an open ledger ---------- */

function guardian() {
  const W = 600, H = 380, CYCLE = 2.4, BW = 88, BH = 64, SLOT = 106, ROW_Y = 278;
  const slots = [52, 158, 264, 370, 476];
  const NEW_AT = 0.5; // fraction of a cycle when a coin lands and its block appears

  const block = (x, dark = false) => `
<g transform="translate(${x} ${ROW_Y})">
  <line x1="-18" y1="${BH / 2}" x2="0" y2="${BH / 2}" stroke="${C.foreground}" stroke-width="3"/>
  <rect width="${BW}" height="${BH}" rx="9" fill="${C.card}" stroke="${C.foreground}" stroke-width="2.5">${dark ? animate("fill", [C.foreground, C.foreground, C.card], CYCLE, 'keyTimes="0;.62;1"') : ""}</rect>
  <text x="11" y="23" class="d" font-size="13" fill="${C.foreground}">BLOCK${dark ? animate("fill", [C.card, C.card, C.foreground], CYCLE, 'keyTimes="0;.62;1"') : ""}</text>
  <g fill="${C.foreground}" fill-opacity=".45">${[0, 1, 2, 3, 4].map((i) => `<rect x="${11 + i * 12}" y="31" width="${[8, 5, 9, 4, 7][i]}" height="5" rx="1.5"/>`).join("")}${dark ? animate("fill", [C.card, C.card, C.foreground], CYCLE, 'keyTimes="0;.62;1"') : ""}</g>
  <text x="11" y="53" class="t" font-size="10" font-weight="600" fill="${dark ? C.accent : C.secondary}">verified ✓${dark ? animate("fill", [C.accent, C.accent, C.secondary], CYCLE, 'keyTimes="0;.62;1"') : ""}</text>
</g>`;

  const pings = [
    { text: "Shelter open · Sector 4", x: 300, y: 40, delay: 0 },
    { text: "Water needed · Ward 9", x: 410, y: 186, delay: 2.4 },
    { text: "Route clear · NH-48", x: 180, y: 176, delay: 4.8 },
  ]
    .map((p) => `<g transform="translate(${p.x} ${p.y})"><g class="ping" style="animation-delay:${p.delay}s">
  <rect y="-13" width="${f(p.text.length * 6.1 + 34)}" height="26" rx="13" fill="${C.card}" filter="url(#lift)"/>
  <circle cx="14" r="3.5" fill="${C.primary}"/>
  <text x="24" y="4" class="t" font-size="11" fill="${C.foreground}">${esc(p.text)}</text></g></g>`)
    .join("");

  // Three coins per 7.2s, each dropping from a different spot onto the newest block.
  const end = [slots[4] + BW / 2, ROW_Y + BH / 2];
  const coins = [160, 330, 240]
    .map((x0, k) => {
      const s = f((k * CYCLE + 0.35) / (3 * CYCLE));
      const l = f((k * CYCLE + NEW_AT * CYCLE) / (3 * CYCLE));
      return `<g opacity="0">
  ${translate([pt([x0, 120]), pt([x0, 120]), pt(end), pt(end)], 3 * CYCLE, `calcMode="spline" keyTimes="0;${s};${l};1" keySplines="0 0 1 1;.55 0 .85 .4;0 0 1 1"`)}
  ${animate("opacity", [0, 0, 1, 1, 0, 0], 3 * CYCLE, `keyTimes="0;${s};${f(s + 0.01)};${l};${f(l + 0.01)};1"`)}
  <circle r="13" fill="${C.primary}" stroke="${C.foreground}" stroke-width="3"/>
  <text y="5" text-anchor="middle" class="t" font-size="13" font-weight="800" fill="${C.card}">Ξ</text></g>`;
    })
    .join("");

  const css = `.ping{opacity:0;animation:ping 7.2s infinite}
@keyframes ping{0%,100%{opacity:0;transform:translateY(6px)}6%,30%{opacity:1;transform:none}38%{opacity:0;transform:translateY(-4px)}}
${REDUCED(".ping{opacity:1}")}`;
  const defs = `
<pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${C.foreground}" fill-opacity=".16"/></pattern>
<clipPath id="row"><rect x="36" y="${ROW_Y - 6}" width="528" height="${BH + 12}"/></clipPath>`;

  const body = `
<rect width="${W}" height="${H}" fill="${C.accent}"/>
<rect width="${W}" height="${H}" fill="url(#dots)"/>
<text x="34" y="66" class="s" font-size="38" fill="${C.foreground}">Help,</text>
<text x="34" y="106" class="s" font-size="38" fill="${C.foreground}">in the open.</text>
${[0, 1.2, 2.4].map((b) => `<circle cx="430" cy="118" r="8" fill="none" stroke="${C.primary}" stroke-width="2" opacity="0">${animate("r", [8, 112], 3.6, `begin="${b}s"`)}${animate("opacity", [0.9, 0], 3.6, `begin="${b}s"`)}</circle>`).join("")}
<circle cx="430" cy="118" r="13" fill="${C.primary}" fill-opacity=".3"/>
<circle cx="430" cy="118" r="7" fill="${C.primary}"/>
${pings}
<text x="36" y="262" class="t" font-size="10" font-weight="700" letter-spacing="1.5" fill="${C.foreground}">OPEN LEDGER</text>
<text x="564" y="262" text-anchor="end" class="t" font-size="10" font-weight="700" letter-spacing="1.5" fill="${C.foreground}">EVERY DONATION, TRACEABLE</text>
<g clip-path="url(#row)">
  <g>${translate(["0 0", "0 0", `-${SLOT} 0`, `-${SLOT} 0`], CYCLE, 'calcMode="spline" keyTimes="0;.04;.26;1" keySplines="0 0 1 1;.3 0 .2 1;0 0 1 1"')}
    ${slots.map((x) => block(x)).join("")}
  </g>
  <g opacity="0">${animate("opacity", [0, 0, 1, 1], CYCLE, `keyTimes="0;${NEW_AT};${NEW_AT + 0.04};1"`)}${block(slots[4], true)}</g>
</g>
${coins}`;
  return svg(W, H, "Guardian — live relief updates pulse out while each donation drops onto an open, traceable ledger.", body, css, defs);
}

/* ---------- 5. Resolv: one incident moving through four agents ---------- */

function resolv() {
  const W = 600, H = 380, STEP = 2.2;
  const STAGES = [
    { agent: "Triage", status: "Assigned", tone: C.cream, ink: C.ink, note: "Network Ops · on-shift engineer", at: "+0:04" },
    { agent: "Acknowledge", status: "Acknowledged", tone: C.accent, ink: C.ink, note: "Caller acknowledged · ACK-02", at: "+0:09" },
    { agent: "Pending", status: "On hold", tone: C.amber, ink: C.ink, note: "Reminder scheduled in 4h", at: "+1h 12m" },
    { agent: "Resolution", status: "Resolved", tone: C.violet, ink: C.cream, note: "Caller confirmed · auto-resolved", at: "+4h 32m" },
  ];
  const n = STAGES.length;
  const DUR = n * STEP;
  // One value per stage, switched at each stage boundary.
  const staged = (attr, values) => animate(attr, values, DUR, `calcMode="discrete" keyTimes="${values.map((_, i) => f(i / n)).join(";")}"`);
  const per = (fn) => STAGES.map((_, k) => fn(k));

  const NODE_X = [112, 237, 362, 487], TRACK_Y = 330;
  // The lime progress line eases to the next node at the start of each stage.
  const ease = 0.035;
  const progressTimes = [0, ...STAGES.slice(1).flatMap((_, k) => [f((k + 1) / n), f((k + 1) / n + ease)]), 1];
  const progressValues = [NODE_X[0], ...STAGES.slice(1).flatMap((_, k) => [NODE_X[k], NODE_X[k + 1]]), NODE_X[n - 1]];
  const progress = animate("x2", progressValues, DUR, `keyTimes="${progressTimes.join(";")}"`);
  const glow = translate(progressTimes.map((_, i) => `${progressValues[i]} ${TRACK_Y}`), DUR, `keyTimes="${progressTimes.join(";")}"`);

  const pills = STAGES.map((s, k) => {
    const w = f(s.status.length * 6.6 + 22);
    return `<g opacity="${k === 0 ? 1 : 0}">${staged("opacity", per((j) => (j === k ? 1 : 0)))}
  <rect x="${f(482 - w)}" y="91" width="${w}" height="20" rx="10" fill="${s.tone}"/>
  <text x="${f(482 - w / 2)}" y="105" text-anchor="middle" class="t" font-size="10.5" font-weight="700" fill="${s.ink}">${esc(s.status)}</text></g>`;
  }).join("");

  const rows = STAGES.map((s, i) => {
    const y = 210 + i * 21;
    const reached = per((k) => (k >= i ? 1 : 0));
    return `<g opacity="${i === 0 ? 1 : 0.28}">${staged("opacity", per((k) => (k > i ? 0.6 : k === i ? 1 : 0.28)))}
  <text x="118" y="${y}" class="t" font-size="11" font-weight="700" fill="${i === 0 ? C.accent : C.cream}">${esc(s.agent)}${staged("fill", per((k) => (k === i ? C.accent : C.cream)))}</text>
  <text x="206" y="${y}" class="t" font-size="11" fill="${C.cream}" opacity="${i === 0 ? 1 : 0}">${esc(s.note)}${staged("opacity", reached)}</text>
  <text x="206" y="${y}" class="t" font-size="11" fill="${C.cream}" opacity="${i === 0 ? 0 : 1}">waiting${staged("opacity", reached.map((r) => 1 - r))}</text>
  <text x="482" y="${y}" text-anchor="end" class="m" font-size="10.5" fill="${C.cream}" fill-opacity=".55" opacity="${i === 0 ? 1 : 0}">${s.at}${staged("opacity", reached)}</text></g>`;
  }).join("");

  const nodes = STAGES.map((s, i) => {
    const fill = per((k) => (k >= i ? C.accent : C.ink));
    const stroke = per((k) => (k >= i ? C.accent : C.cream));
    return `<circle cx="${NODE_X[i]}" cy="${TRACK_Y}" r="7" fill="${fill[0]}" stroke="${stroke[0]}" stroke-opacity="${i === 0 ? 1 : 0.55}" stroke-width="2.5">${staged("fill", fill)}${staged("stroke", stroke)}${staged("stroke-opacity", per((k) => (k >= i ? 1 : 0.55)))}</circle>
<circle cx="${NODE_X[i]}" cy="${TRACK_Y}" r="13" fill="${C.accent}" fill-opacity=".28" opacity="${i === 0 ? 1 : 0}">${staged("opacity", per((k) => (k === i ? 1 : 0)))}</circle>
<text x="${NODE_X[i]}" y="${TRACK_Y + 28}" text-anchor="middle" class="t" font-size="9.5" letter-spacing="1.5" fill="${C.cream}" fill-opacity="${i === 0 ? 1 : 0.55}">${esc(s.agent.toUpperCase())}${staged("fill-opacity", per((k) => (k === i ? 1 : 0.55)))}</text>`;
  }).join("");

  const css = `.blink{animation:blink 2.4s ease-in-out infinite}@keyframes blink{50%{opacity:.35}}${REDUCED()}`;
  const defs = `
<pattern id="rvgrid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="${C.cream}" stroke-opacity=".08"/></pattern>
<radialGradient id="rvglow"><stop offset="0" stop-color="${C.accent}" stop-opacity=".22"/><stop offset="1" stop-color="${C.accent}" stop-opacity="0"/></radialGradient>
<filter id="deep" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000" flood-opacity=".55"/></filter>`;

  const body = `
<rect width="${W}" height="${H}" fill="${C.ink}"/>
<rect width="${W}" height="${H}" fill="url(#rvgrid)"/>
<g>${glow}<circle r="190" fill="url(#rvglow)"/></g>
<text x="30" y="50" class="d" font-size="26" fill="${C.cream}">resol<tspan fill="${C.accent}">v</tspan></text>
<rect x="448" y="27" width="126" height="26" rx="13" fill="${C.cream}" fill-opacity=".05" stroke="${C.cream}" stroke-opacity=".14"/>
<circle class="blink" cx="464" cy="40" r="4" fill="${C.accent}"/>
<text x="476" y="44" class="t" font-size="11" fill="${C.cream}">4 agents online</text>
<g transform="rotate(-1.5 300 182)">
  <rect x="96" y="76" width="408" height="210" rx="14" fill="${C.ticket}" stroke="${C.cream}" stroke-opacity=".12" filter="url(#deep)"/>
  <text x="118" y="105" class="m" font-size="10.5" letter-spacing=".6" fill="${C.cream}" fill-opacity=".55">INC-2041 · P2</text>
  ${pills}
  <text x="118" y="144" class="t" font-size="22" font-weight="700" fill="${C.cream}">VPN drops right after</text>
  <text x="118" y="171" class="t" font-size="22" font-weight="700" fill="${C.cream}">a password reset</text>
  <line x1="118" y1="188" x2="482" y2="188" stroke="${C.cream}" stroke-opacity=".12"/>
  ${rows}
</g>
<line x1="${NODE_X[0]}" y1="${TRACK_Y}" x2="${NODE_X[n - 1]}" y2="${TRACK_Y}" stroke="${C.cream}" stroke-opacity=".14" stroke-width="3" stroke-linecap="round"/>
<line x1="${NODE_X[0]}" y1="${TRACK_Y}" x2="${NODE_X[0]}" y2="${TRACK_Y}" stroke="${C.accent}" stroke-width="3" stroke-linecap="round">${progress}</line>
${nodes}`;
  return svg(W, H, "Resolv — one incident moves through the triage, acknowledgement, pending and resolution agents, filling in its audit trail.", body, css, defs);
}

/* ---------- write ---------- */

mkdirSync(OUT, { recursive: true });
const files = { "header.svg": header(), "sherlock.svg": sherlock(), "nexthire.svg": nexthire(), "guardian.svg": guardian(), "resolv.svg": resolv() };
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content);
  console.log(`${name.padEnd(14)} ${(Buffer.byteLength(content) / 1024).toFixed(1)} KB`);
}
