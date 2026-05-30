"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { Field, TextInput, TextArea, Select } from "@/components/form";
import { AGENTS } from "@/lib/types";
import {
  FolderUp, Save, Play, ShieldCheck, CloudOff, Tag, Users, Gauge,
  ListChecks, AlertTriangle, Network, Activity, Database, ShieldAlert,
  TrendingUp, Crosshair, ChevronDown,
} from "lucide-react";

const CHANGE_TYPES = ["Database Upgrade", "Infrastructure Migration", "Security Rule Change", "AI Feature Release"];
const ENVIRONMENTS = ["Production", "Staging", "Pre-Production"];
const PRIORITIES = ["High — Customer Facing / Revenue Impact", "Medium — Internal Systems", "Low — Non-critical"];
const APPETITES = ["Conservative", "Moderate", "Aggressive"];

const AGENT_ICON: Record<string, React.ElementType> = {
  architecture: Network, sre: Activity, database: Database,
  security: ShieldAlert, business: TrendingUp, red_team: Crosshair,
};

const REQUIRED_EVIDENCE = [
  { label: "Architecture & dependency docs", present: true },
  { label: "Change & rollback plan", present: true },
  { label: "Incident history", present: true },
  { label: "Logs (slow query / error)", present: true },
  { label: "Release & security policies", present: true },
];
const MISSING_EVIDENCE = [
  "Tested restore / backup validation report",
  "Staging dress-rehearsal results",
];

export default function NewReviewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("MySQL 5.7 → 8.0 Production Upgrade");
  const [type, setType] = useState(CHANGE_TYPES[0]);
  const [desc, setDesc] = useState(
    "In-place upgrade of db-prod-01 (primary) from MySQL 5.7.38 to 8.0.36. Covers stored-procedure compatibility, charset migration, and replication continuity to db-prod-02.",
  );
  const [date, setDate] = useState("2025-05-30");
  const [window, setWindow] = useState("23:00 – 01:00");
  const [env, setEnv] = useState(ENVIRONMENTS[0]);
  const [systems, setSystems] = useState("db-prod-01 (Primary), db-prod-02 (Replica), orders-service, shop-web");
  const [priority, setPriority] = useState(PRIORITIES[0]);
  const [appetite, setAppetite] = useState(APPETITES[1]);

  // Live-derived preview values
  const expectedAgents = useMemo(() => {
    const base = ["sre", "security", "red_team"];
    const map: Record<string, string[]> = {
      "Database Upgrade": ["database", "business"],
      "Infrastructure Migration": ["database", "business", "architecture"],
      "Security Rule Change": ["business"],
      "AI Feature Release": ["business"],
    };
    const keys = new Set([...base, ...(map[type] ?? ["database", "business"])]);
    return AGENTS.filter((a) => keys.has(a.key));
  }, [type]);

  const initialRisk = useMemo(() => {
    let r = 55;
    if (env === "Production") r += 12;
    if (priority.startsWith("High")) r += 8;
    if (appetite === "Conservative") r += 5;
    if (appetite === "Aggressive") r -= 6;
    return Math.min(95, r);
  }, [env, priority, appetite]);

  return (
    <Shell>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold">New Review</h1>
        <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>
          Create a change review and build your review package.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        {/* form */}
        <div className="panel p-5">
          <div className="label-eyebrow mb-4" style={{ color: "var(--brand)" }}>Change Details</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Change Title">
              <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Change Type">
              <div className="relative">
                <Select options={CHANGE_TYPES} value={type} onChange={(e) => setType(e.target.value)} />
                <ChevronDown size={14} className="absolute right-3 top-3 pointer-events-none" style={{ color: "var(--text-faint)" }} />
              </div>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Change Description">
              <TextArea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="Planned Date">
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Maintenance Window">
              <TextInput value={window} onChange={(e) => setWindow(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="Environment">
              <div className="relative">
                <Select options={ENVIRONMENTS} value={env} onChange={(e) => setEnv(e.target.value)} />
                <ChevronDown size={14} className="absolute right-3 top-3 pointer-events-none" style={{ color: "var(--text-faint)" }} />
              </div>
            </Field>
            <Field label="Systems Affected">
              <TextInput value={systems} onChange={(e) => setSystems(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="Business Priority">
              <div className="relative">
                <Select options={PRIORITIES} value={priority} onChange={(e) => setPriority(e.target.value)} />
                <ChevronDown size={14} className="absolute right-3 top-3 pointer-events-none" style={{ color: "var(--text-faint)" }} />
              </div>
            </Field>
            <Field label="Risk Appetite">
              <div className="relative">
                <Select options={APPETITES} value={appetite} onChange={(e) => setAppetite(e.target.value)} />
                <ChevronDown size={14} className="absolute right-3 top-3 pointer-events-none" style={{ color: "var(--text-faint)" }} />
              </div>
            </Field>
          </div>

          {/* footer */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t hairline" style={{ borderColor: "var(--border)" }}>
            <span className="chip chip-low"><ShieldCheck size={12} /> 100% Local</span>
            <span className="chip" style={{ color: "var(--text-dim)", borderColor: "var(--border)" }}>
              <CloudOff size={12} /> No Cloud Calls
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button disabled title="Available in a future release"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] panel-soft opacity-55 cursor-not-allowed"
                      style={{ color: "var(--text-dim)" }}>
                <FolderUp size={14} /> Attach Folder
                <span className="chip" style={{ color: "var(--text-faint)", borderColor: "var(--border)", fontSize: 9, padding: "1px 5px" }}>SOON</span>
              </button>
              <button disabled title="Available in a future release"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] panel-soft opacity-55 cursor-not-allowed"
                      style={{ color: "var(--text-dim)" }}>
                <Save size={14} /> Save Draft
                <span className="chip" style={{ color: "var(--text-faint)", borderColor: "var(--border)", fontSize: 9, padding: "1px 5px" }}>SOON</span>
              </button>
              <button onClick={() => router.push("/war-room?autostart=1")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12.5px] font-semibold glow-brand"
                style={{ background: "linear-gradient(135deg,#0e7490,#22d3ee)", color: "#04222b" }}>
                <Play size={14} /> Start AI Review
              </button>
            </div>
          </div>
        </div>

        {/* preview rail */}
        <div className="flex flex-col gap-3">
          <div className="label-eyebrow">Review Package Preview</div>

          <PreviewCard icon={Tag} title="Change Type Identified" tone="amber"
            right={<span className="chip chip-medium">{type.split(" ")[0]}</span>}>
            Routed as a {type.toLowerCase()} on a Tier-1 system.
          </PreviewCard>

          <PreviewCard icon={Users} title="Expected Agents" tone="brand"
            right={<span className="text-[13px] font-bold" style={{ color: "var(--brand)" }}>{expectedAgents.length}</span>}>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {expectedAgents.map((a) => {
                const I = AGENT_ICON[a.key];
                return (
                  <span key={a.key} className="grid place-items-center w-7 h-7 rounded-lg panel-soft" title={a.name}>
                    <I size={13} style={{ color: "var(--brand)" }} />
                  </span>
                );
              })}
            </div>
          </PreviewCard>

          <PreviewCard icon={Gauge} title="Initial Risk Assumption" tone="amber"
            right={<RiskBadge value={initialRisk} />}>
            Pre-analysis estimate from environment, priority & appetite.
          </PreviewCard>

          <PreviewCard icon={ListChecks} title="Required Evidence Checklist" tone="low">
            <div className="space-y-1.5 mt-2">
              {REQUIRED_EVIDENCE.map((e) => (
                <div key={e.label} className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-dim)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--risk-low)" }} />
                  {e.label}
                </div>
              ))}
            </div>
          </PreviewCard>

          <PreviewCard icon={AlertTriangle} title="Missing Recommended Evidence" tone="high">
            <div className="space-y-1.5 mt-2">
              {MISSING_EVIDENCE.map((e) => (
                <div key={e} className="flex items-center gap-2 text-[11px]" style={{ color: "#ffd9bf" }}>
                  <AlertTriangle size={11} style={{ color: "var(--risk-high)" }} />
                  {e}
                </div>
              ))}
            </div>
          </PreviewCard>
        </div>
      </div>
    </Shell>
  );
}

function PreviewCard({ icon: Icon, title, children, right, tone }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
  right?: React.ReactNode; tone: "brand" | "amber" | "low" | "high";
}) {
  const color = { brand: "var(--brand)", amber: "var(--accent)", low: "var(--risk-low)", high: "var(--risk-high)" }[tone];
  return (
    <div className="panel p-3.5" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span className="text-[12px] font-semibold">{title}</span>
        <span className="ml-auto">{right}</span>
      </div>
      <div className="text-[11px] mt-1 leading-snug" style={{ color: "var(--text-faint)" }}>{children}</div>
    </div>
  );
}

function RiskBadge({ value }: { value: number }) {
  const color = value >= 80 ? "var(--risk-critical)" : value >= 65 ? "var(--risk-high)" : "var(--risk-medium)";
  return (
    <span className="grid place-items-center w-8 h-8 rounded-full text-[12px] font-bold"
          style={{ color, border: `2px solid ${color}` }}>
      {value}
    </span>
  );
}
