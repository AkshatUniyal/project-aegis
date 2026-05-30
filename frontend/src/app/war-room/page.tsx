"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { RiskGauge, StatTile, sevColor } from "@/components/ui";
import { LiveBadge } from "@/components/LiveBadge";
import { AGENTS, type RiskLevel, type RiskScore } from "@/lib/types";
import { SCENARIO_TITLE } from "@/lib/mock";
import { useRunData } from "@/lib/useRunData";
import { createReview, streamReview } from "@/lib/api";
import {
  Network, Activity, Database, ShieldAlert, TrendingUp, Crosshair, ShieldCheck,
  Users2, ArrowRight, Radio, Play, Loader2, Check,
} from "lucide-react";

const ICON: Record<string, React.ElementType> = {
  architecture: Network, sre: Activity, database: Database,
  security: ShieldAlert, business: TrendingUp, red_team: Crosshair,
};
const keyOf = (name: string) => AGENTS.find((a) => a.name === name)?.key ?? "";

type Phase = "idle" | "running" | "done";
interface AState { status: "idle" | "running" | "done"; sev: RiskLevel; findings: number; }
type ActivityItem = { agent: string; text: string; sev: RiskLevel };

const blankAgents = (): Record<string, AState> =>
  Object.fromEntries(AGENTS.map((a) => [a.key, { status: "idle", sev: "Low", findings: 0 }]));

export default function WarRoomPage() {
  const { data, live } = useRunData();
  const [phase, setPhase] = useState<Phase>("idle");
  const [agents, setAgents] = useState<Record<string, AState>>(blankAgents());
  const [score, setScore] = useState<RiskScore | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [progress, setProgress] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const started = useRef(false);

  // Seed from the most recent completed run so the page is never empty.
  useEffect(() => {
    if (phase !== "idle") return;
    const next = blankAgents();
    for (const r of data.reports) {
      const k = keyOf(r.agent);
      if (k) next[k] = { status: "done", sev: r.highest_severity, findings: r.findings.length };
    }
    setAgents(next);
    setScore(data.score);
    if (live) setPhase("done");
  }, [data, live, phase]);

  useEffect(() => () => esRef.current?.close(), []);

  // Auto-start when arriving from New Review's "Start AI Review".
  useEffect(() => {
    if (started.current) return;
    if (typeof window !== "undefined" && window.location.search.includes("autostart")) {
      started.current = true;
      runReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runReview() {
    setPhase("running");
    setAgents(blankAgents());
    setScore(null);
    setActivity([]);
    setProgress(0.05);
    const created = await createReview({
      title: SCENARIO_TITLE, change_type: "Database Upgrade",
      description: "In-place upgrade of db-prod-01 from MySQL 5.7.38 to 8.0.36.",
      environment: "Production", evidence_folder: "data/demo_enterprise",
    });
    if (!created) { setPhase("idle"); setProgress(0); return; } // backend offline

    const total = AGENTS.length;
    let done = 0;
    esRef.current = streamReview(created.run_id, (ev) => {
      if (ev.event === "agent_start") {
        const k = keyOf(ev.agent as string);
        setAgents((s) => ({ ...s, [k]: { ...s[k], status: "running" } }));
      } else if (ev.event === "agent_done") {
        const k = keyOf(ev.agent as string);
        done += 1;
        setProgress(0.05 + 0.75 * (done / total));
        setAgents((s) => ({ ...s, [k]: { status: "done", sev: ev.highest_severity as RiskLevel, findings: ev.findings_count as number } }));
        setActivity((a) => [{ agent: ev.agent as string, text: `completed review — ${ev.findings_count} findings`, sev: ev.highest_severity as RiskLevel }, ...a]);
      } else if (ev.event === "debate") {
        setProgress(0.88);
        setActivity((a) => [{ agent: "Supervisor", text: "cross-agent debate concluded", sev: "Medium" }, ...a]);
      } else if (ev.event === "score") {
        setProgress(0.94);
        setScore(ev.score as RiskScore);
      } else if (ev.event === "memo" || ev.event === "done") {
        setProgress(1);
        setPhase("done");
        esRef.current?.close();
      } else if (ev.event === "error") {
        setPhase("idle");
        setProgress(0);
      }
    });
  }

  const overall = score?.overall ?? 0;
  const criticals = data.reports.reduce((n, r) => n + r.findings.filter((f) => f.risk_level === "Critical").length, 0);
  const consensus = score ? Math.round(score.evidence_completeness) : 0;

  return (
    <Shell>
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio size={18} style={{ color: "var(--brand)" }} />
            <h1 className="text-[22px] font-bold">Live War Room</h1>
            <LiveBadge live={live} />
          </div>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-dim)" }}>
            <span className="label-eyebrow mr-2">Reviewing change</span>{SCENARIO_TITLE}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {phase === "running" ? (
            <span className="chip chip-medium"><Loader2 size={12} className="animate-spin" /> Agents reviewing…</span>
          ) : phase === "done" ? (
            <span className="chip chip-low"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--risk-low)" }} /> Review complete</span>
          ) : (
            <span className="chip" style={{ color: "var(--text-faint)", borderColor: "var(--border)" }}>Ready</span>
          )}
          <button onClick={runReview} disabled={phase === "running"}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12.5px] font-semibold glow-brand disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#0e7490,#22d3ee)", color: "#04222b" }}>
            {phase === "running" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {phase === "running" ? "Running" : "Run Review"}
          </button>
        </div>
      </div>

      {(phase === "running" || (phase === "done" && progress === 1)) && (
        <div className="mb-4 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full" style={{
            width: `${Math.round(progress * 100)}%`,
            background: "linear-gradient(90deg,#0e7490,#22d3ee)",
            transition: "width .5s ease",
            boxShadow: "0 0 8px rgba(34,211,238,.5)",
          }} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        <div className="panel p-5 relative" style={{ minHeight: 380 }}>
          <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-5 h-full items-center">
            <PhaseTracker progress={progress} phase={phase} />
            <div className="grid place-items-center"><Hub agents={agents} /></div>
          </div>
          <div className="absolute bottom-4 right-6 flex gap-4 text-[10.5px]" style={{ color: "var(--text-faint)" }}>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "var(--brand)" }} /> Consensus link</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "var(--risk-high)" }} /> Escalation</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="panel p-4 flex flex-col items-center">
            <RiskGauge value={overall} />
            <div className="mt-3 w-full text-center panel-soft py-2.5 px-3" style={{ boxShadow: "inset 0 0 0 1px rgba(245,181,61,.4)" }}>
              <div className="label-eyebrow">Recommendation</div>
              <div className="text-[16px] font-bold mt-0.5" style={{ color: "var(--conditional)" }}>
                {score ? (score.decision === "No-Go" ? "No-Go" : "Conditional No-Go") : "Pending…"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatTile value={criticals || "—"} label="Critical Findings" color="var(--risk-critical)" />
            <StatTile value="18" label="Evidence Files" color="var(--brand)" />
          </div>
          <div className="panel-soft p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="label-eyebrow">Evidence Completeness</span>
              <span className="text-[15px] font-bold" style={{ color: "var(--brand)" }}>{consensus}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full" style={{ width: `${consensus}%`, background: "linear-gradient(90deg,#0e7490,#22d3ee)", transition: "width .6s ease" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 mt-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users2 size={14} style={{ color: "var(--text-dim)" }} />
            <span className="label-eyebrow">Specialist Agents</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AGENTS.map((a) => <AgentCard key={a.key} agentKey={a.key} name={a.short} role={a.role} state={agents[a.key]} />)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} style={{ color: "var(--brand)" }} />
            <span className="label-eyebrow">Live Review Activity</span>
          </div>
          <div className="panel p-3 space-y-2.5 min-h-[120px]">
            {activity.length === 0 && <div className="text-[11px] py-4 text-center" style={{ color: "var(--text-faint)" }}>Press “Run Review” to begin.</div>}
            {activity.map((e, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: sevColor[e.sev] }} />
                <div className="text-[11px] leading-snug">
                  <span className="font-semibold">{e.agent}</span>{" "}
                  <span style={{ color: "var(--text-faint)" }}>{e.text}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/debate"
            className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12.5px] font-semibold glow-brand"
            style={{ background: "linear-gradient(135deg,#0e7490,#22d3ee)", color: "#04222b" }}>
            View Debate Timeline <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Shell>
  );
}

const PHASES = [
  { key: "intake", label: "Change Intake", sub: "Scope & evidence folder" },
  { key: "review", label: "Independent Review", sub: "Specialists assess blind" },
  { key: "debate", label: "Cross-Agent Debate", sub: "Challenge assumptions" },
  { key: "scoring", label: "Risk Scoring", sub: "Weighted, transparent" },
  { key: "synthesis", label: "Executive Synthesis", sub: "Go / no-go memo" },
];

function phaseState(i: number, progress: number, phase: Phase): "done" | "active" | "pending" {
  if (phase === "done") return "done";
  if (phase === "idle") return "pending";
  const bounds = [0.01, 0.05, 0.8, 0.9, 0.95]; // start of each phase
  const next = bounds[i + 1] ?? 1.01;
  if (progress >= next) return "done";
  if (progress >= bounds[i]) return "active";
  return "pending";
}

function PhaseTracker({ progress, phase }: { progress: number; phase: Phase }) {
  return (
    <div className="relative pl-1">
      <div className="label-eyebrow mb-4">Review Pipeline</div>
      {PHASES.map((p, i) => {
        const st = phaseState(i, progress, phase);
        const color = st === "done" ? "var(--risk-low)" : st === "active" ? "var(--brand)" : "var(--text-faint)";
        const last = i === PHASES.length - 1;
        return (
          <div key={p.key} className="relative flex gap-3 pb-4">
            {!last && <span className="absolute left-[11px] top-6 bottom-0 w-px" style={{ background: st === "done" ? "var(--risk-low)" : "var(--border)" }} />}
            <div className={`relative grid place-items-center w-6 h-6 rounded-full shrink-0 ${st === "active" ? "animate-pulse-ring" : ""}`}
                 style={{ border: `2px solid ${color}`, background: st === "done" ? "var(--risk-low)" : "var(--bg-2)" }}>
              {st === "done"
                ? <Check size={12} style={{ color: "#04222b" }} strokeWidth={3} />
                : <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
            </div>
            <div className="-mt-0.5">
              <div className="text-[12px] font-semibold" style={{ color: st === "pending" ? "var(--text-faint)" : "var(--text)" }}>{p.label}</div>
              <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>{p.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Hub({ agents }: { agents: Record<string, AState> }) {
  const size = 340, c = size / 2, r = size * 0.37;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full animate-orbit" style={{ border: "1px dashed rgba(34,211,238,.16)" }} />
      <div className="absolute rounded-full animate-pulse-ring" style={{ inset: size * 0.26, border: "1px solid rgba(34,211,238,.22)" }} />
      <svg className="absolute inset-0" width={size} height={size}>
        {AGENTS.map((a, i) => {
          const ang = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
          const st = agents[a.key];
          const esc = st?.status === "done" && (st.sev === "Critical" || st.sev === "High");
          return <line key={i} x1={c} y1={c} x2={c + r * Math.cos(ang)} y2={c + r * Math.sin(ang)}
                       stroke={esc ? "rgba(249,115,22,.35)" : "rgba(34,211,238,.18)"} strokeWidth={1} />;
        })}
      </svg>
      <div className="absolute grid place-items-center rounded-2xl glow-brand"
           style={{ left: c - 40, top: c - 40, width: 80, height: 80, background: "linear-gradient(135deg,#0e2a36,#0b1120)" }}>
        <ShieldCheck size={26} style={{ color: "var(--brand)" }} />
        <span className="text-[10px] font-bold tracking-widest mt-1" style={{ color: "var(--brand)" }}>AEGIS</span>
      </div>
      {AGENTS.map((a, i) => {
        const ang = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
        const x = c + r * Math.cos(ang), y = c + r * Math.sin(ang);
        const Icon = ICON[a.key]; const st = agents[a.key];
        const color = st?.status === "done" ? sevColor[st.sev] : st?.status === "running" ? "var(--brand)" : "var(--text-faint)";
        return (
          <div key={a.key} className={`absolute grid place-items-center rounded-xl panel-soft ${st?.status === "running" ? "animate-pulse-ring" : ""}`}
               style={{ left: x - 26, top: y - 26, width: 52, height: 52, boxShadow: `0 0 0 1px ${color}66, 0 0 16px ${color}33`, transition: "box-shadow .4s ease" }}>
            <Icon size={17} style={{ color }} />
            <span className="text-[9.5px] font-bold mt-0.5" style={{ color: "var(--text-dim)" }}>{a.short}</span>
          </div>
        );
      })}
    </div>
  );
}

function AgentCard({ agentKey, name, role, state }: {
  agentKey: string; name: string; role: string; state?: AState;
}) {
  const Icon = ICON[agentKey];
  const st = state ?? { status: "idle" as const, sev: "Low" as RiskLevel, findings: 0 };
  const color = st.status === "done" ? sevColor[st.sev] : st.status === "running" ? "var(--brand)" : "var(--text-faint)";
  return (
    <div className="panel p-3" style={{ boxShadow: `inset 0 -2px 0 ${color}`, transition: "box-shadow .4s ease" }}>
      <div className="flex items-center gap-2">
        <Icon size={15} style={{ color }} />
        <span className="text-[12px] font-bold">{name}</span>
        {st.status === "done" && <span className="ml-auto chip" style={{ color, borderColor: `${color}66` }}>{st.sev}</span>}
        {st.status === "running" && <Loader2 size={13} className="ml-auto animate-spin" style={{ color: "var(--brand)" }} />}
      </div>
      <div className="text-[10px] mt-1.5" style={{ color: "var(--text-faint)" }}>{role}</div>
      <div className="flex items-center justify-between mt-2 text-[10px]">
        <span style={{ color: "var(--text-dim)" }}>{st.status === "done" ? `${st.findings} findings` : st.status === "running" ? "reviewing…" : "queued"}</span>
        <span className="flex items-center gap-1" style={{ color }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          {st.status}
        </span>
      </div>
    </div>
  );
}
