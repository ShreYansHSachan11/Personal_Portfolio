import { useRef, useState } from "react";
import { matchScore, mulberry32, nearest } from "./art-logic";
import { usePointerField } from "./usePointerField";

const CLUSTERS = [
  { name: "Frontend", x: 22, y: 30, tone: "lime", roles: ["Frontend Engineer", "React Developer", "UI Engineer"] },
  { name: "AI / ML", x: 76, y: 28, tone: "pink", roles: ["ML Engineer", "AI Engineer", "NLP Engineer"] },
  { name: "Full-stack", x: 50, y: 55, tone: "white", roles: ["Full-stack Engineer", "Product Engineer", "Software Engineer"] },
  { name: "Backend", x: 23, y: 76, tone: "orange", roles: ["Backend Engineer", "Node.js Developer", "Platform Engineer"] },
  { name: "Data", x: 78, y: 75, tone: "lime", roles: ["Data Engineer", "Data Analyst", "Analytics Engineer"] },
] as const;

const ASPECT = 1.35;
const MATCHES = 3;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const random = mulberry32(11);
const JOBS = CLUSTERS.flatMap((c) =>
  Array.from({ length: 7 }, (_, i) => ({
    x: clamp(c.x + (random() - 0.5) * 22, 5, 95),
    y: clamp(c.y + (random() - 0.5) * 20, 8, 92),
    tone: c.tone,
    role: c.roles[i % c.roles.length] ?? c.name,
  })),
);

/** NextHire: jobs live in an embedding space; your resume finds its nearest roles by meaning, not keywords. */
export function NextHireArt() {
  const [matches, setMatches] = useState<readonly number[]>([]);
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const score = useRef<HTMLElement>(null);
  const key = useRef("");
  const { ref } = usePointerField<HTMLDivElement>((s) => {
    const from = { x: s.x * 100, y: s.y * 100 };
    const found = nearest(JOBS, from, MATCHES, ASPECT);
    found.forEach(({ index }, k) => {
      const line = lines.current[k];
      const job = JOBS[index];
      if (!line || !job) return;
      line.setAttribute("x1", from.x.toFixed(2));
      line.setAttribute("y1", from.y.toFixed(2));
      line.setAttribute("x2", job.x.toFixed(2));
      line.setAttribute("y2", job.y.toFixed(2));
    });
    const best = found[0];
    if (best && score.current) score.current.textContent = matchScore(best.distance).toFixed(2);
    const next = found.map((n) => n.index).join(",");
    if (next !== key.current) {
      key.current = next;
      setMatches(found.map((n) => n.index));
    }
  });
  const best = matches[0] === undefined ? undefined : JOBS[matches[0]];

  return (
    <div ref={ref} className="art nexthire-art">
      {CLUSTERS.map((c) => <span key={c.name} className="nh-cluster" style={{ left: `${c.x}%`, top: `${c.y - 13}%` }}>{c.name}</span>)}
      <svg className="nh-links" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: MATCHES }, (_, k) => (
          <line key={k} ref={(el) => { lines.current[k] = el; }} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {JOBS.map((j, i) => (
        <i key={i} className={`nh-job tone-${j.tone} ${matches.includes(i) ? "is-match" : ""}`} style={{ left: `${j.x}%`, top: `${j.y}%` }} />
      ))}
      <div className="nh-you"><span>your resume</span></div>
      {best && (
        <div className={`nh-best ${best.x > 58 ? "flip" : ""}`} style={{ left: `${best.x}%`, top: `${best.y}%` }}>
          <strong>{best.role}</strong>
          <span><em ref={score}>0.90</em> match</span>
        </div>
      )}
      <span className="nh-tag">SEMANTIC SEARCH · TOP {MATCHES}</span>
      <span className="nh-caption">NEXTHIRE — MATCHED BY MEANING</span>
    </div>
  );
}
