"""Curated golden run for the MySQL 5.7→8.0 scenario.

Demo mode replays this deterministic sequence so executive demos never depend on
live local-model variance. The event shapes are identical to run_review_events,
so the UI cannot tell the difference.
"""
from __future__ import annotations

import time
from collections.abc import Iterator

# Specialist findings (concise, evidence-cited) tuned to land at 78 / Conditional No-Go.
_AGENTS = [
    {
        "name": "Architecture Agent", "role": "Dependencies & topology", "highest": "Medium", "conf": 0.74,
        "findings": [{
            "risk_level": "Medium", "confidence": 0.74,
            "finding": "Single primary db-prod-01 means a failed upgrade is a full checkout outage.",
            "impact": "No write path during failure.", "recommendation": "Confirm replica promotion path.",
            "evidence": ["architecture/system-map.md"]}],
    },
    {
        "name": "Database Agent", "role": "Migration & schema", "highest": "Critical", "conf": 0.86,
        "findings": [{
            "risk_level": "Critical", "confidence": 0.9,
            "finding": "order_reconcile relies on implicit GROUP BY ordering removed in MySQL 8.0.",
            "impact": "Nightly settlement fails or returns wrong rows.",
            "recommendation": "Rewrite with explicit GROUP BY and test.",
            "evidence": ["changes/order_reconcile.sql", "architecture/database-dependencies.md"]}],
    },
    {
        "name": "SRE Agent", "role": "Operational readiness", "highest": "Critical", "conf": 0.92,
        "findings": [{
            "risk_level": "Critical", "confidence": 1.0,
            "finding": "Snapshot restore has never been tested against db-prod-01.",
            "impact": "Rollback may fail when most needed.",
            "recommendation": "Run a timed restore rehearsal in staging.",
            "evidence": ["changes/rollback-plan.md", "policies/rollback-policy.md"]}],
    },
    {
        "name": "Security Agent", "role": "Data & compliance", "highest": "Medium", "conf": 0.7,
        "findings": [{
            "risk_level": "Medium", "confidence": 0.7,
            "finding": "DB credentials stored in plaintext in committed config.php.",
            "impact": "Credential exposure risk during change.", "recommendation": "Move secrets to a vault.",
            "evidence": ["policies/security-review-policy.md"]}],
    },
    {
        "name": "Business Impact Agent", "role": "Customer & revenue", "highest": "High", "conf": 0.78,
        "findings": [{
            "risk_level": "High", "confidence": 0.78,
            "finding": "A failed settlement leaves leadership revenue reports silently stale.",
            "impact": "Wrong revenue numbers; checkout at risk.",
            "recommendation": "Add post-deploy revenue reconciliation.",
            "evidence": ["incidents/incident-reporting-delay.md", "architecture/reporting-service.md"]}],
    },
    {
        "name": "Red-Team Agent", "role": "Adversarial challenge", "highest": "High", "conf": 0.83,
        "findings": [{
            "risk_level": "High", "confidence": 0.83,
            "finding": "Auth-plugin fix is still a TODO despite a prior staging outage on the exact issue.",
            "impact": "Repeat of total connection outage seen in staging.",
            "recommendation": "Block approval until auth plugin is confirmed.",
            "evidence": ["incidents/incident-login-failure.md", "changes/mysql-8-upgrade-plan.md"]}],
    },
]

_DEBATE = [
    {"agent": "SRE Agent", "statement": "Rollback instructions exist, but restore validation is completely missing.", "challenges": None, "stance": "concern", "severity": "Critical"},
    {"agent": "Database Agent", "statement": "The migration touches order tables and the finance reconciliation job directly.", "challenges": "SRE Agent", "stance": "escalation", "severity": "High"},
    {"agent": "Business Impact Agent", "statement": "Then checkout and nightly reconciliation are both exposed — revenue and customer impact.", "challenges": "Database Agent", "stance": "escalation", "severity": "High"},
    {"agent": "Security Agent", "statement": "Reverting to mysql_native_password weakens auth; it must be risk-accepted.", "challenges": None, "stance": "concern", "severity": "Medium"},
    {"agent": "Architecture Agent", "statement": "Agreed — single-primary topology means there is no graceful degradation here.", "challenges": "SRE Agent", "stance": "agreement", "severity": "Medium"},
    {"agent": "Red-Team Agent", "statement": "This should not be approved until restore testing is proven and the auth plugin is confirmed.", "challenges": "everyone", "stance": "escalation", "severity": "Critical"},
]

_RESOLUTION = (
    "The board converges on Conditional No-Go: the change can proceed only after a tested restore, "
    "a named rollback owner, stored-procedure validation, and settlement-failure alerting are in place."
)


def _build_report(a: dict) -> dict:
    findings = [{**f, "agent": a["name"], "category": "technical_complexity"} for f in a["findings"]]
    return {
        "agent": a["name"], "role": a["role"], "summary": "",
        "findings": findings, "evidence_used": [],
        "highest_severity": a["highest"], "confidence": a["conf"],
    }


def golden_events(delay: float = 0.0) -> Iterator[dict]:
    """Yield the golden run with the same event protocol as a live run."""
    names = [a["name"] for a in _AGENTS]
    yield {"event": "supervisor", "selected": names}
    reports = []
    for a in _AGENTS:
        yield {"event": "agent_start", "agent": a["name"], "role": a["role"]}
        if delay:
            time.sleep(delay)
        rep = _build_report(a)
        reports.append(rep)
        yield {"event": "agent_done", "agent": a["name"], "highest_severity": a["highest"],
               "confidence": a["conf"], "findings_count": len(a["findings"]), "report": rep}

    yield {"event": "debate_start"}
    if delay:
        time.sleep(delay)
    yield {"event": "debate", "points": _DEBATE, "resolution": _RESOLUTION}

    score = {
        "overall": 78, "decision": "Conditional Go", "confidence": 0.84, "evidence_completeness": 71,
        "categories": [
            {"category": "technical_complexity", "label": "Technical Complexity", "weight": 0.2, "score": 82, "severity": "High", "rationale": "order_reconcile breaks under ONLY_FULL_GROUP_BY."},
            {"category": "operational_readiness", "label": "Operational Readiness", "weight": 0.2, "score": 80, "severity": "High", "rationale": "No alerting on settlement-job failure."},
            {"category": "rollback_confidence", "label": "Rollback Confidence", "weight": 0.2, "score": 90, "severity": "Critical", "rationale": "Restore never tested; no owner; policy violated."},
            {"category": "security_compliance", "label": "Security / Compliance", "weight": 0.15, "score": 52, "severity": "Medium", "rationale": "Plaintext DB credentials in config.php."},
            {"category": "business_blast_radius", "label": "Business Blast Radius", "weight": 0.15, "score": 76, "severity": "High", "rationale": "Checkout + revenue reconciliation at risk."},
            {"category": "evidence_completeness", "label": "Evidence Completeness", "weight": 0.1, "score": 29, "severity": "Low", "rationale": "Most findings evidence-backed; restore-test report missing."},
        ],
        "top_blockers": [
            "SRE Agent: Snapshot restore procedure has never been tested against db-prod-01.",
            "Database Agent: order_reconcile fails under MySQL 8.0 ONLY_FULL_GROUP_BY.",
            "SRE Agent: No alerting on nightly settlement-job failure.",
            "Business Impact Agent: Checkout and revenue reconciliation may both be affected.",
            "Security Agent: Plaintext DB credentials stored in committed config.php.",
        ],
    }
    yield {"event": "score", "score": score}

    memo = {
        "change_title": "Upgrade MySQL 5.7 → 8.0 (db-prod-01)", "decision": "Conditional Go",
        "overall_risk": 78, "confidence": 0.84,
        "primary_reason": "Rollback and restore validation are incomplete, and a known stored-procedure incompatibility threatens nightly revenue reconciliation.",
        "summary": "This change introduces significant risk to checkout availability and business operations. With four targeted pre-checks completed, residual risk drops to an acceptable level. Without them, this is a No-Go.",
        "top_risks": [
            "Untested rollback / restore path on a Tier-1 system.",
            "order_reconcile breaks under MySQL 8.0 ONLY_FULL_GROUP_BY.",
            "No alerting on nightly settlement-job failure.",
            "Auth-plugin change previously caused a full connection outage in staging.",
        ],
        "required_actions": [
            "Run a full, timed restore test in staging (within policy's 30-day window).",
            "Validate order_reconcile and sp_nightly_settlement against MySQL 8.0.",
            "Confirm mysql_native_password is enabled on the 8.0 instance.",
            "Assign a named rollback owner for the maintenance window.",
            "Add a post-deployment revenue-reconciliation validation step.",
        ],
        "open_questions": [
            "Has the snapshot ever been restored successfully end-to-end?",
            "What is the measured restore time vs. the 20-minute Tier-1 limit?",
        ],
        "evidence_table": [
            {"source": "changes/rollback-plan.md", "excerpt": "Restore procedure has never been tested…", "score": 0.77},
            {"source": "changes/order_reconcile.sql", "excerpt": "GROUP BY o.customer_id … ORDER BY NULL", "score": 0.74},
            {"source": "incidents/incident-reporting-delay.md", "excerpt": "settlement job failed silently…", "score": 0.72},
        ],
    }
    yield {"event": "memo", "memo": memo}
    yield {"event": "done", "result": {"reports": reports, "debate": _DEBATE, "resolution": _RESOLUTION, "score": score, "memo": memo}}
