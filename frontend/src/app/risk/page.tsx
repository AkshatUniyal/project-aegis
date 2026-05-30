"use client";

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell, LabelList,
} from "recharts";
import Shell from "@/components/Shell";
import { RiskGauge, sevColor, SevChip } from "@/components/ui";
import { LiveBadge } from "@/components/LiveBadge";
import { AGENTS, type RiskLevel } from "@/lib/types";
import { useRunData } from "@/lib/useRunData";
import { AlertTriangle, CheckCircle2, ListTodo } from "lucide-react";

const SHORT: Record<string, string> = {
  technical_complexity: "Technical", operational_readiness: "Operational",
  rollback_confidence: "Rollback", security_compliance: "Security",
  business_blast_radius: "Business", evidence_completeness: "Evidence",
};

const LEVEL_RISK: Record<RiskLevel, number> = { Low: 20, Medium: 50, High: 78, Critical: 95 };

export default function RiskCockpitPage() {
  const { data, live } = useRunData();
  const score = data.score;
  const radarData = score.categories.map((c) => ({ dim: SHORT[c.category] ?? c.label, score: c.score }));
  const agentData = AGENTS.map((a) => {
    const rep = data.reports.find((r) => r.agent === a.name);
    const top = rep?.highest_severity ?? "Low";
    return { agent: a.short, risk: LEVEL_RISK[top], sev: top };
  });
  return (
    <Shell>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold">Risk Cockpit</h1>
          <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>Detailed analytics for executive review.</p>
        </div>
        <LiveBadge live={live} />
      </div>

      {/* top KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <div className="panel p-4 flex items-center justify-center"><RiskGauge value={score.overall} size={120} /></div>
        <KpiCard icon={AlertTriangle} tone="amber" label="Recommendation"
          value={score.decision === "No-Go" ? "No-Go" : "Conditional No-Go"} sub="Address blockers to re-enable" />
        <KpiCard icon={CheckCircle2} tone="brand" label="Confidence"
          value={`${Math.round(score.confidence * 100)}%`} sub="6 of 6 agents aligned" />
        <KpiCard icon={ListTodo} tone="high" label="Open Actions" value="5" sub="Required before approval" />
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="panel p-4">
          <div className="label-eyebrow mb-2">Risk Dimension Radar</div>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="#1e2a44" />
              <PolarAngleAxis dataKey="dim" tick={{ fill: "#93a4c0", fontSize: 11 }} />
              <Radar dataKey="score" stroke="#f5b53d" fill="#f5b53d" fillOpacity={0.28} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel p-4">
          <div className="label-eyebrow mb-2">Agent Risk Signals</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={agentData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="agent" tick={{ fill: "#93a4c0", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#5e708f", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Bar dataKey="risk" radius={[4, 4, 0, 0]} barSize={34}>
                {agentData.map((d, i) => <Cell key={i} fill={sevColor[d.sev as RiskLevel]} />)}
                <LabelList dataKey="risk" position="top" fill="#a3b2cb" fontSize={11} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* category table */}
      <div className="panel p-4">
        <div className="label-eyebrow mb-3">Category Breakdown</div>
        <div className="space-y-2">
          {score.categories.map((c) => (
            <div key={c.category} className="grid grid-cols-[160px_1fr_90px] items-center gap-4">
              <div className="text-[12px] font-medium">{c.label}<span className="ml-2 text-[10px]" style={{ color: "var(--text-faint)" }}>{Math.round(c.weight * 100)}%</span></div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: sevColor[c.severity] }} />
                </div>
                <span className="text-[12px] font-bold w-7 text-right" style={{ color: sevColor[c.severity] }}>{c.score}</span>
              </div>
              <div className="justify-self-end"><SevChip level={c.severity} /></div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t hairline flex gap-5 text-[10.5px]" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
          <span className="label-eyebrow">Interpretation</span>
          <Legend c="var(--risk-low)" t="0–39 Low" /><Legend c="var(--risk-medium)" t="40–64 Medium" />
          <Legend c="var(--risk-high)" t="65–84 High" /><Legend c="var(--risk-critical)" t="85–100 Critical" />
        </div>
      </div>
    </Shell>
  );
}

function KpiCard({ icon: Icon, label, value, sub, tone }: {
  icon: React.ElementType; label: string; value: string; sub: string; tone: "amber" | "brand" | "high";
}) {
  const color = { amber: "var(--accent)", brand: "var(--brand)", high: "var(--risk-high)" }[tone];
  return (
    <div className="panel p-4 flex flex-col justify-center">
      <div className="flex items-center gap-2">
        <Icon size={15} style={{ color }} />
        <span className="label-eyebrow">{label}</span>
      </div>
      <div className="text-[18px] font-bold mt-1.5" style={{ color }}>{value}</div>
      <div className="text-[10.5px] mt-0.5" style={{ color: "var(--text-faint)" }}>{sub}</div>
    </div>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: c }} />{t}</span>;
}
