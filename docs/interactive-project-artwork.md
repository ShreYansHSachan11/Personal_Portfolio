# Interactive project artwork: the method

A repeatable way to make a small, live illustration for a project card. Instead of a screenshot, each
piece shows the *idea* behind the project and responds to the pointer.

The four pieces in this portfolio are worked examples. They live in `src/components/portfolio/art/`.

---

## 1. Start from the metaphor, not the UI

Write one sentence about what the project *does*. Then find a visual system that acts that sentence out.

| Project | One-sentence job | Metaphor | What the pointer does |
|---|---|---|---|
| Sherlock (PII anonymization) | Finds personal data and hides it | A redacted case file plus a magnifying lens | The lens reveals the *type* of each redaction |
| NextHire (semantic job search) | Matches people to roles by meaning | Job dots in an "embedding space" | Your resume moves; the nearest roles light up |
| Guardian (disaster relief + blockchain) | Live updates and traceable donations | Alert rings, plus coins dropping onto a chain of blocks | Coins drop from where you point |
| FAQ Manager (translation + Redis) | One answer in every language, cached | One question that changes language | Moving across switches language; repeats are cache hits |

To find the metaphor, ask three questions:
- **What is the input?** (a document, a resume, a donation, a question)
- **What transformation happens?** (masking, matching, recording, translating)
- **What proves it worked?** (an entity label, a match score, a verified block, a cache hit)

Make the *proof* the moment the pointer triggers. Each resume bullet can then become a visible detail:
"reducing DB queries by 50%" becomes a live cache-hit counter.

**Rules of thumb**
- Use one interaction per piece. If it needs instructions, it's too complex.
- Show the result, not the interface. No fake navigation bars, sidebars or buttons.
- Never show fake data that looks real. The Sherlock lens shows entity *types*, never values, and the
  values in the source are fictional and only set the widths of the bars.
- Label illustrative numbers honestly, in code comments and in your copy. The timings and hashes in
  these pieces are decorative.

---

## 2. Architecture

```
art/
  usePointerField.ts   one hook: pointer → eased position, with autopilot, visibility and reduced motion
  art-logic.ts         pure functions (no React, no DOM), unit-tested
  art-logic.test.ts
  SherlockArt.tsx      one component per piece
  …
ProjectPreview.tsx     maps a content key → component; wraps it in aria-hidden
```

The content file only stores a key, for example `art: "redaction"`, so content stays data and the art
stays code.

### 2.1 The pointer-field hook (the engine)

Every piece is driven by one hook. It:

1. Tracks the pointer as **normalised 0–1 coordinates** inside the element.
2. **Eases** toward the target each frame (`current += (target - current) * 0.1`), so motion feels physical.
3. Runs an **autopilot** when the pointer is away: a slow Lissajous path, so the piece is never static.
   This also covers touch devices.
4. Writes the result as **CSS custom properties** (`--px`, `--py`, `--hover`) directly on the element.
   There's no React re-render per frame.
5. Calls an optional `onFrame` callback for pieces that need JavaScript logic, such as nearest-neighbour.
6. Runs the rAF loop **only while on screen** (IntersectionObserver).
7. Under `prefers-reduced-motion`, has no loop, no autopilot and no easing: the art follows the pointer only.

```ts
const { ref, active } = usePointerField<HTMLDivElement>(
  (s) => { /* s.x, s.y in 0–1, s.hover 0–1 */ },
  { sweep: 0.3, rest: { x: 0.6, y: 0.4 } },
);
return <div ref={ref} className="art">…</div>;
```

Copy `usePointerField.ts` as-is into another project. It depends only on React and a
`usePrefersReducedMotion` media-query hook.

### 2.2 Let CSS do the animation

Most of the motion is plain CSS that reads the variables:

```css
.lens   { left: var(--px); top: var(--py); width: calc(26cqi + var(--hover) * 6cqi); }
.reveal { clip-path: circle(13cqi at var(--px) var(--py)); }
.bg     { background: repeating-radial-gradient(circle at var(--px) var(--py), …); }
```

Use JavaScript only when CSS can't express the rule, for example "which three points are closest?".
Even then:
- write per-frame values (line endpoints, a score) **straight to DOM refs**;
- call `setState` **only when the discrete result changes** (the set of matches, the current language).

### 2.3 Scale everything with container units

Put `container-type: inline-size` on the card and size *everything* in `cqi`: fonts, borders, gaps and
shadows. The piece then scales as one composition from a 300px phone card to a 1100px header, with no
breakpoint juggling.

Very wide or very tall frames change the aspect ratio, so add one override block for those. Here,
`.preview-large` gets a smaller type scale.

---

## 3. Reusable techniques

**Two-layer reveal (Sherlock).** Render the same content twice with identical layout: a "public" layer
and a "secret" layer on top, clipped by `clip-path: circle(r at var(--px) var(--py))`. Keep layout
identical between the layers, for example keep the text but make it `color: transparent`, so the reveal
lines up exactly. Use `white-space: nowrap` on highlighted spans so an overlay label never splits across
lines.

**Nearest-neighbour highlight (NextHire).** Generate points with a **seeded PRNG** (`mulberry32`) so the
layout is identical on every visit. Each frame:
- compute distances, correcting x by the aspect ratio;
- move the SVG `<line>`s via refs;
- re-render only when the matched indices change.

Lines use `preserveAspectRatio="none"` with `vector-effect: non-scaling-stroke`. Points are HTML elements,
so they stay round.

**Event stream (Guardian).**
- A `setInterval` gated on `active` spawns an event, here a coin, keyed by id so its CSS keyframe replays.
- When the animation lands, a timeout appends to state.
- To slide a list when an item is added, measure one item and use the Web Animations API:
  `row.animate([{ transform: 'translateX(Wpx)' }, { transform: 'none' }], 520)`.
- Pass per-instance values to keyframes with custom properties: `style={{ '--from-x': '40%' }}`.

**Bands and state machines (FAQ).** Map `x` to one of N bands. On a band change:
- update a small model (here a cache: miss the first time, hit after that);
- push to a short log, keeping the last 3 entries;
- derive a stat (the hit rate).

`key={index}` on the headline replays a blur-in keyframe on every change.

**Ambient depth.** Large faint glyphs or grids, translated slightly opposite the pointer
(`translate: calc((50% - var(--px)) * .12)`), add parallax at almost no cost.

---

## 4. Guardrails (production checklist)

- [ ] Wrapper is `aria-hidden="true"`, and the card's text carries the real information.
- [ ] No focusable or clickable elements inside the art, so the surrounding link still works.
- [ ] `prefers-reduced-motion` is respected: no autonomous motion, plus a global CSS
      `animation: none` rule.
- [ ] Animation loops run only while visible; all timers and listeners are cleaned up on unmount.
- [ ] No per-frame React renders.
- [ ] Deterministic content: seeded randomness, no `Math.random()` in render.
- [ ] Pure logic sits in its own file with unit tests: parsing, nearest, bands, hashing.
- [ ] Positioning that depends on sibling order uses explicit classes or inline positions, not
      `:nth-of-type`. That selector broke once here because the other children were also `<span>`s.
- [ ] Verified in a real browser at roughly 360px, 390px, tablet, desktop, and in any wide or tall
      variant; no horizontal overflow; console clean.

---

## 5. Process, step by step

1. **Brief.** For each project: the one-sentence job, the input → transformation → proof, and 1–2 resume
   numbers worth turning into visuals.
2. **Sketch.** Decide the metaphor, the single interaction and the idle (autopilot) behaviour.
3. **Logic first.** Write the pure helpers and their tests.
4. **Static composition.** Build the layout in `cqi` units with the pointer fixed at a rest position.
   Get this beautiful before adding motion.
5. **Wire the hook.** Use CSS variables first; reach for `onFrame` only where needed.
6. **Verify.** Run typecheck, lint, tests and build. Then check it in a browser: hover it, leave it idle,
   view it on a phone width and a wide header, and with reduced motion on.
7. **Tune.** Adjust density and type size per aspect ratio, and check that nothing reads as a fake claim.

To reuse the method in a new project, copy `usePointerField.ts` and `art-logic.ts` (keep whichever helpers
you need), the `.art` base CSS (`position: absolute; inset: 0; --px: 50%; --py: 50%; --hover: 0`) and the
`container-type: inline-size` rule on the card. Then follow the steps above for each new piece.
