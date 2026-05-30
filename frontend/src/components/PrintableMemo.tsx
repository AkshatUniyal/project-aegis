import type { ExecutiveMemo } from "@/lib/types";

/**
 * Clean, black-on-white rendering of the executive memo for PDF export.
 * Hidden on screen; revealed only during print via the #printable isolation
 * rule in globals.css. Looks like a document a CTO could forward.
 */
export default function PrintableMemo({ m }: { m: ExecutiveMemo }) {
  const S: React.CSSProperties = { color: "#111", fontFamily: "Georgia, 'Times New Roman', serif" };
  const h2: React.CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#444", marginTop: 22, marginBottom: 8, borderBottom: "1px solid #ccc", paddingBottom: 4 };
  const decisionColor = m.decision === "No-Go" ? "#b91c1c" : m.decision === "Go" ? "#15803d" : "#b45309";

  return (
    <div id="printable" className="print-only" style={{ ...S, padding: 8, fontSize: 12, lineHeight: 1.5 }}>
      <div style={{ borderBottom: "2px solid #111", paddingBottom: 10, marginBottom: 4 }}>
        <div style={{ fontSize: 11, letterSpacing: ".18em", color: "#666" }}>AEGIS · CHANGE RISK REVIEW</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0" }}>{m.change_title}</h1>
        <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>Local Multi-Agent AI Change Risk War Room · Confidential</div>
      </div>

      <div style={{ display: "flex", gap: 28, marginTop: 14 }}>
        <div><div style={{ fontSize: 10, color: "#666" }}>RECOMMENDATION</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: decisionColor }}>{m.decision === "No-Go" ? "No-Go" : "Conditional No-Go"}</div></div>
        <div><div style={{ fontSize: 10, color: "#666" }}>OVERALL RISK</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{m.overall_risk} / 100</div></div>
        <div><div style={{ fontSize: 10, color: "#666" }}>CONFIDENCE</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(m.confidence * 100)}%</div></div>
      </div>

      <h2 style={h2}>Primary Reason</h2>
      <p style={{ margin: 0 }}>{m.primary_reason}</p>

      <h2 style={h2}>Leadership Summary</h2>
      <p style={{ margin: 0 }}>{m.summary}</p>

      <h2 style={h2}>Top Risks</h2>
      <ul style={{ margin: 0, paddingLeft: 18 }}>{m.top_risks.map((r, i) => <li key={i}>{r}</li>)}</ul>

      <h2 style={h2}>Required Actions Before Approval</h2>
      <ol style={{ margin: 0, paddingLeft: 18 }}>{m.required_actions.map((a, i) => <li key={i} style={{ marginBottom: 2 }}>{a}</li>)}</ol>

      {m.open_questions.length > 0 && (<>
        <h2 style={h2}>Open Questions</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>{m.open_questions.map((qn, i) => <li key={i}>{qn}</li>)}</ul>
      </>)}

      <h2 style={h2}>Evidence</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead><tr style={{ textAlign: "left", color: "#666" }}>
          <th style={{ borderBottom: "1px solid #ccc", padding: "4px 0" }}>Source File</th>
          <th style={{ borderBottom: "1px solid #ccc", padding: "4px 0" }}>Excerpt</th>
        </tr></thead>
        <tbody>{m.evidence_table.map((e, i) => (
          <tr key={i}><td style={{ borderBottom: "1px solid #eee", padding: "4px 8px 4px 0", fontFamily: "monospace" }}>{e.source}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: "4px 0", color: "#444" }}>{e.excerpt}</td></tr>
        ))}</tbody>
      </table>

      <div style={{ marginTop: 24, fontSize: 10, color: "#888", borderTop: "1px solid #ccc", paddingTop: 8 }}>
        Generated locally by AEGIS. No data left this device. This recommendation is a decision aid, not an automated approval.
      </div>
    </div>
  );
}
