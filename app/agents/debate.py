"""Cross-agent debate: surface genuine disagreement and escalation.

After independent review, agents see each other's top findings and react. We
generate a structured timeline that the UI renders as the 'war room' debate.
"""
from __future__ import annotations

from app.core.llm import generate_json
from app.core.models import AgentReport, DebatePoint, RiskLevel

_LEVELS = {l.value: l for l in RiskLevel}

_DEBATE_SCHEMA = """{
  "debate": [
    {"agent": "Agent Name", "statement": "their point",
     "challenges": "which other agent/claim this pushes against or null",
     "stance": "concern|rebuttal|agreement|escalation",
     "severity": "Low|Medium|High|Critical"}
  ],
  "final_resolution": "one-paragraph consensus on whether to proceed"
}"""

_SYSTEM = (
    "You are the facilitator of a technical change-review board. You are given the "
    "independent findings of several specialist agents. Produce a realistic, concise "
    "cross-agent debate where agents reference and challenge each other's specific "
    "findings. Highlight genuine disagreement and where reviewers escalate concern. "
    "Do not invent findings that were not raised. Keep each statement to one sentence."
)


def _digest_reports(reports: list[AgentReport]) -> str:
    lines = []
    for r in reports:
        for f in r.findings:
            lines.append(f"{r.agent} [{f.risk_level.value}]: {f.finding} (impact: {f.impact})")
    return "\n".join(lines)


def run_debate(reports: list[AgentReport]) -> tuple[list[DebatePoint], str]:
    prompt = (
        f"INDEPENDENT FINDINGS FROM THE REVIEW BOARD:\n{_digest_reports(reports)}\n\n"
        "Generate the cross-agent debate. Agents should reference each other by name "
        "and push on the highest-severity items (rollback, data integrity, business impact)."
    )
    data = generate_json(_SYSTEM, prompt, _DEBATE_SCHEMA)
    if isinstance(data, list):
        data = {"debate": data, "final_resolution": ""}

    points: list[DebatePoint] = []
    for raw in data.get("debate", []):
        points.append(
            DebatePoint(
                agent=str(raw.get("agent", "Agent")).strip(),
                statement=str(raw.get("statement", "")).strip(),
                challenges=(str(raw["challenges"]).strip() if raw.get("challenges") else None),
                stance=str(raw.get("stance", "concern")).strip().lower(),
                severity=_LEVELS.get(str(raw.get("severity", "Medium")).title(), RiskLevel.MEDIUM),
            )
        )
    return points, str(data.get("final_resolution", "")).strip()
