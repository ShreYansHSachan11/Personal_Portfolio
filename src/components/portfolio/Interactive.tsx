import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/useMediaQuery";

export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = usePrefersReducedMotion();
  const move = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || still) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(0)`;
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={leave}
      className={`transition-transform duration-200 ease-out [transform-style:preserve-3d] ${className}`}
    >
      {children}
    </div>
  );
}

/** Cursor follower blob — desktop only, an addition to (not a replacement for) the native cursor. */
export function CursorBlob() {
  const ref = useRef<HTMLDivElement>(null);
  const desktop = useMediaQuery("(min-width: 768px)");
  const coarse = useMediaQuery("(pointer: coarse)");
  const still = usePrefersReducedMotion();
  const active = desktop && !coarse && !still;

  useEffect(() => {
    if (!active) return;
    // Start off-screen so the dot never flashes in the corner before the first move.
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0;
    const onMove = (e: PointerEvent) => { x = e.clientX; y = e.clientY; };
    const loop = () => {
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      if (ref.current) ref.current.style.transform = `translate(${cx - 12}px, ${cy - 12}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    loop();
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [active]);

  if (!active) return null;
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-50 hidden h-6 w-6 rounded-full bg-primary mix-blend-multiply md:block"
    />
  );
}

const FLOW_PATH =
  "M820 0 C 1000 400, 200 500, 300 900 S 950 1300, 800 1700 S 100 2100, 250 2500 S 900 2900, 700 3300 S 300 3800, 500 4000";

/** Scroll-drawn flowing line through the page; eases toward scroll progress instead of snapping. */
export function FlowLine() {
  const path = useRef<SVGPathElement>(null);
  useEffect(() => {
    const p = path.current;
    const svg = p?.ownerSVGElement;
    if (!p || !svg) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let target = 0;
    let current = 0;
    let len = 0;
    let size = "";

    // With vector-effect: non-scaling-stroke, dashes are measured in screen pixels, but
    // getTotalLength() is in the stretched 1000×4000 viewBox units. Measure the on-screen
    // length instead, or the dash runs out partway down tall pages and the line never finishes.
    const userLength = p.getTotalLength();
    const samples = Array.from({ length: 801 }, (_, i) => p.getPointAtLength((userLength * i) / 800));
    // Running max of y, so the lookup below stays monotonic even where a curve doubles back.
    const ys: number[] = [];
    let maxY = 0;
    for (const s of samples) ys.push((maxY = Math.max(maxY, s.y)));
    // Screen-pixel length from the start of the path to each sample.
    const cum = new Float64Array(samples.length);
    const measureLength = (width: number, height: number) => {
      const key = `${width}x${height}`;
      if (key === size) return;
      size = key;
      const sx = width / 1000;
      const sy = height / 4000;
      for (let i = 1; i < samples.length; i++) {
        const a = samples[i - 1];
        const b = samples[i];
        cum[i] = (cum[i - 1] ?? 0) + (a && b ? Math.hypot((b.x - a.x) * sx, (b.y - a.y) * sy) : 0);
      }
      len = cum[samples.length - 1] ?? 0;
      p.style.strokeDasharray = `${len} ${len}`;
    };
    // Length of path drawn down to viewBox height y.
    const lengthAt = (y: number) => {
      let lo = 0;
      let hi = ys.length - 1;
      if (y <= (ys[0] ?? 0)) return 0;
      if (y >= (ys[hi] ?? 0)) return len;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if ((ys[mid] ?? 0) < y) lo = mid;
        else hi = mid;
      }
      const y0 = ys[lo] ?? 0;
      const y1 = ys[hi] ?? 0;
      const f = y1 > y0 ? (y - y0) / (y1 - y0) : 0;
      return (cum[lo] ?? 0) + ((cum[hi] ?? 0) - (cum[lo] ?? 0)) * f;
    };
    const measure = () => {
      const rect = svg.getBoundingClientRect();
      measureLength(rect.width, rect.height);
      // Keep the tip of the line at a fixed spot in the viewport, so it moves exactly with the scroll.
      // Over the last screenful the anchor slides to the bottom edge, so the line finishes at the page end.
      const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      const anchor = 0.6 + 0.4 * Math.max(0, 1 - remaining / window.innerHeight);
      const tipY = window.innerHeight * anchor - rect.top;
      target = lengthAt((tipY / Math.max(1, rect.height)) * 4000);
    };
    const draw = () => {
      frame = 0;
      // A light ease smooths wheel steps without letting the line lag behind the page.
      current = reduced.matches ? len : current + (target - current) * 0.25;
      p.style.strokeDashoffset = `${len - current}`;
      // Keep easing until we arrive, then sleep until the next scroll/resize.
      if (!reduced.matches && Math.abs(target - current) > 0.5) frame = requestAnimationFrame(draw);
    };
    const update = () => {
      measure();
      if (!frame) frame = requestAnimationFrame(draw);
    };

    measure();
    current = target;
    draw();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    reduced.addEventListener("change", update);
    // Content height changes (lazy images, the 3D scene, filters) shift scroll progress too.
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      reduced.removeEventListener("change", update);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1000 4000"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="flow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset=".5" stopColor="var(--pink)" />
          <stop offset="1" stopColor="var(--secondary)" />
        </linearGradient>
      </defs>
      <path
        ref={path}
        d={FLOW_PATH}
        fill="none"
        stroke="url(#flow)"
        strokeWidth="5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Magnetic button wrapper */
export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = usePrefersReducedMotion();
  const move = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || still) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div ref={ref} className="inline-block transition-transform duration-200 ease-out" onMouseMove={move} onMouseLeave={leave}>
      {children}
    </div>
  );
}
