import Link from "next/link";
import Shell from "@/components/Shell";
import AgentOrbit from "@/components/AgentOrbit";
import {
  Play, FlaskConical, FolderClock, ShieldCheck, Lock, Eye, Server,
  Zap, GitBranch, FileSearch, CheckCircle2,
} from "lucide-react";

const PROMISE = [
  { icon: Lock, title: "100% Local", body: "No external LLM calls. Evidence never leaves the machine." },
  { icon: ShieldCheck, title: "Multi-Agent", body: "Six specialists review and challenge each change." },
  { icon: Eye, title: "Evidence-Driven", body: "Every finding is traceable to a local source file." },
  { icon: Server, title: "Audit-Ready", body: "Each review is persisted with a full reasoning trail." },
];

const HOOKS = [
  { icon: Zap, text: "Catch critical risks early, before production impact." },
  { icon: GitBranch, text: "Reduce incidents and rollbacks with structured pre-checks." },
  { icon: Lock, text: "Protect customers and reputation by keeping data local." },
  { icon: FileSearch, text: "Turn change reviews into evidence, not opinion." },
];

export default function HomePage() {
  return (
    <Shell>
      <div className="max-w-[1280px] mx-auto w-full py-2">
        {/* hero band: title + orbit on the left, value panels on the right */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-10 items-center xl:min-h-[560px]">
          {/* left: brand hero with orbit */}
          <div className="flex flex-col items-center text-center">
            <div className="chip chip-low mb-5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-ring" style={{ background: "var(--risk-low)" }} />
              100% Local · No Cloud Calls
            </div>
            <h1 className="text-[60px] font-bold leading-none"
                style={{ background: "linear-gradient(90deg,#ffffff,#9fe9f5)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              AEGIS
            </h1>
            <p className="text-[17px] mt-3" style={{ color: "var(--text-dim)" }}>
              Local Multi-Agent Change Risk War Room
            </p>
            <p className="text-[13px] mt-1.5 italic" style={{ color: "var(--text-faint)" }}>
              Stress-test technology changes before they reach production.
            </p>
            <div className="mt-2">
              <AgentOrbit size={420} />
            </div>
          </div>

          {/* right: value panels */}
          <div className="flex flex-col gap-5">
            <div className="panel p-5">
              <div className="label-eyebrow mb-4">Product Promise</div>
              <div className="grid grid-cols-2 gap-4">
                {PROMISE.map((p) => (
                  <div key={p.title} className="flex gap-3">
                    <div className="grid place-items-center w-9 h-9 rounded-lg panel-soft shrink-0">
                      <p.icon size={16} style={{ color: "var(--brand)" }} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold">{p.title}</div>
                      <div className="text-[11px] leading-snug mt-0.5" style={{ color: "var(--text-faint)" }}>{p.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-5">
              <div className="label-eyebrow mb-4" style={{ color: "var(--accent)" }}>Executive Hook</div>
              <div className="space-y-3">
                {HOOKS.map((h, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                    <span className="text-[12.5px] leading-snug" style={{ color: "var(--text-dim)" }}>{h.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t hairline text-[12px] italic"
                   style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                &ldquo;What if every production change had a local AI risk council before it went live?&rdquo;
              </div>
            </div>
          </div>
        </div>

        {/* primary actions — full width band */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
          <ActionCard href="/new-review" icon={Play} title="Start New Review"
            body="Submit a proposed change for review" primary />
          <ActionCard href="/war-room" icon={FlaskConical} title="Open Demo Scenario"
            body="MySQL 5.7 → 8.0 production upgrade" />
          <ActionCard href="/history" icon={FolderClock} title="View Past Reviews"
            body="Local audit trail & history" />
        </div>
      </div>
    </Shell>
  );
}

function ActionCard({ href, icon: Icon, title, body, primary }: {
  href: string; icon: React.ElementType; title: string; body: string; primary?: boolean;
}) {
  return (
    <Link href={href}
      className={`panel p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5 ${primary ? "glow-brand" : ""}`}
      style={primary ? { borderColor: "rgba(34,211,238,.4)" } : undefined}>
      <div className="grid place-items-center w-10 h-10 rounded-lg panel-soft shrink-0">
        <Icon size={18} style={{ color: primary ? "var(--brand)" : "var(--text-dim)" }} />
      </div>
      <div>
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>{body}</div>
      </div>
    </Link>
  );
}
