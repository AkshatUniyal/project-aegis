// Evidence index for the Explorer — mirrors data/demo_enterprise files and which
// agent cited each. Highlighted lines are the spans that drove a finding.

export interface EvidenceItem {
  file: string;
  category: "Architecture" | "Change Plan" | "Incident" | "Log" | "Policy";
  usedBy: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  score: number;
  preview: string[];
  highlight: number[]; // indices into preview
  impact: string;
}

export const EVIDENCE: EvidenceItem[] = [
  {
    file: "changes/rollback-plan.md", category: "Change Plan", usedBy: "SRE Agent", severity: "Critical", score: 0.77,
    preview: [
      "## Strategy",
      "In-place upgrades to MySQL 8.0 are not reversible by downgrade.",
      "## Gaps and assumptions",
      "The snapshot restore procedure has never been tested against db-prod-01.",
      "No designated rollback owner is named for the maintenance window.",
      "NOTE: Rollback policy requires a tested restore within the last 30 days.",
    ],
    highlight: [3, 4, 5],
    impact: "The absent restore validation is referenced by multiple agents. Absence of verifiable rollback drives the rollback-confidence category to Critical and is the primary blocker.",
  },
  {
    file: "changes/order_reconcile.sql", category: "Change Plan", usedBy: "Database Agent", severity: "Critical", score: 0.74,
    preview: [
      "CREATE PROCEDURE order_reconcile(IN p_business_date DATE)",
      "  SELECT o.customer_id, o.order_id, o.status,",
      "  GROUP BY o.customer_id   -- implicit ordering relied on downstream",
      "  ORDER BY NULL;           -- 5.7 optimization; semantics differ in 8.0",
    ],
    highlight: [2, 3],
    impact: "Selecting non-aggregated columns under ONLY_FULL_GROUP_BY (default in 8.0) will error or change results, threatening nightly settlement.",
  },
  {
    file: "incidents/incident-reporting-delay.md", category: "Incident", usedBy: "Business Impact Agent", severity: "High", score: 0.72,
    preview: [
      "# INC-2025-0203 — Stale finance reconciliation",
      "The nightly settlement job failed silently.",
      "Leadership's morning revenue report showed the prior day's numbers.",
      "Root cause: order_reconcile exited non-zero; no failure alerting.",
    ],
    highlight: [1, 3],
    impact: "Establishes a real prior occurrence of the exact failure mode the upgrade could trigger — with no alerting to detect it.",
  },
  {
    file: "incidents/incident-login-failure.md", category: "Incident", usedBy: "Red-Team Agent", severity: "High", score: 0.71,
    preview: [
      "# INC-2024-1105 — Auth plugin connection failures (staging)",
      "Error: Authentication plugin 'mysql_native_password' cannot be loaded.",
      "The 8.0 instance defaulted to caching_sha2_password.",
      "This exact failure will recur on production if checklist item #6 is not done.",
    ],
    highlight: [1, 3],
    impact: "Red-Team uses this to argue the still-open auth-plugin TODO is an unaccepted, previously-realized outage risk.",
  },
  {
    file: "policies/rollback-policy.md", category: "Policy", usedBy: "SRE Agent", severity: "High", score: 0.69,
    preview: [
      "Every High Risk change must have a rollback path validated by an actual restore test within the last 30 days.",
      "'We have a snapshot' is not an accepted rollback plan unless restore has been timed and verified.",
      "Maximum acceptable restore time for Tier-1 systems (checkout) is 20 minutes.",
    ],
    highlight: [0, 1],
    impact: "Provides the governance standard the change currently violates, converting a gap into a policy breach.",
  },
  {
    file: "architecture/database-dependencies.md", category: "Architecture", usedBy: "Database Agent", severity: "Medium", score: 0.66,
    preview: [
      "ONLY_FULL_GROUP_BY is enabled by default in 8.0.",
      "Mixed latin1 / utf8mb4 tables risk 'Illegal mix of collations' on JOINs.",
      "mysql_native_password is deprecated; app connections may fail.",
    ],
    highlight: [0, 1],
    impact: "Maps the schema-level incompatibilities that feed the technical-complexity score.",
  },
  {
    file: "logs/mysql-slow-query.log", category: "Log", usedBy: "SRE Agent", severity: "Medium", score: 0.61,
    preview: [
      "CALL order_reconcile('2025-04-21');  Query_time: 18.4s Lock_time: 6.2s",
      "UPDATE orders ... Lock_time 7.99s (timeout is 8s)",
    ],
    highlight: [0, 1],
    impact: "Shows the settlement query already runs near lock-timeout limits — 8.0 lock behavior changes amplify this risk.",
  },
  {
    file: "architecture/system-map.md", category: "Architecture", usedBy: "Architecture Agent", severity: "Medium", score: 0.58,
    preview: [
      "Single primary: all writes go to db-prod-01.",
      "A failed upgrade on the primary is a full checkout outage.",
    ],
    highlight: [1],
    impact: "Establishes that there is no graceful degradation path — the topology concentrates risk.",
  },
];

export const CATEGORIES = ["Architecture", "Change Plan", "Incident", "Log", "Policy"] as const;
export const SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;

// Curated enrichment keyed by file path — severity/usedBy/score/impact and the
// key phrases to highlight inside the real file content.
export const ENRICHMENT: Record<string, Pick<EvidenceItem, "usedBy" | "severity" | "score" | "impact"> & { phrases: string[] }> =
  Object.fromEntries(EVIDENCE.map((e) => [e.file, {
    usedBy: e.usedBy, severity: e.severity, score: e.score, impact: e.impact,
    phrases: e.highlight.map((i) => e.preview[i].replace(/#.*$/, "").replace(/--.*$/, "").trim().slice(0, 24)).filter(Boolean),
  }]));

// Map backend category slugs → display labels.
export const CATEGORY_LABEL: Record<string, EvidenceItem["category"]> = {
  architecture: "Architecture", change_plan: "Change Plan", incident: "Incident",
  log: "Log", policy: "Policy",
};
