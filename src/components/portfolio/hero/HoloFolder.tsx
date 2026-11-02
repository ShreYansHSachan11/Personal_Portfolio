import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { interests, type Interest, type InterestKind } from "../content";
import { covers } from "./covers";
import { InterestPanel } from "./InterestPanel";
import "./holo-folder.css";

/** Per-card look. Titles come from `interests`; stats are derived from the same content, so they stay true. */
const CARDS: Record<InterestKind, { tone: string; glyph: string; stat: (i: Interest) => string }> = {
  chess: {
    tone: "var(--holo-1)",
    glyph: "♞",
    stat: (i) => (i.kind === "chess" && i.chessCom.snapshot.puzzles ? `PUZZLE ${i.chessCom.snapshot.puzzles}` : "MATE IN 1"),
  },
  music: { tone: "var(--holo-2)", glyph: "♫", stat: (i) => `${"items" in i ? i.items.length : 0} TRACKS` },
  books: { tone: "var(--holo-3)", glyph: "❡", stat: (i) => `${"items" in i ? i.items.length : 0} BOOKS` },
  movies: { tone: "var(--ember)", glyph: "◉", stat: (i) => `${"items" in i ? i.items.length : 0} FILMS` },
};

const pad = (n: number) => String(n).padStart(2, "0");

/** A fixed, varied barcode per card: 18 bars of different widths and heights. */
function barcode(seed: number) {
  return Array.from({ length: 18 }, (_, b) => {
    const v = (seed * 31 + b * 17 + b * b * 7) % 11;
    return { width: 1 + (v % 3), height: 45 + ((v * 9) % 55) };
  });
}

/** 14 drifting particles at different depths, so they parallax as the folder tilts. */
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 41 + 9) % 100}%`,
  top: `${(i * 23 + 6) % 92}%`,
  size: 2 + (i % 3),
  z: 60 + ((i * 37) % 121),
  delay: `${((i * 0.29) % 4).toFixed(2)}s`,
  tone: i % 2 ? "var(--holo-2)" : "var(--holo-1)",
}));

/** How far a hovered card slides up out of the folder, in px. */
const HOVER_LIFT = 24;

const fanAngle = (i: number, open: boolean) => (open ? 8 : 3) * (i - 1.5);

/**
 * Where card i sits in the fan, closed or open (folder hovered). Cards also step sideways,
 * so each keeps its own strip to click. Hovering never changes this: the button (the hit
 * area) stays put and only the card's visible body lifts, so the pointer can't knock a card
 * out from under itself and flicker.
 */
function fanTransform(i: number, open: boolean): string {
  const spread = i - 1.5;
  const x = spread * (open ? 64 : 36);
  const lift = open ? 250 - i * 52 : 185 - i * 44;
  const z = -30 + i * 14;
  return `translateX(${x}px) translateY(${-lift}px) translateZ(${z}px) rotateZ(${fanAngle(i, open)}deg)`;
}

/** The hovered card's body: slides up and straightens most of the way, within its own layer. */
const liftTransform = (i: number, open: boolean) => `translateY(${-HOVER_LIFT}px) rotateZ(${-fanAngle(i, open) * 0.6}deg)`;

export default function HoloFolder() {
  const fitRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  // Scale the fixed 460×520 folder down to whatever space the hero gives it.
  useEffect(() => {
    const box = fitRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      box.style.setProperty("--fit", String(Math.min(1, width / 600, height / 580)));
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // Cover art lives on slow third-party CDNs, so start fetching it the first time someone shows interest.
  const warmed = useRef(false);
  const warmCovers = () => {
    if (warmed.current) return;
    warmed.current = true;
    for (const url of Object.values(covers)) {
      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.src = url;
    }
  };

  // Tilt and glare follow the pointer through CSS variables, without re-rendering.
  const move = (e: MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    const box = fitRef.current;
    if (!el || !box) return;
    const r = box.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--px", px.toFixed(3));
    el.style.setProperty("--py", py.toFixed(3));
  };
  const enter = () => {
    setOpen(true);
    warmCovers();
  };
  const leave = () => {
    setOpen(false);
    setActive(null);
    wrapRef.current?.style.setProperty("--px", "0");
    wrapRef.current?.style.setProperty("--py", "0");
  };

  const shown = selected === null ? null : (interests[selected] ?? null);
  const activeLabel = active === null ? null : interests[active]?.label;

  return (
    // Pointer tracking sits on this static box: the folder itself floats, and a moving
    // hover target makes the folder open and close under a resting cursor.
    <div ref={fitRef} className="holo-fit" onMouseMove={move} onMouseEnter={enter} onMouseLeave={leave}>
      <div
        ref={wrapRef}
        className={`holo ${open ? "is-open" : ""}`}
        role="group"
        aria-label="What I'm into"
        onFocus={enter}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) leave();
        }}
      >
        <div className="holo-stage">
          {/* Orbit rings and particles: decoration around the folder. */}
          <div className="holo-orbit holo-orbit-a" aria-hidden><div className="holo-ring"><i /></div></div>
          <div className="holo-orbit holo-orbit-b" aria-hidden><div className="holo-ring"><i /></div></div>
          <div className="holo-particles" aria-hidden>
            {PARTICLES.map((p, i) => (
              <i
                key={i}
                style={{
                  left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: p.delay,
                  transform: `translateZ(${p.z}px)`, "--dot": p.tone,
                } as CSSProperties}
              />
            ))}
          </div>
          <div className="holo-ground" aria-hidden />

          <div className="holo-back" aria-hidden>
            <div className="holo-tab"><i />/root/self</div>
          </div>

          {interests.map((interest, i) => {
            const card = CARDS[interest.kind];
            return (
              <button
                key={interest.kind}
                type="button"
                className={`holo-card ${active === i ? "is-active" : ""}`}
                style={{ "--tone": card.tone, "--lift": `${HOVER_LIFT}px`, transform: fanTransform(i, open), transitionDelay: `${i * 40}ms` } as CSSProperties}
                aria-haspopup="dialog"
                aria-label={`${interest.label}: ${interest.tagline}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onClick={() => {
                  warmCovers();
                  setSelected(i);
                }}
              >
                <span className="holo-card-body" style={active === i ? { transform: liftTransform(i, open) } : undefined}>
                <span className="holo-card-head">
                  <strong>{interest.label}</strong>
                  <span>{pad(i + 1)}/{pad(interests.length)}</span>
                </span>
                <span className="holo-card-meta">
                  <span>// INTEREST</span>
                  <span>{card.stat(interest)}</span>
                </span>
                <span className="holo-card-art" aria-hidden>
                  <span className="holo-glyph">{`${card.glyph}︎`}</span>
                  <span className="holo-barcode">
                    {barcode(i + 1).map((b, k) => <i key={k} style={{ width: b.width, height: `${b.height}%` }} />)}
                  </span>
                </span>
                <span className="holo-card-rule" aria-hidden />
                </span>
              </button>
            );
          })}

          {/* Front glass pocket with its HUD. */}
          <div className="holo-pocket" aria-hidden>
            <div className="holo-pocket-glass">
              <span className="holo-scan" />
              <span className="holo-glare" />
              <span className="holo-crt" />
              <span className="holo-corner tl" /><span className="holo-corner tr" /><span className="holo-corner bl" /><span className="holo-corner br" />
              <div className="holo-hud-top">
                <span><i className="holo-pulse" /> SYS.ONLINE</span>
                <span>{activeLabel ? `> ${activeLabel.toUpperCase()}` : `${interests.length} FILES`}</span>
              </div>
              <div className="holo-load"><i /></div>
              <div className="holo-hud-bottom">
                <span>
                  <small>DIRECTORY</small>
                  <em>things I&apos;m into</em>
                </span>
                <span className="holo-mark"><b>s.</b><i /></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <InterestPanel interest={shown} onClose={() => setSelected(null)} />
    </div>
  );
}
