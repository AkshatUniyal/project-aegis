"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { decisionColor } from "@/components/ui";
import { listReviews, type RunSummary } from "@/lib/api";
import { History as HistoryIcon, FileText, Loader2, FolderClock, Layers, Gauge, ShieldAlert } from "lucide-react";

export default function HistoryPage() {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);

  useEffect(() => { listReviews().then((r) => setRuns(r?.runs ?? [])); }, []);

  const complete = (runs ?? []).filter((r) => r.status === "complete");
  const avgRisk = complete.length
    ? Math.round(complete.reduce((s, r) => s + (r.overall_risk ?? 0), 0) / complete.length) : 0;
  const blockers = complete.filter((r) => (r.overall_risk ?? 0) >= 70).length;

  return (
    <Shell>
      <div className="mb-4 flex items-center gap-2">
        <HistoryIcon size={18} style={{ color: "var(--brand)" }} />
        <div>
          <h1 className="text-[22px] font-bold">Review History</h1>
          <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>Local audit trail of every change review.</p>
        </div>
      </div>

      {/* summary band */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <Summary icon={Layers} value={String(runs?.length ?? "—")} label="Total reviews" color="var(--brand)" />
        <Summary icon={Gauge} value={complete.length ? String(avgRisk) : "—"} label="Average risk score" color="var(--accent)" />
        <Summary icon={ShieldAlert} value={complete.length ? String(blockers) : "—"} label="High-risk (≥70)" color="var(--risk-high)" />
      </div>

      <div className="panel p-2">
        <div className="grid grid-cols-[1fr_140px_120px_90px_80px] gap-3 px-3 py-2 label-eyebrow border-b hairline"
             style={{ borderColor: "var(--border)" }}>
          <span>Change</span><span>Run ID</span><span>Decision</span><span>Risk</span><span></span>
        </div>

        {runs === null && (
          <div className="flex items-center gap-2 px-3 py-6 text-[12px]" style={{ color: "var(--text-faint)" }}>
            <Loader2 size={14} className="animate-spin" /> loading…
          </div>
        )}
        {runs?.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-[12px]" style={{ color: "var(--text-faint)" }}>
            <FolderClock size={28} style={{ opacity: 0.5 }} />
            No reviews yet. Start one from the War Room.
          </div>
        )}
        {runs?.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_140px_120px_90px_80px] gap-3 px-3 py-2.5 items-center text-[12px] rounded-lg hover:bg-[var(--panel-2)] transition-colors">
            <div>
              <div className="font-medium truncate">{r.title}</div>
              <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                {r.change_type ?? "—"} · {r.created_at?.slice(0, 16).replace("T", " ")}
              </div>
            </div>
            <span className="font-mono text-[11px]" style={{ color: "var(--text-dim)" }}>{r.id}</span>
            <span className="font-semibold" style={{ color: r.decision ? decisionColor(r.decision as never) : "var(--text-faint)" }}>
              {r.status === "complete" ? (r.decision === "No-Go" ? "No-Go" : "Conditional No-Go") : r.status}
            </span>
            <span className="font-bold" style={{ color: "var(--text-dim)" }}>{r.overall_risk != null ? `${Math.round(r.overall_risk)}` : "—"}</span>
            <Link href={`/memo?run=${r.id}`} className="flex items-center gap-1 text-[11px] justify-self-end" style={{ color: "var(--brand)" }}>
              <FileText size={12} /> Memo
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-4 panel-soft px-4 py-3 flex items-center gap-2 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
        <HistoryIcon size={13} style={{ color: "var(--brand)" }} />
        Every review is persisted locally to SQLite with its full reasoning trail — nothing is sent off this device.
      </div>
    </Shell>
  );
}

function Summary({ icon: Icon, value, label, color }: {
  icon: React.ElementType; value: string; label: string; color: string;
}) {
  return (
    <div className="panel p-4 flex items-center gap-3">
      <div className="grid place-items-center w-11 h-11 rounded-lg panel-soft shrink-0">
        <Icon size={19} style={{ color }} />
      </div>
      <div>
        <div className="text-[22px] font-bold leading-none" style={{ color }}>{value}</div>
        <div className="text-[10.5px] mt-1" style={{ color: "var(--text-faint)" }}>{label}</div>
      </div>
    </div>
  );
}
