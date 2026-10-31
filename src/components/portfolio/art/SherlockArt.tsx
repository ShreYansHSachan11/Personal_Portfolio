import { parseCaseFile } from "./art-logic";
import { usePointerField } from "./usePointerField";

/** A fictional statement. Entity values are never shown — they only set the width of each redaction. */
const CASE_FILE = [
  "On [12 March 2024|DATE], [Ravi Malhotra|PERSON] reported a stolen phone near [MG Road, Bengaluru|PLACE]. He can be reached on [98XXX XX210|PHONE].",
  "Witness [Ananya Rao|PERSON] saw a grey scooter, plate [KA-05-MN-4471|ID], leave towards [Indiranagar|PLACE] at [21:40|DATE].",
  "Statement recorded by [Insp. S. Kumar|PERSON], badge [4471-B|ID].",
].map(parseCaseFile);
const ENTITY_COUNT = CASE_FILE.flat().filter((t) => t.kind).length;

function CaseFile({ mode }: { mode: "masked" | "detected" }) {
  return (
    <div className={`case-file case-${mode}`}>
      <div className="case-head">
        <span>CASE FILE № 2291</span>
        <span className="case-stamp">{mode === "masked" ? "ANONYMIZED" : "DETECTED"}</span>
      </div>
      <p className="case-title">Statement of record<span className="text-primary">.</span></p>
      {CASE_FILE.map((tokens, i) => (
        <p key={i} className="case-text">
          {tokens.map((t, j) => (t.kind ? <mark key={j} data-kind={t.kind}>{t.text}</mark> : <span key={j}>{t.text}</span>))}
        </p>
      ))}
      <div className="case-foot"><span>{ENTITY_COUNT} entities found</span><span>0 exposed</span></div>
    </div>
  );
}

/** Sherlock: every personal detail is redacted; the lens shows what kind of data each redaction hides. */
export function SherlockArt() {
  const { ref } = usePointerField<HTMLDivElement>(undefined, { rest: { x: 0.4, y: 0.55 } });
  return (
    <div ref={ref} className="art sherlock-art">
      <CaseFile mode="masked" />
      <div className="sherlock-detect"><CaseFile mode="detected" /></div>
      <div className="sherlock-lens" />
    </div>
  );
}
