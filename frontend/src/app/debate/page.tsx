"use client";

import Link from "next/link";
import Shell from "@/components/Shell";
import { sevColor, SevChip } from "@/components/ui";
import { LiveBadge } from "@/components/LiveBadge";
import { AGENTS, type RiskLevel } from "@/lib/types";
import { useRunData } from "@/lib/useRunData";
import {
  Network, Activity, Database, ShieldAlert, TrendingUp, Crosshair, Gavel,
  TrendingUp as TrendIcon, ArrowRight, FileDown, FileText, ShieldCheck, MessagesSquare,
} from "lucide-react";

const ICON: Record<string, React.ElementType> = {
  architecture: Network, sre: Activity, database: Database,
  security: ShieldAlert, business: TrendingUp, red_team: Crosshair,
  synthesizer: Gavel,
};
const keyForAgent = (name: string) => AGENTS.find((a) => a.name === name)?.key ?? "synthesizer";

const STANCE_LABEL: Record<string, string> = {
  concern: "raises concern", rebuttal: "rebuts", agreement: "agrees with", escalation: "escalates",
};

const DISAGREEMENTS = [
  { topic: "Rollback readiness", by: "SRE / Red-Team", resolution: "Blocker — restore untested", tone: "Critical" },
  { topic: "Settlement compatibility", by: "Database Agent", resolution: "Must validate pre-upgrade", tone: "High" },
  { topic: "Revenue blast radius", by: "Business Impact", resolution: "Add post-deploy check", tone: "High" },
  { topic: "Auth plugin downgrade", by: "Security Agent", resolution: "Requires risk acceptance", tone: "Medium" },
] as const;

export default function DebatePage() {
  const { data, live } = useRunData();
  const debate = data.debate;
  const resolution = data.resolution;
  return (
    <Shell>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessagesSquare size={18} style={{ color: "var(--brand)" }} />
            <h1 className="text-[22px] font-bold">Debate Timeline</h1>
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-faint)" }}>
            How specialist agents challenged assumptions and changed the recommendation.
          </p>
        </div>
        <LiveBadge live={live} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_330px] gap-5">
        {/* timeline */}
        <div className="panel p-5">
          <div className="relative pl-1">
            {debate.map((d, i) => {
              const k = keyForAgent(d.agent);
              const Icon = ICON[k]; const color = sevColor[d.severity];
              const last = i === debate.length - 1;
              return (
                <div key={i} className="relative flex gap-4 pb-5">
                  {!last && <span className="absolute left-[18px] top-9 bottom-0 w-px" style={{ background: "var(--border)" }} />}
                  <div className="relative grid place-items-center w-9 h-9 rounded-xl panel-soft shrink-0"
                       style={{ boxShadow: `0 0 0 1px ${color}66` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="flex-1 panel-soft p-3" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-bold">{d.agent}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>{STANCE_LABEL[d.stance]}</span>
                      <span className="ml-auto"><SevChip level={d.severity} /></span>
                    </div>
                    <p className="text-[12px] mt-1.5 leading-snug" style={{ color: "var(--text-dim)" }}>{d.statement}</p>
                    {d.challenges && (
                      <div className="text-[10px] mt-2 flex items-center gap-1.5" style={{ color: "var(--text-faint)" }}>
                        <ArrowRight size={11} style={{ color }} /> challenges <span style={{ color: "var(--text-dim)" }}>{d.challenges}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* synthesizer verdict */}
            <div className="relative flex gap-4">
              <div className="grid place-items-center w-9 h-9 rounded-xl glow-amber shrink-0"
                   style={{ background: "linear-gradient(135deg,#2a210e,#0b1120)" }}>
                <Gavel size={16} style={{ color: "var(--accent)" }} />
              </div>
              <div className="flex-1 panel p-3" style={{ borderColor: "rgba(245,181,61,.4)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-bold">Executive Synthesizer</span>
                  <span className="ml-auto text-[12px] font-bold" style={{ color: "var(--conditional)" }}>Conditional No-Go</span>
                </div>
                <p className="text-[12px] mt-1.5 leading-snug" style={{ color: "var(--text-dim)" }}>{resolution}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 panel-soft px-4 py-2.5 text-[11.5px] flex items-center gap-2"
               style={{ color: "var(--text-faint)" }}>
            <ShieldCheck size={13} style={{ color: "var(--risk-low)" }} />
            Productive disagreement improves decision quality — agents reviewed blind first, then challenged.
          </div>
        </div>

        {/* right rail */}
        <div className="flex flex-col gap-4">
          <div className="panel p-4">
            <div className="label-eyebrow mb-3">Debate Impact</div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>Initial Risk</div>
                <div className="text-[26px] font-bold" style={{ color: "var(--risk-medium)" }}>64</div>
              </div>
              <ArrowRight size={18} style={{ color: "var(--text-faint)" }} />
              <div className="text-center">
                <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>Post-Debate Risk</div>
                <div className="text-[26px] font-bold" style={{ color: "var(--risk-high)" }}>78</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t hairline text-center" style={{ borderColor: "var(--border)" }}>
              <div className="label-eyebrow mb-1">Consensus Shift</div>
              <div className="text-[12px]" style={{ color: "var(--text-dim)" }}>
                <span style={{ color: "var(--risk-low)" }}>Conditional Go</span>
                <ArrowRight size={11} className="inline mx-1" />
                <span style={{ color: "var(--conditional)" }}>Conditional No-Go</span>
              </div>
            </div>
          </div>

          <div className="panel p-4">
            <div className="label-eyebrow mb-3">Key Disagreements</div>
            <div className="space-y-2.5">
              {DISAGREEMENTS.map((d) => (
                <div key={d.topic} className="text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: sevColor[d.tone as RiskLevel] }} />
                    <span className="font-semibold">{d.topic}</span>
                    <span className="ml-auto" style={{ color: "var(--text-faint)" }}>{d.by}</span>
                  </div>
                  <div className="ml-3.5 mt-0.5" style={{ color: sevColor[d.tone as RiskLevel] }}>{d.resolution}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4 flex items-center gap-4">
            <Donut value={71} />
            <div>
              <div className="label-eyebrow mb-1">Final Resolution</div>
              <div className="text-[12px] space-y-0.5" style={{ color: "var(--text-dim)" }}>
                <div><span style={{ color: "var(--risk-low)" }}>●</span> 5 Aligned</div>
                <div><span style={{ color: "var(--risk-high)" }}>●</span> 1 Dissenting</div>
                <div><span style={{ color: "var(--text-faint)" }}>●</span> 0 Abstained</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button disabled title="Available in a future release"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] panel-soft opacity-55 cursor-not-allowed" style={{ color: "var(--text-dim)" }}>
              <FileDown size={13} /> Transcript
              <span className="chip" style={{ color: "var(--text-faint)", borderColor: "var(--border)", fontSize: 9, padding: "1px 5px" }}>SOON</span>
            </button>
            <Link href="/memo" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-semibold glow-brand"
                  style={{ background: "linear-gradient(135deg,#0e7490,#22d3ee)", color: "#04222b" }}>
              <FileText size={13} /> Generate Memo
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Donut({ value }: { value: number }) {
  const r = 26, stroke = 7, circ = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: 72, height: 72 }}>
      <svg width={72} height={72} className="-rotate-90">
        <circle cx={36} cy={36} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={36} cy={36} r={r} fill="none" stroke="var(--brand)" strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)}
                style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,.5))" }} />
      </svg>
      <span className="absolute text-[15px] font-bold" style={{ color: "var(--brand)" }}>{value}%</span>
    </div>
  );
}
