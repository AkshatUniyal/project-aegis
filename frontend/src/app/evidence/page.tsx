"use client";

import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { SevChip, sevColor } from "@/components/ui";
import { LiveBadge } from "@/components/LiveBadge";
import { CATEGORIES, SEVERITIES, ENRICHMENT, CATEGORY_LABEL, type EvidenceItem } from "@/lib/evidence";
import { listEvidence, getEvidenceContent } from "@/lib/api";
import { Search, Filter, Lock, FileText, Sparkles, Loader2 } from "lucide-react";

interface Row {
  file: string;
  category: EvidenceItem["category"];
  usedBy: string;
  severity: EvidenceItem["severity"];
  score: number;
  impact?: string;
  phrases: string[];
}

export default function EvidencePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [live, setLive] = useState(false);
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [sevs, setSevs] = useState<Set<string>>(new Set());
  const [minScore, setMinScore] = useState(0);
  const [selected, setSelected] = useState<Row | null>(null);
  const [content, setContent] = useState<string[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  // Load the live indexed file list, enriched with curated metadata.
  useEffect(() => {
    listEvidence().then((res) => {
      let built: Row[];
      if (res?.files?.length) {
        setLive(true);
        built = res.files.map((f) => {
          const en = ENRICHMENT[f.file];
          return {
            file: f.file,
            category: CATEGORY_LABEL[f.category] ?? "Architecture",
            usedBy: en?.usedBy ?? "—",
            severity: en?.severity ?? "Low",
            score: en?.score ?? 0,
            impact: en?.impact,
            phrases: en?.phrases ?? [],
          };
        });
      } else {
        // backend offline → fall back to curated evidence only
        built = Object.entries(ENRICHMENT).map(([file, en]) => ({
          file, category: "Change Plan", usedBy: en.usedBy, severity: en.severity,
          score: en.score, impact: en.impact, phrases: en.phrases,
        }));
      }
      built.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
      setRows(built);
      if (built[0]) select(built[0]);
    });
  }, []);

  async function select(r: Row) {
    setSelected(r);
    setLoadingContent(true);
    const res = await getEvidenceContent(r.file);
    setContent(res?.content ? res.content.split("\n") : ["(content unavailable — backend offline)"]);
    setLoadingContent(false);
  }

  const results = useMemo(() => rows.filter((e) =>
    (q === "" || e.file.toLowerCase().includes(q.toLowerCase()) || e.usedBy.toLowerCase().includes(q.toLowerCase())) &&
    (cats.size === 0 || cats.has(e.category)) &&
    (sevs.size === 0 || sevs.has(e.severity)) &&
    e.score * 100 >= minScore
  ), [rows, q, cats, sevs, minScore]);

  const toggle = (set: Set<string>, v: string, fn: (s: Set<string>) => void) => {
    const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); fn(n);
  };

  const isHot = (line: string) =>
    !!selected?.phrases.some((p) => p && line.toLowerCase().includes(p.toLowerCase()));

  return (
    <Shell>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-[22px] font-bold">Evidence Explorer</h1>
            <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>Inspect the local evidence behind the recommendation.</p>
          </div>
          <LiveBadge live={live} />
        </div>
        <span className="chip chip-low"><Lock size={12} /> All evidence stays on this device</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] xl:grid-cols-[230px_1fr_330px] gap-5">
        {/* filters */}
        <div className="panel p-4 h-fit">
          <div className="flex items-center gap-2 mb-3"><Filter size={13} style={{ color: "var(--brand)" }} /><span className="label-eyebrow">Filter Evidence</span></div>
          <div className="relative mb-4">
            <Search size={13} className="absolute left-2.5 top-2.5" style={{ color: "var(--text-faint)" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…"
              className="w-full bg-[var(--bg-2)] border rounded-lg pl-8 pr-3 py-2 text-[12px] outline-none focus:border-[var(--brand)]"
              style={{ borderColor: "var(--border)" }} />
          </div>

          <div className="label-eyebrow mb-2">Category</div>
          <div className="space-y-1.5 mb-4">
            {CATEGORIES.map((c) => (
              <label key={c} className="flex items-center gap-2 text-[11.5px] cursor-pointer" style={{ color: "var(--text-dim)" }}>
                <input type="checkbox" checked={cats.has(c)} onChange={() => toggle(cats, c, setCats)} className="accent-[var(--brand)]" />{c}
              </label>
            ))}
          </div>

          <div className="label-eyebrow mb-2">Severity</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {SEVERITIES.map((s) => (
              <button key={s} onClick={() => toggle(sevs, s, setSevs)} className="chip cursor-pointer"
                style={sevs.has(s) ? { color: sevColor[s], borderColor: sevColor[s] } : { color: "var(--text-faint)", borderColor: "var(--border)" }}>{s}</button>
            ))}
          </div>

          <div className="label-eyebrow mb-2">Min Relevance · {minScore}%</div>
          <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </div>

        {/* results */}
        <div className="panel p-3">
          <div className="flex items-center justify-between px-1 pb-2 mb-1 border-b hairline" style={{ borderColor: "var(--border)" }}>
            <span className="label-eyebrow">Evidence Results</span>
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{results.length} files</span>
          </div>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {results.map((e) => {
              const active = e.file === selected?.file;
              return (
                <button key={e.file} onClick={() => select(e)}
                  className="w-full text-left panel-soft px-3 py-2.5 flex items-center gap-3 transition-colors"
                  style={active ? { boxShadow: `inset 3px 0 0 ${sevColor[e.severity]}`, borderColor: sevColor[e.severity] + "66" } : undefined}>
                  <FileText size={14} style={{ color: active ? sevColor[e.severity] : "var(--text-faint)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate">{e.file}</div>
                    <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>{e.category}{e.usedBy !== "—" ? ` · used by ${e.usedBy}` : ""}</div>
                  </div>
                  {e.usedBy !== "—" && <SevChip level={e.severity} />}
                  <span className="text-[11px] font-mono w-9 text-right" style={{ color: "var(--brand)" }}>{e.score ? e.score.toFixed(2) : "—"}</span>
                </button>
              );
            })}
            {results.length === 0 && <div className="text-center text-[12px] py-8" style={{ color: "var(--text-faint)" }}>No evidence matches the filters.</div>}
          </div>
        </div>

        {/* preview */}
        <div className="flex flex-col gap-3">
          <div className="panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} style={{ color: "var(--brand)" }} />
              <span className="text-[12.5px] font-semibold truncate">{selected?.file ?? "—"}</span>
              {selected && selected.usedBy !== "—" && <span className="ml-auto"><SevChip level={selected.severity} /></span>}
            </div>
            <div className="label-eyebrow mb-2">{live ? "Local File Content" : "Highlighted Source"}</div>
            <div className="rounded-lg overflow-hidden border hairline font-mono text-[11px] max-h-[44vh] overflow-y-auto" style={{ borderColor: "var(--border)" }}>
              {loadingContent ? (
                <div className="flex items-center gap-2 px-3 py-4" style={{ color: "var(--text-faint)" }}><Loader2 size={13} className="animate-spin" /> loading…</div>
              ) : content.map((line, i) => {
                const hot = isHot(line);
                const color = selected ? sevColor[selected.severity] : "var(--brand)";
                return (
                  <div key={i} className="flex" style={hot ? { background: `${color}1a`, boxShadow: `inset 2px 0 0 ${color}` } : undefined}>
                    <span className="px-2 py-1 select-none" style={{ color: "var(--text-faint)", minWidth: 30, textAlign: "right" }}>{i + 1}</span>
                    <span className="px-2 py-1 flex-1 whitespace-pre-wrap" style={{ color: hot ? "var(--text)" : "var(--text-dim)" }}>{line || " "}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {selected?.impact && (
            <div className="panel p-4" style={{ boxShadow: "inset 3px 0 0 var(--accent)" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={13} style={{ color: "var(--accent)" }} />
                <span className="label-eyebrow" style={{ color: "var(--accent)" }}>Evidence Impact</span>
              </div>
              <p className="text-[11.5px] leading-snug" style={{ color: "var(--text-dim)" }}>{selected.impact}</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
