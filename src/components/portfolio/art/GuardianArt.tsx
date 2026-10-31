import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { blockHash } from "./art-logic";
import { usePointerField } from "./usePointerField";

const LATEST = 1024;
const VISIBLE_BLOCKS = 5;
const DROP_EVERY_MS = 2400;
const COIN_MS = 900;
const PINGS = [
  { text: "Shelter open · Sector 4", left: 54, top: 9 },
  { text: "Water needed · Ward 9", left: 70, top: 42 },
  { text: "Route clear · NH-48", left: 34, top: 40 },
] as const;

/** Guardian: live relief updates pulse out while each donation drops onto an open, traceable ledger. */
export function GuardianArt() {
  const [blocks, setBlocks] = useState<readonly number[]>([LATEST - 3, LATEST - 2, LATEST - 1, LATEST]);
  const [coin, setCoin] = useState<{ id: number; x: number } | null>(null);
  const pointerX = useRef(0.5);
  const row = useRef<HTMLDivElement>(null);
  const shown = useRef(LATEST);
  const { ref, active } = usePointerField<HTMLDivElement>((s) => { pointerX.current = s.x; });

  useEffect(() => {
    if (!active) return;
    let landing = 0;
    const drop = window.setInterval(() => {
      setCoin({ id: performance.now(), x: Math.min(0.78, Math.max(0.1, pointerX.current)) });
      landing = window.setTimeout(() => setBlocks((b) => [...b, (b.at(-1) ?? LATEST) + 1].slice(-VISIBLE_BLOCKS)), COIN_MS);
    }, DROP_EVERY_MS);
    return () => {
      window.clearInterval(drop);
      window.clearTimeout(landing);
    };
  }, [active]);

  // Slide the chain left by one block whenever a new block is appended on the right.
  useLayoutEffect(() => {
    const latest = blocks.at(-1) ?? LATEST;
    const el = row.current;
    const first = el?.firstElementChild;
    if (latest === shown.current || !el || !(first instanceof HTMLElement)) return;
    shown.current = latest;
    const shift = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    el.animate([{ transform: `translateX(${shift}px)` }, { transform: "translateX(0)" }], { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)" });
  }, [blocks]);

  return (
    <div ref={ref} className="art guardian-art">
      <p className="gd-title">Help,<br />in the open.</p>
      {[0, 1, 2].map((i) => <span key={i} className="gd-ring" />)}
      <span className="gd-epicenter" />
      {PINGS.map((p, i) => (
        <span key={p.text} className="gd-ping" style={{ left: `${p.left}%`, top: `${p.top}%`, animationDelay: `${i * 2.4}s` }}>{p.text}</span>
      ))}
      {coin && <i key={coin.id} className="gd-coin" style={{ "--from-x": `${coin.x * 100}%` } as CSSProperties}>Ξ</i>}
      <div className="gd-ledger">
        <div className="gd-ledger-head"><span>OPEN LEDGER</span><span>every donation, traceable</span></div>
        <div className="gd-row-clip">
          <div ref={row} className="gd-row">
            {blocks.map((n) => (
              <div key={n} className="gd-block"><span>#{n}</span><code>{blockHash(n)}</code><em>verified ✓</em></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
