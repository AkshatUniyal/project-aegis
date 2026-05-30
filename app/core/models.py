"""Shared Pydantic models for AEGIS — agent findings, scores, debate, and memo."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class Decision(str, Enum):
    GO = "Go"
    CONDITIONAL_GO = "Conditional Go"
    DELAY = "Delay Recommended"
    NO_GO = "No-Go"


class EvidenceRef(BaseModel):
    source: str
    excerpt: str = ""
    score: float = 0.0


class Finding(BaseModel):
    """A single structured finding from a specialist agent."""

    agent: str
    risk_level: RiskLevel
    confidence: float = Field(ge=0.0, le=1.0)
    finding: str
    impact: str
    recommendation: str
    evidence: list[str] = Field(default_factory=list)
    category: str = "technical_complexity"  # which scoring category this maps to


class AgentReport(BaseModel):
    """All findings produced by one agent during independent review."""

    agent: str
    role: str
    summary: str = ""
    findings: list[Finding] = Field(default_factory=list)
    evidence_used: list[EvidenceRef] = Field(default_factory=list)
    highest_severity: RiskLevel = RiskLevel.LOW
    confidence: float = 0.0


class DebatePoint(BaseModel):
    """One entry in the cross-agent debate timeline."""

    agent: str
    statement: str
    challenges: str | None = None  # which agent/claim this pushes against
    stance: str = "concern"  # concern | rebuttal | agreement | escalation
    severity: RiskLevel = RiskLevel.MEDIUM


class CategoryScore(BaseModel):
    category: str
    label: str
    weight: float
    score: float  # 0-100, higher = riskier
    severity: RiskLevel
    rationale: str


class RiskScore(BaseModel):
    overall: float  # 0-100
    decision: Decision
    confidence: float
    categories: list[CategoryScore]
    evidence_completeness: float
    top_blockers: list[str] = Field(default_factory=list)


class ExecutiveMemo(BaseModel):
    change_title: str
    decision: Decision
    overall_risk: float
    confidence: float
    primary_reason: str
    summary: str
    top_risks: list[str]
    required_actions: list[str]
    open_questions: list[str] = Field(default_factory=list)
    evidence_table: list[EvidenceRef] = Field(default_factory=list)


class ChangeRequest(BaseModel):
    title: str
    description: str
    environment: str = "Production"
    change_type: str = "Database Upgrade"
    planned_date: str | None = None
    affected_systems: list[str] = Field(default_factory=list)
    risk_appetite: str = "Moderate"
    evidence_folder: str
