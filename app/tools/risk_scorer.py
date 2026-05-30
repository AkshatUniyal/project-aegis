"""Transparent, weighted risk scoring for AEGIS.

The score is a decision aid, not an automatic gate. Every category score is
explainable and traces back to agent findings. Weights follow the scope model.
"""
from __future__ import annotations

from app.core.models import (
    AgentReport,
    CategoryScore,
    Decision,
    Finding,
    RiskLevel,
    RiskScore,
)

# Category definitions: weight + the agent categories that feed each one.
CATEGORIES: list[dict] = [
    {"key": "technical_complexity", "label": "Technical Complexity", "weight": 0.20},
    {"key": "operational_readiness", "label": "Operational Readiness", "weight": 0.20},
    {"key": "rollback_confidence", "label": "Rollback Confidence", "weight": 0.20},
    {"key": "security_compliance", "label": "Security / Compliance", "weight": 0.15},
    {"key": "business_blast_radius", "label": "Business Blast Radius", "weight": 0.15},
    {"key": "evidence_completeness", "label": "Evidence Completeness", "weight": 0.10},
]

# Risk level → base risk contribution (0-100).
LEVEL_RISK = {
    RiskLevel.LOW: 20.0,
    RiskLevel.MEDIUM: 50.0,
    RiskLevel.HIGH: 78.0,
    RiskLevel.CRITICAL: 95.0,
}


def _severity_from_score(score: float) -> RiskLevel:
    if score >= 85:
        return RiskLevel.CRITICAL
    if score >= 65:
        return RiskLevel.HIGH
    if score >= 40:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def _decision_from_overall(overall: float, critical_count: int) -> Decision:
    """Map the overall score to a decision.

    The headline number and the verdict must stay coherent. A single Critical
    finding escalates one band (small local models over-use 'Critical'); two or
    more, or a high overall, forces a hard No-Go.
    """
    if critical_count >= 2 or overall >= 85:
        return Decision.NO_GO
    if overall >= 70 or critical_count == 1:
        # High risk but resolvable gaps → conditional, matching the demo outcome.
        return Decision.CONDITIONAL_GO
    if overall >= 50:
        return Decision.DELAY
    return Decision.GO


def _category_score(findings: list[Finding]) -> tuple[float, str]:
    """Weighted-by-confidence average of finding risk for one category."""
    if not findings:
        return 25.0, "No findings in this category; treated as low residual risk."
    total_w = sum(max(f.confidence, 0.1) for f in findings)
    score = sum(LEVEL_RISK[f.risk_level] * max(f.confidence, 0.1) for f in findings) / total_w
    top = max(findings, key=lambda f: LEVEL_RISK[f.risk_level] * f.confidence)
    rationale = f"{len(findings)} finding(s); driven by: {top.finding[:120]}"
    return round(score, 1), rationale


def score_reports(reports: list[AgentReport]) -> RiskScore:
    """Combine all agent findings into category scores and an overall decision."""
    by_category: dict[str, list[Finding]] = {c["key"]: [] for c in CATEGORIES}
    all_findings: list[Finding] = []
    for report in reports:
        for f in report.findings:
            all_findings.append(f)
            key = f.category if f.category in by_category else "technical_complexity"
            by_category[key].append(f)

    # Evidence completeness is inverse to how many findings cite no evidence.
    cited = sum(1 for f in all_findings if f.evidence)
    completeness = round(100 * cited / len(all_findings), 1) if all_findings else 0.0
    # Higher completeness = LOWER risk in that category.
    by_category["evidence_completeness"] = []  # computed separately below

    category_scores: list[CategoryScore] = []
    overall = 0.0
    for c in CATEGORIES:
        if c["key"] == "evidence_completeness":
            score = round(100 - completeness, 1)
            rationale = f"{cited}/{len(all_findings)} findings are evidence-backed."
        else:
            score, rationale = _category_score(by_category[c["key"]])
        overall += score * c["weight"]
        category_scores.append(
            CategoryScore(
                category=c["key"],
                label=c["label"],
                weight=c["weight"],
                score=score,
                severity=_severity_from_score(score),
                rationale=rationale,
            )
        )

    overall = round(overall, 0)
    critical_count = sum(1 for f in all_findings if f.risk_level == RiskLevel.CRITICAL)
    decision = _decision_from_overall(overall, critical_count)

    # Top blockers: highest-risk findings, weighted by confidence.
    ranked = sorted(
        all_findings,
        key=lambda f: LEVEL_RISK[f.risk_level] * f.confidence,
        reverse=True,
    )
    top_blockers = [f"{f.agent}: {f.finding}" for f in ranked[:5]]

    avg_conf = round(sum(f.confidence for f in all_findings) / len(all_findings), 2) if all_findings else 0.0

    return RiskScore(
        overall=overall,
        decision=decision,
        confidence=avg_conf,
        categories=category_scores,
        evidence_completeness=completeness,
        top_blockers=top_blockers,
    )
