"""LangGraph workflow orchestrating the AEGIS change-review board.

Flow: supervisor → (specialist reviews, sequential) → debate → score → synthesize.
The orchestrator is also exposed as an event generator so the UI War Room can
render agents completing one at a time.
"""
from __future__ import annotations

from collections.abc import Iterator
from typing import Annotated, Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.base import run_specialist
from app.agents.debate import run_debate
from app.agents.personas import SPECIALISTS_BY_KEY
from app.agents.supervisor import select_specialists
from app.agents.synthesizer import synthesize_memo
from app.core.models import AgentReport, ChangeRequest, ExecutiveMemo, RiskScore
from app.tools.evidence_retriever import EvidenceRetriever
from app.tools.risk_scorer import score_reports


def _merge(left: list, right: list) -> list:
    return left + right


class ReviewState(TypedDict, total=False):
    change: ChangeRequest
    selected: list[str]
    reports: Annotated[list[AgentReport], _merge]
    debate: list
    resolution: str
    score: RiskScore
    memo: ExecutiveMemo


def build_graph(retriever: EvidenceRetriever):
    """Construct the StateGraph. Specialists run as sequential nodes."""

    def supervisor_node(state: ReviewState) -> dict:
        personas = select_specialists(state["change"])
        return {"selected": [p.key for p in personas]}

    def make_specialist_node(key: str):
        def node(state: ReviewState) -> dict:
            persona = SPECIALISTS_BY_KEY[key]
            report = run_specialist(persona, state["change"], retriever)
            return {"reports": [report]}

        return node

    def debate_node(state: ReviewState) -> dict:
        points, resolution = run_debate(state["reports"])
        return {"debate": points, "resolution": resolution}

    def score_node(state: ReviewState) -> dict:
        return {"score": score_reports(state["reports"])}

    def synth_node(state: ReviewState) -> dict:
        memo = synthesize_memo(
            state["change"], state["reports"], state["score"], state.get("resolution", "")
        )
        return {"memo": memo}

    g = StateGraph(ReviewState)
    g.add_node("supervisor", supervisor_node)
    for key in SPECIALISTS_BY_KEY:
        g.add_node(f"review_{key}", make_specialist_node(key))
    g.add_node("debate", debate_node)
    g.add_node("score", score_node)
    g.add_node("synthesize", synth_node)

    g.add_edge(START, "supervisor")
    # Sequential specialist chain (Ollama serializes anyway on local hardware).
    order = list(SPECIALISTS_BY_KEY.keys())
    prev = "supervisor"
    for key in order:
        g.add_edge(prev, f"review_{key}")
        prev = f"review_{key}"
    g.add_edge(prev, "debate")
    g.add_edge("debate", "score")
    g.add_edge("score", "synthesize")
    g.add_edge("synthesize", END)
    return g.compile()


def run_review_events(change: ChangeRequest, retriever: EvidenceRetriever) -> Iterator[dict]:
    """Run the review, yielding progress events for the live UI.

    Specialist selection respects the supervisor; only selected agents run.
    Events: supervisor, agent_start, agent_done, debate, score, memo, done.
    """
    personas = select_specialists(change)
    yield {"event": "supervisor", "selected": [p.name for p in personas]}

    reports: list[AgentReport] = []
    for persona in personas:
        yield {"event": "agent_start", "agent": persona.name, "role": persona.role}
        report = run_specialist(persona, change, retriever)
        reports.append(report)
        yield {
            "event": "agent_done",
            "agent": persona.name,
            "highest_severity": report.highest_severity.value,
            "confidence": report.confidence,
            "findings_count": len(report.findings),
            "report": report.model_dump(),
        }

    yield {"event": "debate_start"}
    points, resolution = run_debate(reports)
    yield {
        "event": "debate",
        "points": [p.model_dump() for p in points],
        "resolution": resolution,
    }

    score = score_reports(reports)
    yield {"event": "score", "score": score.model_dump()}

    memo = synthesize_memo(change, reports, score, resolution)
    yield {"event": "memo", "memo": memo.model_dump()}
    yield {"event": "done"}
