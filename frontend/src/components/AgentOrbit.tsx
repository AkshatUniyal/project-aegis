"use client";

import { Network, Activity, Database, ShieldAlert, TrendingUp, Crosshair, ShieldCheck } from "lucide-react";

const NODES = [
  { short: "ARCH", icon: Network, sev: "medium" },
  { short: "SRE", icon: Activity, sev: "high" },
  { short: "DB", icon: Database, sev: "critical" },
  { short: "SEC", icon: ShieldAlert, sev: "medium" },
  { short: "BIZ", icon: TrendingUp, sev: "high" },
  { short: "RED", icon: Crosshair, sev: "high" },
];

const sevColor: Record<string, string> = {
  critical: "var(--risk-critical)", high: "var(--risk-high)",
  medium: "var(--risk-medium)", low: "var(--risk-low)",
};

export default function AgentOrbit({ size = 360 }: { size?: number }) {
  const c = size / 2;
  const r = size * 0.38;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* orbit rings */}
      <div className="absolute inset-0 rounded-full animate-orbit" style={{ border: "1px dashed rgba(34,211,238,.18)" }} />
      <div className="absolute rounded-full animate-orbit-rev"
           style={{ inset: size * 0.12, border: "1px dashed rgba(245,181,61,.14)" }} />
      <div className="absolute rounded-full animate-pulse-ring"
           style={{ inset: size * 0.30, border: "1px solid rgba(34,211,238,.25)" }} />

      {/* connectors */}
      <svg className="absolute inset-0" width={size} height={size}>
        {NODES.map((_, i) => {
          const a = (i / NODES.length) * Math.PI * 2 - Math.PI / 2;
          return <line key={i} x1={c} y1={c} x2={c + r * Math.cos(a)} y2={c + r * Math.sin(a)}
                       stroke="rgba(34,211,238,.16)" strokeWidth={1} />;
        })}
      </svg>

      {/* core */}
      <div className="absolute grid place-items-center rounded-2xl glow-brand"
           style={{ left: c - 44, top: c - 44, width: 88, height: 88,
                    background: "linear-gradient(135deg,#0e2a36,#0b1120)" }}>
        <ShieldCheck size={30} style={{ color: "var(--brand)" }} />
        <span className="text-[10px] font-bold tracking-widest mt-1" style={{ color: "var(--brand)" }}>AEGIS</span>
      </div>

      {/* agent nodes */}
      {NODES.map((n, i) => {
        const a = (i / NODES.length) * Math.PI * 2 - Math.PI / 2;
        const x = c + r * Math.cos(a), y = c + r * Math.sin(a);
        const Icon = n.icon;
        return (
          <div key={n.short} className="absolute grid place-items-center rounded-xl panel-soft"
               style={{ left: x - 28, top: y - 28, width: 56, height: 56,
                        boxShadow: `0 0 0 1px ${sevColor[n.sev]}55, 0 0 18px ${sevColor[n.sev]}22` }}>
            <Icon size={18} style={{ color: sevColor[n.sev] }} />
            <span className="text-[9.5px] font-bold mt-0.5" style={{ color: "var(--text-dim)" }}>{n.short}</span>
          </div>
        );
      })}
    </div>
  );
}
