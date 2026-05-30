"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { getHealth } from "@/lib/api";
import {
  Settings as SettingsIcon, Cpu, Database, WifiOff, FlaskConical, Lock,
  CheckCircle2, Loader2, Boxes, Network, Server, FileStack, LayoutGrid, HardDrive,
} from "lucide-react";

const STACK = [
  { icon: Cpu, name: "Ollama", role: "Local LLM runtime" },
  { icon: Network, name: "LangGraph", role: "Agent orchestration" },
  { icon: Database, name: "Chroma", role: "Local vector store" },
  { icon: Server, name: "FastAPI", role: "Review API + SSE" },
  { icon: LayoutGrid, name: "Next.js", role: "Executive UI" },
  { icon: HardDrive, name: "SQLite", role: "Audit trail" },
];

type Health = { llm_model: string; embed_model: string; demo_mode: boolean; local_only: boolean } | null;

export default function SettingsPage() {
  const [h, setH] = useState<Health | "loading" | "offline">("loading");

  useEffect(() => { getHealth().then((r) => setH(r ?? "offline")); }, []);
  const online = h !== "loading" && h !== "offline";
  const health = online ? (h as Exclude<Health, null>) : null;

  return (
    <Shell>
      <div className="mb-4 flex items-center gap-2">
        <SettingsIcon size={18} style={{ color: "var(--brand)" }} />
        <div>
          <h1 className="text-[22px] font-bold">Settings</h1>
          <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>Local runtime configuration. Everything runs on this machine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="panel p-5">
          <div className="label-eyebrow mb-3">Local Runtime</div>
          {h === "loading" ? (
            <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-faint)" }}><Loader2 size={14} className="animate-spin" /> querying backend…</div>
          ) : (
            <div className="space-y-2.5">
              <Row icon={Cpu} label="LLM Model" value={health?.llm_model ?? "—"} ok={online} />
              <Row icon={Database} label="Embedding Model" value={health?.embed_model ?? "—"} ok={online} />
              <Row icon={FlaskConical} label="Demo Mode" value={health?.demo_mode ? "Enabled (golden run)" : "Disabled (live agents)"} ok={online} tone={health?.demo_mode ? "amber" : "ok"} />
              <Row icon={WifiOff} label="Backend" value={online ? "Connected · localhost:8000" : "Offline"} ok={online} />
            </div>
          )}
        </div>

        <div className="panel p-5">
          <div className="label-eyebrow mb-3" style={{ color: "var(--risk-low)" }}>Privacy Guarantees</div>
          <div className="space-y-2.5">
            <Guarantee text="No external LLM API calls" />
            <Guarantee text="No cloud vector database" />
            <Guarantee text="No external telemetry or analytics" />
            <Guarantee text="Evidence never leaves this device" />
            <Guarantee text="All indexing, scoring & reports are local" />
          </div>
          <div className="mt-4 pt-3 border-t hairline flex items-center gap-2 text-[11px]"
               style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
            <Lock size={13} style={{ color: "var(--risk-low)" }} />
            local_only = {online ? String(health?.local_only) : "—"}
          </div>
        </div>

        <div className="panel p-5 lg:col-span-2">
          <div className="label-eyebrow mb-2">Configuration</div>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
            Runtime settings are controlled via environment variables prefixed with <code className="font-mono" style={{ color: "var(--brand)" }}>AEGIS_</code> (see <code className="font-mono">.env</code>).
            Toggle demo mode with <code className="font-mono" style={{ color: "var(--accent)" }}>AEGIS_DEMO_MODE=true|false</code>, or change models with
            <code className="font-mono" style={{ color: "var(--accent)" }}> AEGIS_LLM_MODEL</code> / <code className="font-mono" style={{ color: "var(--accent)" }}>AEGIS_EMBED_MODEL</code>, then restart the backend.
          </p>
        </div>

        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Boxes size={14} style={{ color: "var(--brand)" }} />
            <span className="label-eyebrow">Local Stack</span>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {STACK.map((s) => (
              <div key={s.name} className="panel-soft p-3 text-center">
                <div className="grid place-items-center w-10 h-10 rounded-lg mx-auto mb-2" style={{ background: "var(--bg-2)" }}>
                  <s.icon size={18} style={{ color: "var(--brand)" }} />
                </div>
                <div className="text-[12px] font-semibold">{s.name}</div>
                <div className="text-[9.5px] mt-0.5" style={{ color: "var(--text-faint)" }}>{s.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Row({ icon: Icon, label, value, ok, tone }: {
  icon: React.ElementType; label: string; value: string; ok: boolean; tone?: "amber" | "ok";
}) {
  const color = tone === "amber" ? "var(--accent)" : ok ? "var(--risk-low)" : "var(--risk-high)";
  return (
    <div className="panel-soft px-3 py-2.5 flex items-center gap-3">
      <Icon size={15} style={{ color }} />
      <span className="text-[12px]" style={{ color: "var(--text-dim)" }}>{label}</span>
      <span className="ml-auto text-[12px] font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

function Guarantee({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-dim)" }}>
      <CheckCircle2 size={14} style={{ color: "var(--risk-low)" }} /> {text}
    </div>
  );
}
