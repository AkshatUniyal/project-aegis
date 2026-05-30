"""Executive Synthesizer Agent — produces the leadership-ready memo."""
from __future__ import annotations

from app.core.llm import generate_json
from app.core.models import (
    AgentReport,
    ChangeRequest,
    Decision,
    EvidenceRef,
    ExecutiveMemo,
    RiskScore,
)

_SYSTEM = (
    "You are the Executive Synthesizer for a change-review board, writing for a CIO/CTO. "
    "You are decision-oriented and concise. You do not hedge. You translate the board's "
    "findings and risk score into a clear recommendation a CTO could forward before a "
    "change-review meeting. Ground every claim in the findings provided."
)

_MEMO_SCHEMA = """{
  "primary_reason": "the single most important reason for the recommendation",
  "summary": "2-3 sentence leadership summary",
  "top_risks": ["risk 1", "risk 2", "risk 3"],
  "required_actions": ["action 1", "action 2"],
  "open_questions": ["question 1"]
}"""


def synthesize_memo(
    change: ChangeRequest,
    reports: list[AgentReport],
    score: RiskScore,
    resolution: str,
) -> ExecutiveMemo:
    findings_digest = "\n".join(
        f"{r.agent} [{f.risk_level.value}, conf {f.confidence}]: {f.finding} → {f.recommendation}"
        for r in reports
        for f in r.findings
    )
    prompt = (
        f"CHANGE: {change.title} ({change.change_type}, {change.environment})\n\n"
        f"RISK SCORE: {score.overall}/100 — Decision leaning: {score.decision.value}\n"
        f"TOP BLOCKERS:\n" + "\n".join(f"- {b}" for b in score.top_blockers) + "\n\n"
        f"BOARD FINDINGS:\n{findings_digest}\n\n"
        f"BOARD RESOLUTION: {resolution}\n\n"
        "Write the executive memo content."
    )
    data = generate_json(_SYSTEM, prompt, _MEMO_SCHEMA)

    # Evidence table = de-duplicated evidence across all agents, best score first.
    seen: dict[str, EvidenceRef] = {}
    for r in reports:
        for ev in r.evidence_used:
            if ev.source not in seen or ev.score > seen[ev.source].score:
                seen[ev.source] = ev
    evidence_table = sorted(seen.values(), key=lambda e: e.score, reverse=True)[:10]

    return ExecutiveMemo(
        change_title=change.title,
        decision=score.decision,
        overall_risk=score.overall,
        confidence=score.confidence,
        primary_reason=str(data.get("primary_reason", "")).strip(),
        summary=str(data.get("summary", "")).strip(),
        top_risks=[str(x) for x in data.get("top_risks", [])][:6],
        required_actions=[str(x) for x in data.get("required_actions", [])][:8],
        open_questions=[str(x) for x in data.get("open_questions", [])][:6],
        evidence_table=evidence_table,
    )
