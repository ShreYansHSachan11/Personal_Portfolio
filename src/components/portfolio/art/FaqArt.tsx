import { useRef, useState } from "react";
import { bandAt } from "./art-logic";
import { usePointerField } from "./usePointerField";

const LANGUAGES = [
  { code: "EN", lang: "en", text: "How do I reset my password?" },
  { code: "हिन्दी", lang: "hi", text: "मैं अपना पासवर्ड कैसे रीसेट करूँ?" },
  { code: "ES", lang: "es", text: "¿Cómo restablezco mi contraseña?" },
  { code: "FR", lang: "fr", text: "Comment réinitialiser mon mot de passe ?" },
  { code: "DE", lang: "de", text: "Wie setze ich mein Passwort zurück?" },
  { code: "日本語", lang: "ja", text: "パスワードをリセットするには？" },
] as const;
const GLYPHS = ["A", "अ", "Ñ", "あ", "ß", "?"] as const;

interface LogEntry { id: number; code: string; hit: boolean; ms: number }
interface CacheView { index: number; log: readonly LogEntry[]; hits: number; lookups: number }

const INITIAL: CacheView = { index: 0, log: [{ id: 0, code: "EN", hit: false, ms: 184 }], hits: 0, lookups: 1 };

/**
 * FAQ Manager: sweep across to ask in another language. The first request for a language goes to the
 * translator and is cached; every repeat is answered from Redis — illustrative timings, not measurements.
 */
export function FaqArt() {
  const [view, setView] = useState<CacheView>(INITIAL);
  const cached = useRef(new Set<number>([0]));
  const shown = useRef(0);
  const seq = useRef(0);
  const { ref } = usePointerField<HTMLDivElement>((s) => {
    const next = bandAt(s.x, LANGUAGES.length);
    if (next === shown.current) return;
    shown.current = next;
    const hit = cached.current.has(next);
    cached.current.add(next);
    seq.current += 1;
    const entry: LogEntry = { id: seq.current, code: LANGUAGES[next]?.code ?? "", hit, ms: hit ? 2 : 140 + ((next * 37) % 70) };
    setView((v) => ({ index: next, log: [entry, ...v.log].slice(0, 3), hits: v.hits + (hit ? 1 : 0), lookups: v.lookups + 1 }));
  }, { sweep: 0.46, rest: { x: 0.05, y: 0.5 } });
  const language = LANGUAGES[view.index] ?? LANGUAGES[0];

  return (
    <div ref={ref} className="art faq-art">
      <div className="faq-glyphs">{GLYPHS.map((g) => <span key={g}>{g}</span>)}</div>
      <span className="faq-wordmark">faq<span className="text-primary">.</span></span>
      <div className="faq-card">
        <div className="faq-langs">
          {LANGUAGES.map((l, i) => <span key={l.code} className={i === view.index ? "is-on" : ""}>{l.code}</span>)}
        </div>
        <p key={view.index} lang={language.lang} className="faq-question">{language.text}</p>
        <ul className="faq-log">
          {view.log.map((e) => (
            <li key={e.id} className={e.hit ? "is-hit" : ""}>
              <b>{e.hit ? "HIT" : "MISS"}</b>
              <span>{e.code} · {e.hit ? "served from Redis" : "translated, then cached"}</span>
              <em>{e.ms} ms</em>
            </li>
          ))}
        </ul>
      </div>
      <div className="faq-meter"><span>cache hit rate</span><strong>{Math.round((view.hits / view.lookups) * 100)}%</strong></div>
    </div>
  );
}
