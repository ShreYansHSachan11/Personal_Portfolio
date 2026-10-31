import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

export interface FieldState { x: number; y: number; hover: number }
interface Options { sweep?: number; rest?: { x: number; y: number } }

const EASE = 0.1;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Drives an artwork from the pointer. Writes an eased position (0–1) to the element as `--px`/`--py`
 * percentages plus `--hover` (0–1), and calls `onFrame` with the same values. When the pointer is away,
 * a slow autopilot wanders the canvas so the piece stays alive. Animation runs only while the element is
 * on screen; with reduced motion there is no autopilot or easing — the art simply follows the pointer.
 */
export function usePointerField<T extends HTMLElement>(onFrame?: (state: FieldState) => void, { sweep = 0.3, rest = { x: 0.62, y: 0.42 } }: Options = {}) {
  const ref = useRef<T>(null);
  const frame = useRef(onFrame);
  const state = useRef<FieldState>({ x: rest.x, y: rest.y, hover: 0 });
  const [inView, setInView] = useState(false);
  const still = usePrefersReducedMotion();
  const { x: restX, y: restY } = rest;

  useEffect(() => {
    frame.current = onFrame;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), { rootMargin: "120px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = state.current;
    const apply = () => {
      el.style.setProperty("--px", `${(s.x * 100).toFixed(2)}%`);
      el.style.setProperty("--py", `${(s.y * 100).toFixed(2)}%`);
      el.style.setProperty("--hover", s.hover.toFixed(3));
      frame.current?.(s);
    };
    let target: { x: number; y: number } | null = null;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      target = { x: clamp01((e.clientX - r.left) / r.width), y: clamp01((e.clientY - r.top) / r.height) };
      if (still) {
        Object.assign(s, target, { hover: 1 });
        apply();
      }
    };
    const leave = () => {
      target = null;
      if (still) {
        Object.assign(s, { x: restX, y: restY, hover: 0 });
        apply();
      }
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    apply();

    let raf = 0;
    if (!still && inView) {
      const tick = (t: number) => {
        const goalX = target?.x ?? 0.5 + sweep * Math.sin(t * 0.00042);
        const goalY = target?.y ?? 0.5 + sweep * 0.8 * Math.sin(t * 0.00067 + 1.3);
        s.x += (goalX - s.x) * EASE;
        s.y += (goalY - s.y) * EASE;
        s.hover += ((target ? 1 : 0) - s.hover) * EASE;
        apply();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [inView, still, sweep, restX, restY]);

  return { ref, active: inView && !still };
}
