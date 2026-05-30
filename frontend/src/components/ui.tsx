"use client";

import type { RiskLevel, Decision } from "@/lib/types";

export const sevColor: Record<RiskLevel, string> = {
  Critical: "var(--risk-critical)", High: "var(--risk-high)",
  Medium: "var(--risk-medium)", Low: "var(--risk-low)",
};
export const sevChip: Record<RiskLevel, string> = {
  Critical: "chip-critical", High: "chip-high", Medium: "chip-medium", Low: "chip-low",
};

export function SevChip({ level }: { level: RiskLevel }) {
  return <span className={`chip ${sevChip[level]}`}>{level}</span>;
}

export function decisionColor(d: Decision): string {
  if (d === "No-Go") return "var(--no-go)";
  if (d === "Go") return "var(--go)";
  return "var(--conditional)"; // Conditional Go / Delay
}

/** Radial gauge for a 0-100 risk score. */
export function RiskGauge({ value, size = 132, label = "OVERALL RISK" }: {
  value: number; size?: number; label?: string;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = Math.PI * r; // semicircle
  const pct = Math.min(100, Math.max(0, value)) / 100;
  const color = value >= 85 ? "var(--risk-critical)" : value >= 65 ? "var(--risk-high)"
    : value >= 40 ? "var(--risk-medium)" : "var(--risk-low)";
  const cx = size / 2, cy = size / 2;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size / 2 + 18 }}>
      <svg width={size} height={size / 2 + 10} style={{ overflow: "visible" }}>
        <path d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
              fill="none" stroke="var(--border)" strokeWidth={stroke} strokeLinecap="round" />
        <path d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
              fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
              style={{ transition: "stroke-dashoffset .8s ease", filter: `drop-shadow(0 0 6px ${color}66)` }} />
      </svg>
      <div className="absolute" style={{ top: size / 2 - 30, textAlign: "center" }}>
        <div className="text-[28px] font-bold leading-none" style={{ color }}>{value}</div>
        <div className="text-[9px]" style={{ color: "var(--text-faint)" }}>/ 100</div>
      </div>
      <div className="label-eyebrow mt-1">{label}</div>
    </div>
  );
}

export function StatTile({ value, label, color }: { value: React.ReactNode; label: string; color: string }) {
  return (
    <div className="panel-soft p-3 text-center">
      <div className="text-[22px] font-bold leading-none" style={{ color }}>{value}</div>
      <div className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>{label}</div>
    </div>
  );
}
