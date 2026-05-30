// Shared domain types — mirror the FastAPI / Pydantic models in app/core/models.py

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type Decision = "Go" | "Conditional Go" | "Delay Recommended" | "No-Go";

export interface Finding {
  agent: string;
  risk_level: RiskLevel;
  confidence: number;
  finding: string;
  impact: string;
  recommendation: string;
  evidence: string[];
  category: string;
}

export interface EvidenceRef {
  source: string;
  excerpt: string;
  score: number;
}

export interface AgentReport {
  agent: string;
  role: string;
  summary: string;
  findings: Finding[];
  evidence_used: EvidenceRef[];
  highest_severity: RiskLevel;
  confidence: number;
}

export interface DebatePoint {
  agent: string;
  statement: string;
  challenges: string | null;
  stance: "concern" | "rebuttal" | "agreement" | "escalation";
  severity: RiskLevel;
}

export interface CategoryScore {
  category: string;
  label: string;
  weight: number;
  score: number;
  severity: RiskLevel;
  rationale: string;
}

export interface RiskScore {
  overall: number;
  decision: Decision;
  confidence: number;
  categories: CategoryScore[];
  evidence_completeness: number;
  top_blockers: string[];
}

export interface ExecutiveMemo {
  change_title: string;
  decision: Decision;
  overall_risk: number;
  confidence: number;
  primary_reason: string;
  summary: string;
  top_risks: string[];
  required_actions: string[];
  open_questions: string[];
  evidence_table: EvidenceRef[];
}

export interface ChangeRequestInput {
  title: string;
  description: string;
  environment?: string;
  change_type?: string;
  planned_date?: string;
  affected_systems?: string[];
  risk_appetite?: string;
  evidence_folder: string;
}

export interface AgentMeta {
  key: string;
  name: string;
  short: string;
  role: string;
}

export const AGENTS: AgentMeta[] = [
  { key: "architecture", name: "Architecture Agent", short: "ARCH", role: "Dependencies & topology" },
  { key: "sre", name: "SRE Agent", short: "SRE", role: "Operational readiness" },
  { key: "database", name: "Database Agent", short: "DB", role: "Migration & schema" },
  { key: "security", name: "Security Agent", short: "SEC", role: "Data & compliance" },
  { key: "business", name: "Business Impact Agent", short: "BIZ", role: "Customer & revenue" },
  { key: "red_team", name: "Red-Team Agent", short: "RED", role: "Adversarial challenge" },
];
