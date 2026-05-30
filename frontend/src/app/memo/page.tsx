"use client";

import Shell from "@/components/Shell";
import { RiskGauge } from "@/components/ui";
import { LiveBadge } from "@/components/LiveBadge";
import PrintableMemo from "@/components/PrintableMemo";
import { useRunData } from "@/lib/useRunData";
import {
  ShieldAlert, TrendingDown, GitMerge, FileText, FileDown,
  ClipboardCheck, Paperclip, AlertOctagon,
} from "lucide-react";

const ACTION_OWNERS = ["AM", "SP", "RT", "DS", "JB"];
const ACTION_STATUS = ["In Progress", "In Progress", "Pending", "Pending", "Pending"];

export default function MemoPage() {
  const { data, live } = useRunData();
  const m = data.memo;
  return (
    <Shell>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-[22px] font-bold">Executive Memo</h1>
            <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>Leadership decision briefing.</p>
          </div>
          <LiveBadge live={live} />
        </div>
        <div className="flex items-center gap-6">
          <RiskGauge value={m.overall_risk} size={104} />
          <div className="text-center">
            <div className="label-eyebrow">Confidence</div>
            <div className="text-[26px] font-bold" style={{ color: "var(--brand)" }}>{Math.round(m.confidence * 100)}%</div>
            <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>High Confidence</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        <div className="flex flex-col gap-5">
          {/* recommendation block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="panel p-5" style={{ borderColor: "rgba(245,181,61,.45)", boxShadow: "0 0 28px rgba(245,181,61,.10)" }}>
              <div className="label-eyebrow" style={{ color: "var(--accent)" }}>Executive Recommendation</div>
              <div className="text-[30px] font-bold my-2" style={{ color: "var(--conditional)" }}>Conditional No-Go</div>
              <p className="text-[12px] leading-snug" style={{ color: "var(--text-dim)" }}>{m.primary_reason}</p>
            </div>
            <div className="panel p-5">
              <div className="label-eyebrow mb-2">Leadership Summary</div>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-dim)" }}>{m.summary}</p>
            </div>
          </div>

          {/* three pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Pillar icon={ShieldAlert} tone="critical" title="Primary Blocker"
              head="Unvalidated restore path" tag="CRITICAL"
              body="Rollback relies on a snapshot restore that has never been tested." />
            <Pillar icon={TrendingDown} tone="high" title="Business Impact"
              head="High operational impact" tag="HIGH"
              body="Checkout availability and nightly revenue reconciliation are both exposed." />
            <Pillar icon={GitMerge} tone="low" title="Path to Approval"
              head="Complete required validations" tag="5 ACTIONS"
              body="Residual risk drops to acceptable once pre-checks are closed." />
          </div>

          {/* required actions */}
          <div className="panel p-5">
            <div className="label-eyebrow mb-3">Required Actions Before Approval</div>
            <div className="space-y-2.5">
              {m.required_actions.map((a, i) => (
                <div key={i} className="flex items-center gap-3 panel-soft px-3 py-2.5">
                  <span className="grid place-items-center w-7 h-7 rounded-full text-[10px] font-bold shrink-0"
                        style={{ background: "rgba(34,211,238,.12)", color: "var(--brand)" }}>{ACTION_OWNERS[i]}</span>
                  <span className="text-[12px] flex-1" style={{ color: "var(--text-dim)" }}>{a}</span>
                  <span className="chip" style={ACTION_STATUS[i] === "In Progress"
                    ? { color: "var(--brand)", borderColor: "rgba(34,211,238,.4)" }
                    : { color: "var(--text-faint)", borderColor: "var(--border)" }}>{ACTION_STATUS[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* export rail */}
        <div className="flex flex-col gap-3">
          <div className="label-eyebrow">Distribute</div>
          <ExportBtn icon={FileDown} title="Export PDF" sub="Leadership-ready briefing" primary onClick={() => window.print()} />
          <ExportBtn icon={FileText} title="Export Memo" sub="Markdown / HTML" soon />
          <ExportBtn icon={ClipboardCheck} title="Compliance Summary" sub="Governance record" soon />
          <ExportBtn icon={Paperclip} title="Evidence Appendix" sub="All cited sources" soon />

          <div className="panel p-4 mt-1">
            <div className="label-eyebrow mb-2">Open Questions</div>
            <div className="space-y-2">
              {m.open_questions.map((q, i) => (
                <div key={i} className="flex gap-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
                  <AlertOctagon size={12} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />{q}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PrintableMemo m={m} />
    </Shell>
  );
}

function Pillar({ icon: Icon, title, head, tag, body, tone }: {
  icon: React.ElementType; title: string; head: string; tag: string; body: string;
  tone: "critical" | "high" | "low";
}) {
  const color = { critical: "var(--risk-critical)", high: "var(--risk-high)", low: "var(--risk-low)" }[tone];
  return (
    <div className="panel p-4" style={{ boxShadow: `inset 0 2px 0 ${color}` }}>
      <div className="flex items-center gap-2">
        <Icon size={15} style={{ color }} />
        <span className="label-eyebrow">{title}</span>
      </div>
      <div className="text-[13px] font-bold mt-2">{head}</div>
      <span className="chip mt-1.5 inline-block" style={{ color, borderColor: `${color}66` }}>{tag}</span>
      <p className="text-[11px] mt-2 leading-snug" style={{ color: "var(--text-faint)" }}>{body}</p>
    </div>
  );
}

function ExportBtn({ icon: Icon, title, sub, primary, onClick, soon }: {
  icon: React.ElementType; title: string; sub: string; primary?: boolean; onClick?: () => void; soon?: boolean;
}) {
  return (
    <button onClick={soon ? undefined : onClick} disabled={soon}
      title={soon ? "Available in a future release" : undefined}
      className={`panel p-3 flex items-center gap-3 text-left transition-all ${soon ? "opacity-55 cursor-not-allowed" : "hover:-translate-y-0.5"} ${primary ? "glow-brand" : ""}`}
      style={primary ? { borderColor: "rgba(34,211,238,.4)" } : undefined}>
      <div className="grid place-items-center w-9 h-9 rounded-lg panel-soft shrink-0">
        <Icon size={15} style={{ color: primary ? "var(--brand)" : "var(--text-dim)" }} />
      </div>
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold flex items-center gap-2">
          {title}
          {soon && <span className="chip" style={{ color: "var(--text-faint)", borderColor: "var(--border)", fontSize: 9, padding: "1px 6px" }}>SOON</span>}
        </div>
        <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>{sub}</div>
      </div>
    </button>
  );
}
