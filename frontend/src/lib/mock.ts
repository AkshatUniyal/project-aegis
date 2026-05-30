// Mock review data mirroring a completed AEGIS run on the MySQL 5.7→8.0 scenario.
// Shapes match src/lib/types.ts and the backend Pydantic models, so swapping to
// the live API later is a drop-in replacement.

import type { AgentReport, DebatePoint, RiskScore, ExecutiveMemo } from "./types";

export const MOCK_SCORE: RiskScore = {
  overall: 78,
  decision: "Conditional Go",
  confidence: 0.84,
  evidence_completeness: 71,
  categories: [
    { category: "technical_complexity", label: "Technical Complexity", weight: 0.2, score: 82, severity: "High", rationale: "order_reconcile breaks under ONLY_FULL_GROUP_BY; mixed charset JOINs." },
    { category: "operational_readiness", label: "Operational Readiness", weight: 0.2, score: 80, severity: "High", rationale: "No alerting on settlement-job failure; readiness gaps on checklist." },
    { category: "rollback_confidence", label: "Rollback Confidence", weight: 0.2, score: 90, severity: "Critical", rationale: "Restore never tested; no rollback owner; policy violated." },
    { category: "security_compliance", label: "Security / Compliance", weight: 0.15, score: 52, severity: "Medium", rationale: "Plaintext DB credentials in committed config.php." },
    { category: "business_blast_radius", label: "Business Blast Radius", weight: 0.15, score: 76, severity: "High", rationale: "Checkout + nightly revenue reconciliation both at risk." },
    { category: "evidence_completeness", label: "Evidence Completeness", weight: 0.1, score: 29, severity: "Low", rationale: "Most findings are evidence-backed; restore-test report missing." },
  ],
  top_blockers: [
    "SRE Agent: Snapshot restore procedure has never been tested against db-prod-01.",
    "Database Agent: order_reconcile fails under MySQL 8.0 ONLY_FULL_GROUP_BY.",
    "SRE Agent: No alerting on nightly settlement-job failure.",
    "Business Impact Agent: Checkout and revenue reconciliation may both be affected.",
    "Security Agent: Plaintext DB credentials stored in committed config.php.",
  ],
};

export const MOCK_REPORTS: AgentReport[] = [
  {
    agent: "Architecture Agent", role: "Dependencies & topology", highest_severity: "Medium", confidence: 0.74,
    summary: "Single-primary topology concentrates upgrade risk; mixed charset coupling.",
    evidence_used: [], findings: [
      { agent: "Architecture Agent", risk_level: "Medium", confidence: 0.74, category: "technical_complexity",
        finding: "Single primary db-prod-01 means a failed upgrade is a full checkout outage.",
        impact: "No write path during failure.", recommendation: "Confirm replica promotion path.",
        evidence: ["architecture/system-map.md"] },
    ],
  },
  {
    agent: "Database Agent", role: "Migration & schema", highest_severity: "Critical", confidence: 0.86,
    summary: "Stored-procedure and charset incompatibilities are likely to break settlement.",
    evidence_used: [], findings: [
      { agent: "Database Agent", risk_level: "Critical", confidence: 0.9, category: "technical_complexity",
        finding: "order_reconcile relies on implicit GROUP BY ordering removed in MySQL 8.0.",
        impact: "Nightly settlement fails or returns wrong rows.", recommendation: "Rewrite with explicit GROUP BY and test.",
        evidence: ["changes/order_reconcile.sql", "architecture/database-dependencies.md"] },
      { agent: "Database Agent", risk_level: "Medium", confidence: 0.8, category: "technical_complexity",
        finding: "Mixed latin1 / utf8mb4 tables risk 'Illegal mix of collations' on JOINs.",
        impact: "Query errors on orders↔payments joins.", recommendation: "Run a collation review before upgrade.",
        evidence: ["architecture/database-dependencies.md"] },
    ],
  },
  {
    agent: "SRE Agent", role: "Operational readiness", highest_severity: "Critical", confidence: 0.92,
    summary: "Rollback is not credible: restore untested, no owner, alerting gaps.",
    evidence_used: [], findings: [
      { agent: "SRE Agent", risk_level: "Critical", confidence: 1.0, category: "rollback_confidence",
        finding: "Snapshot restore has never been tested against db-prod-01.",
        impact: "Rollback may fail when most needed.", recommendation: "Run a timed restore rehearsal in staging.",
        evidence: ["changes/rollback-plan.md", "policies/rollback-policy.md"] },
      { agent: "SRE Agent", risk_level: "High", confidence: 0.85, category: "operational_readiness",
        finding: "No alert exists for nightly settlement-job failure.",
        impact: "Stale revenue data goes unnoticed.", recommendation: "Add settlement failure alerting before the window.",
        evidence: ["changes/deployment-checklist.md", "incidents/incident-reporting-delay.md"] },
    ],
  },
  {
    agent: "Security Agent", role: "Data & compliance", highest_severity: "Medium", confidence: 0.7,
    summary: "Auth plugin and plaintext credentials require risk acceptance.",
    evidence_used: [], findings: [
      { agent: "Security Agent", risk_level: "Medium", confidence: 0.7, category: "security_compliance",
        finding: "DB credentials stored in plaintext in committed config.php.",
        impact: "Credential exposure risk during change.", recommendation: "Move secrets to a vault.",
        evidence: ["policies/security-review-policy.md"] },
    ],
  },
  {
    agent: "Business Impact Agent", role: "Customer & revenue", highest_severity: "High", confidence: 0.78,
    summary: "Checkout and daily revenue reporting are both in the blast radius.",
    evidence_used: [], findings: [
      { agent: "Business Impact Agent", risk_level: "High", confidence: 0.78, category: "business_blast_radius",
        finding: "A failed settlement leaves leadership revenue reports silently stale.",
        impact: "Wrong revenue numbers reported; customer checkout at risk.", recommendation: "Add post-deploy revenue reconciliation.",
        evidence: ["incidents/incident-reporting-delay.md", "architecture/reporting-service.md"] },
    ],
  },
  {
    agent: "Red-Team Agent", role: "Adversarial challenge", highest_severity: "High", confidence: 0.83,
    summary: "Key approval pre-conditions are unproven; change should not proceed as-is.",
    evidence_used: [], findings: [
      { agent: "Red-Team Agent", risk_level: "High", confidence: 0.83, category: "evidence_completeness",
        finding: "Auth-plugin fix is still a 'TODO' despite a prior staging outage on the exact issue.",
        impact: "Repeat of total connection outage seen in staging.", recommendation: "Block approval until auth plugin is confirmed.",
        evidence: ["incidents/incident-login-failure.md", "changes/mysql-8-upgrade-plan.md"] },
    ],
  },
];

export const MOCK_DEBATE: DebatePoint[] = [
  { agent: "SRE Agent", statement: "Rollback instructions exist, but restore validation is completely missing.", challenges: null, stance: "concern", severity: "Critical" },
  { agent: "Database Agent", statement: "The migration touches order tables and the finance reconciliation job directly.", challenges: "SRE Agent", stance: "escalation", severity: "High" },
  { agent: "Business Impact Agent", statement: "Then checkout and nightly reconciliation are both exposed — that's revenue and customer impact.", challenges: "Database Agent", stance: "escalation", severity: "High" },
  { agent: "Security Agent", statement: "Reverting to mysql_native_password for convenience weakens auth; it must be risk-accepted.", challenges: null, stance: "concern", severity: "Medium" },
  { agent: "Architecture Agent", statement: "Agreed the single-primary topology means there is no graceful degradation here.", challenges: "SRE Agent", stance: "agreement", severity: "Medium" },
  { agent: "Red-Team Agent", statement: "This should not be approved until restore testing is proven and the auth plugin is confirmed.", challenges: "everyone", stance: "escalation", severity: "Critical" },
];

export const MOCK_RESOLUTION =
  "The board converges on Conditional No-Go: the change can proceed only after a tested restore, a named rollback owner, stored-procedure validation, and settlement-failure alerting are in place.";

export const MOCK_MEMO: ExecutiveMemo = {
  change_title: "Upgrade MySQL 5.7 → 8.0 (db-prod-01)",
  decision: "Conditional Go",
  overall_risk: 78,
  confidence: 0.84,
  primary_reason: "Rollback and restore validation are incomplete, and a known stored-procedure incompatibility threatens nightly revenue reconciliation.",
  summary: "This change introduces significant risk to checkout availability and business operations. With four targeted pre-checks completed, residual risk drops to an acceptable level. Without them, this is a No-Go.",
  top_risks: [
    "Untested rollback / restore path on a Tier-1 system.",
    "order_reconcile breaks under MySQL 8.0 ONLY_FULL_GROUP_BY.",
    "No alerting on nightly settlement-job failure.",
    "Auth-plugin change previously caused a full connection outage in staging.",
  ],
  required_actions: [
    "Run a full, timed restore test in staging (within policy's 30-day window).",
    "Validate order_reconcile and sp_nightly_settlement against MySQL 8.0.",
    "Confirm mysql_native_password is enabled on the 8.0 instance.",
    "Assign a named rollback owner for the maintenance window.",
    "Add a post-deployment revenue-reconciliation validation step.",
  ],
  open_questions: [
    "Has the snapshot ever been restored successfully end-to-end?",
    "What is the measured restore time vs. the 20-minute Tier-1 limit?",
  ],
  evidence_table: [
    { source: "changes/rollback-plan.md", excerpt: "Restore procedure has never been tested…", score: 0.77 },
    { source: "changes/order_reconcile.sql", excerpt: "GROUP BY o.customer_id … ORDER BY NULL", score: 0.74 },
    { source: "incidents/incident-reporting-delay.md", excerpt: "settlement job failed silently…", score: 0.72 },
    { source: "incidents/incident-login-failure.md", excerpt: "Authentication plugin cannot be loaded", score: 0.71 },
    { source: "policies/rollback-policy.md", excerpt: "validated by an actual restore test within 30 days", score: 0.69 },
  ],
};

export const SCENARIO_TITLE = "MySQL 5.7 → 8.0 Production Upgrade";
