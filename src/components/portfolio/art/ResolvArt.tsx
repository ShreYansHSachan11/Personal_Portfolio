import { type CSSProperties, useRef, useState } from "react";
import { bandAt } from "./art-logic";
import { usePointerField } from "./usePointerField";

/** The four agents an incident passes through, with the status and audit entry each one leaves behind. */
const STAGES = [
  { agent: "Triage", status: "Assigned", tone: "is-triage", note: "Routed to Network Ops · on-shift engineer assigned", at: "+0:04" },
  { agent: "Acknowledge", status: "Acknowledged", tone: "is-ack", note: "Caller acknowledged · template ACK-02", at: "+0:09" },
  { agent: "Pending", status: "On hold", tone: "is-pending", note: "Engineer note read · reminder scheduled in 4h", at: "+1h 12m" },
  { agent: "Resolution", status: "Resolved", tone: "is-resolved", note: "Caller confirmed the fix · auto-resolved", at: "+4h 32m" },
] as const;

/**
 * Resolv: sweep across to move one incident through the agents. Each stage updates the ticket's status
 * and fills in its line of the audit trail. The ticket and timings are illustrative, not real data.
 */
export function ResolvArt() {
  const [stage, setStage] = useState(0);
  const shown = useRef(0);
  const { ref } = usePointerField<HTMLDivElement>((s) => {
    const next = bandAt(s.x, STAGES.length);
    if (next === shown.current) return;
    shown.current = next;
    setStage(next);
  }, { sweep: 0.46, rest: { x: 0.05, y: 0.5 } });
  const current = STAGES[stage] ?? STAGES[0];

  return (
    <div ref={ref} className="art resolv-art">
      <span className="rv-wordmark">resol<span>v</span></span>
      <span className="rv-online"><i />4 agents online</span>

      <div className="rv-ticket">
        <div className="rv-ticket-head">
          <span>INC-2041 · P2</span>
          <b key={stage} className={current.tone}>{current.status}</b>
        </div>
        <p className="rv-title">VPN drops right after a password reset</p>
        <ul className="rv-trail">
          {STAGES.map((s, i) => (
            <li key={s.agent} className={i < stage ? "is-done" : i === stage ? "is-on" : ""}>
              <b>{s.agent}</b>
              <span key={i <= stage ? "done" : "waiting"}>{i <= stage ? s.note : "waiting"}</span>
              <em>{i <= stage ? s.at : "·"}</em>
            </li>
          ))}
        </ul>
      </div>

      <ol className="rv-track" style={{ "--done": stage / (STAGES.length - 1) } as CSSProperties}>
        {STAGES.map((s, i) => (
          <li key={s.agent} className={i < stage ? "is-done" : i === stage ? "is-on" : ""}>
            <i />
            <span>{s.agent}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
