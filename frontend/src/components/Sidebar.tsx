"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, FilePlus2, FolderSearch, Radio, Users, Gauge,
  FileText, History, Settings, ShieldCheck, Cpu, Database, WifiOff, MessagesSquare,
} from "lucide-react";

// Ordered to follow the review workflow: intake → war room → debate → risk → evidence → memo.
const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/new-review", label: "New Review", icon: FilePlus2 },
  { href: "/war-room", label: "War Room", icon: Radio },
  { href: "/debate", label: "Debate", icon: MessagesSquare },
  { href: "/risk", label: "Risk Cockpit", icon: Gauge },
  { href: "/evidence", label: "Evidence", icon: FolderSearch },
  { href: "/memo", label: "Memo", icon: FileText },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-[210px] shrink-0 border-r hairline flex flex-col" style={{ borderColor: "var(--border)" }}>
      {/* brand */}
      <div className="px-4 pt-5 pb-4 mb-1 border-b hairline" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="relative grid place-items-center w-12 h-12 rounded-xl glow-brand shrink-0"
               style={{ background: "linear-gradient(135deg,#0e3543,#0b1120)" }}>
            <ShieldCheck size={26} style={{ color: "var(--brand)" }} strokeWidth={2.2} />
          </div>
          <div className="leading-none">
            <div className="text-[24px] font-bold tracking-[0.14em]"
                 style={{ background: "linear-gradient(90deg,#e6edf7,#22d3ee)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              AEGIS
            </div>
            <div className="text-[10px] mt-1.5 tracking-[0.12em] uppercase" style={{ color: "var(--text-faint)" }}>
              Change Risk War Room
            </div>
          </div>
        </div>
      </div>

      <nav className="px-3 flex-1 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors"
              style={active
                ? { background: "rgba(34,211,238,.10)", color: "var(--brand)", boxShadow: "inset 2px 0 0 var(--brand)" }
                : { color: "var(--text-dim)" }}>
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* local status footer */}
      <div className="p-3 space-y-2 border-t hairline" style={{ borderColor: "var(--border)" }}>
        <Status icon={WifiOff} label="Offline Mode" value="Active" tone="brand" />
        <Status icon={Cpu} label="Local Model" value="llama3.2" tone="ok" />
        <Status icon={Database} label="Vector Index" value="Ready" tone="ok" />
      </div>
    </aside>
  );
}

function Status({ icon: Icon, label, value, tone }: {
  icon: React.ElementType; label: string; value: string; tone: "brand" | "ok";
}) {
  const color = tone === "brand" ? "var(--brand)" : "var(--risk-low)";
  return (
    <div className="panel-soft px-2.5 py-1.5 flex items-center gap-2">
      <Icon size={13} style={{ color }} />
      <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>{label}</span>
      <span className="ml-auto text-[10.5px] font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}
