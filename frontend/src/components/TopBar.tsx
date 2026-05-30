"use client";

import { Activity } from "lucide-react";

export default function TopBar({
  status = "WAR ROOM ACTIVE",
  runId = "AEG-2025-0530-01",
}: { status?: string; runId?: string }) {
  return (
    <header className="h-12 shrink-0 border-b hairline flex items-center gap-4 px-5"
            style={{ borderColor: "var(--border)" }}>
      <div className="chip chip-low">
        <span className="w-1.5 h-1.5 rounded-full animate-pulse-ring" style={{ background: "var(--risk-low)" }} />
        {status}
      </div>
      <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>
        Run ID <span style={{ color: "var(--text-dim)" }}>{runId}</span>
      </div>
      <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>
        Scenario <span style={{ color: "var(--text-dim)" }}>MySQL 5.7 → 8.0</span>
      </div>
      <div className="ml-auto flex items-center gap-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
        <span className="font-mono italic" style={{ color: "var(--text-dim)" }}>Akshat Puran Uniyal</span>
        <span className="mx-1 opacity-30">·</span>
        <Activity size={13} style={{ color: "var(--brand)" }} />
        <span style={{ color: "var(--brand)" }}>Live Activity</span>
      </div>
    </header>
  );
}
