"""Base specialist agent: retrieve evidence, reason, emit structured findings."""
from __future__ import annotations

from app.agents.personas import Persona
from app.core.llm import generate_json
from app.core.models import (
    AgentReport,
    ChangeRequest,
    EvidenceRef,
    Finding,
    RiskLevel,
)
from app.tools.evidence_retriever import EvidenceRetriever, RetrievedEvidence

_FINDING_SCHEMA = """{
  "summary": "one-sentence overall assessment",
  "findings": [
    {
      "risk_level": "Low|Medium|High|Critical",
      "confidence": 0.0-1.0,
      "finding": "what you found",
      "impact": "the consequence",
      "recommendation": "what must be done",
      "evidence": ["relative/path/to/file.md"]
    }
  ]
}"""

_LEVELS = {l.value: l for l in RiskLevel}


def _gather_evidence(persona: Persona, retriever: EvidenceRetriever) -> list[RetrievedEvidence]:
    seen: dict[str, RetrievedEvidence] = {}
    for q in persona.queries:
        for ev in retriever.query(q, categories=persona.retrieval_focus or None):
            key = f"{ev.source}:{ev.text[:40]}"
            if key not in seen or ev.score > seen[key].score:
                seen[key] = ev
    # Highest-scoring evidence first; cap to keep the prompt small for local models.
    return sorted(seen.values(), key=lambda e: e.score, reverse=True)[:8]


def _format_evidence(evidence: list[RetrievedEvidence]) -> str:
    blocks = []
    for ev in evidence:
        blocks.append(f"--- FILE: {ev.source} (category: {ev.category}) ---\n{ev.text}")
    return "\n\n".join(blocks)


def run_specialist(
    persona: Persona, change: ChangeRequest, retriever: EvidenceRetriever
) -> AgentReport:
    """Independent review: each agent reasons over its own retrieved evidence."""
    evidence = _gather_evidence(persona, retriever)
    evidence_text = _format_evidence(evidence)

    prompt = (
        f"PROPOSED CHANGE\nTitle: {change.title}\nType: {change.change_type}\n"
        f"Environment: {change.environment}\nDescription: {change.description}\n\n"
        f"LOCAL EVIDENCE (only use what is shown here):\n{evidence_text}\n\n"
        f"As the {persona.name}, review ONLY risks within your specialty. "
        f"Produce 1-3 concrete findings grounded in the evidence above. "
        f"Every finding MUST reference at least one evidence file path."
    )

    data = generate_json(persona.system, prompt, _FINDING_SCHEMA)
    if isinstance(data, list):
        data = {"summary": "", "findings": data}

    findings: list[Finding] = []
    for raw in data.get("findings", []):
        level = _LEVELS.get(str(raw.get("risk_level", "Medium")).title(), RiskLevel.MEDIUM)
        try:
            conf = float(raw.get("confidence", 0.6))
        except (TypeError, ValueError):
            conf = 0.6
        findings.append(
            Finding(
                agent=persona.name,
                risk_level=level,
                confidence=min(max(conf, 0.0), 1.0),
                finding=str(raw.get("finding", "")).strip() or "(no finding text)",
                impact=str(raw.get("impact", "")).strip(),
                recommendation=str(raw.get("recommendation", "")).strip(),
                evidence=[str(e) for e in raw.get("evidence", []) if e],
                category=persona.scoring_category,
            )
        )

    highest = max((f.risk_level for f in findings), key=lambda l: list(RiskLevel).index(l), default=RiskLevel.LOW)
    avg_conf = round(sum(f.confidence for f in findings) / len(findings), 2) if findings else 0.0

    return AgentReport(
        agent=persona.name,
        role=persona.role,
        summary=str(data.get("summary", "")).strip(),
        findings=findings,
        evidence_used=[EvidenceRef(source=e.source, excerpt=e.text[:200], score=e.score) for e in evidence],
        highest_severity=highest,
        confidence=avg_conf,
    )
