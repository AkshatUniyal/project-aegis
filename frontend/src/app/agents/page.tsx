"use client";

import Shell from "@/components/Shell";
import {
  Network, Activity, Database, ShieldAlert, TrendingUp, Crosshair, Gavel, Workflow,
  Users2, EyeOff, MessagesSquare, FileCheck2, ArrowRight,
} from "lucide-react";

const ROSTER = [
  { icon: Workflow, name: "Supervisor Agent", lens: "Orchestration", color: "var(--brand)",
    desc: "Understands the change, selects relevant specialists, controls workflow order, prevents loops, and consolidates findings into the debate.",
    focus: ["routing", "task assignment", "consolidation"] },
  { icon: Network, name: "Architecture Agent", lens: "Dependencies & topology", color: "var(--risk-medium)",
    desc: "Reviews integration points, runtime coupling, and hidden system impact across the affected services.",
    focus: ["architecture", "change plan"] },
  { icon: Activity, name: "SRE Agent", lens: "Operational readiness", color: "var(--risk-high)",
    desc: "Scrutinises rollback credibility, restore testing, monitoring/alerting coverage, runbooks, and incident history.",
    focus: ["change plan", "incidents", "policies"] },
  { icon: Database, name: "Database Agent", lens: "Migration & schema", color: "var(--risk-critical)",
    desc: "Inspects migration scripts, deprecated SQL, stored procedures, sql_mode changes, charset/collation, and locking.",
    focus: ["architecture", "change plan", "logs"] },
  { icon: ShieldAlert, name: "Security Agent", lens: "Data & compliance", color: "var(--risk-medium)",
    desc: "Assesses data exposure, secrets, authentication, access control, audit logging, PII handling, and policy alignment.",
    focus: ["policies", "architecture", "incidents"] },
  { icon: TrendingUp, name: "Business Impact Agent", lens: "Customer & revenue", color: "var(--risk-high)",
    desc: "Translates technical failure modes into customer, revenue, support, and SLA consequences.",
    focus: ["incidents", "architecture", "change plan"] },
  { icon: Crosshair, name: "Red-Team Agent", lens: "Adversarial challenge", color: "var(--risk-high)",
    desc: "Challenges assumptions, finds missing evidence and untested claims, and pushes against optimistic conclusions.",
    focus: ["change plan", "policies", "incidents"] },
  { icon: Gavel, name: "Executive Synthesizer", lens: "Leadership decision", color: "var(--accent)",
    desc: "Produces the leadership-ready recommendation, risk memo, and required-action list from the board's findings.",
    focus: ["all findings", "risk score"] },
];

export default function AgentsPage() {
  return (
    <Shell>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold">Review Board</h1>
        <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>
          The specialist agents AEGIS assembles for each change. Each reviews blind first, then debates.
        </p>
      </div>

      {/* overview band */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <Stat icon={Users2} value="8" label="Specialist roles" color="var(--brand)" />
        <Stat icon={EyeOff} value="Blind-first" label="Independent review" color="var(--risk-low)" />
        <Stat icon={MessagesSquare} value="Structured" label="Cross-agent debate" color="var(--accent)" />
        <Stat icon={FileCheck2} value="Evidence-cited" label="Every finding traceable" color="var(--risk-high)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ROSTER.map((a) => (
          <div key={a.name} className="panel p-4 flex gap-4" style={{ boxShadow: `inset 3px 0 0 ${a.color}` }}>
            <div className="grid place-items-center w-11 h-11 rounded-xl panel-soft shrink-0"
                 style={{ boxShadow: `0 0 0 1px ${a.color}55` }}>
              <a.icon size={20} style={{ color: a.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold">{a.name}</span>
                <span className="label-eyebrow" style={{ color: a.color }}>{a.lens}</span>
              </div>
              <p className="text-[11.5px] mt-1 leading-snug" style={{ color: "var(--text-dim)" }}>{a.desc}</p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {a.focus.map((f) => (
                  <span key={f} className="chip" style={{ color: "var(--text-faint)", borderColor: "var(--border)" }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* how the board works */}
      <div className="panel p-5 mt-5">
        <div className="label-eyebrow mb-4">How the Board Reaches a Recommendation</div>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {[
            { n: "1", t: "Supervisor routes", d: "Selects relevant specialists for the change type" },
            { n: "2", t: "Independent review", d: "Each agent assesses evidence blind to the others" },
            { n: "3", t: "Cross-agent debate", d: "Agents challenge weak assumptions and escalate" },
            { n: "4", t: "Risk scoring", d: "Weighted, transparent category scores" },
            { n: "5", t: "Executive synthesis", d: "A leadership-ready go / no-go memo" },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex items-center gap-3 flex-1">
              <div className="panel-soft p-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="grid place-items-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0"
                        style={{ background: "rgba(34,211,238,.14)", color: "var(--brand)" }}>{s.n}</span>
                  <span className="text-[12px] font-semibold">{s.t}</span>
                </div>
                <div className="text-[10.5px] mt-1.5 leading-snug" style={{ color: "var(--text-faint)" }}>{s.d}</div>
              </div>
              {i < arr.length - 1 && <ArrowRight size={14} className="shrink-0 hidden lg:block" style={{ color: "var(--text-faint)" }} />}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Stat({ icon: Icon, value, label, color }: {
  icon: React.ElementType; value: string; label: string; color: string;
}) {
  return (
    <div className="panel p-4 flex items-center gap-3">
      <div className="grid place-items-center w-10 h-10 rounded-lg panel-soft shrink-0">
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-[15px] font-bold" style={{ color }}>{value}</div>
        <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>{label}</div>
      </div>
    </div>
  );
}
