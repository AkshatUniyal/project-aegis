"""Review API — intake, live SSE streaming, results, history, and evidence."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.core import store
from app.core.config import DEMO_DATA_DIR, settings
from app.core.models import ChangeRequest
from app.tools.document_loader import load_evidence
from app.tools.evidence_retriever import EvidenceRetriever
from app.workflows.change_review_graph import run_review_events
from app.workflows.demo_golden import golden_events

router = APIRouter(prefix="/api")

# Shared retriever, indexed lazily on first use.
_retriever: EvidenceRetriever | None = None
# Pending change requests keyed by run_id (between POST intake and GET stream).
_pending: dict[str, ChangeRequest] = {}


def _get_retriever() -> EvidenceRetriever:
    global _retriever
    if _retriever is None:
        _retriever = EvidenceRetriever()
        if _retriever.count() == 0:
            _retriever.index_folder(str(DEMO_DATA_DIR))
    return _retriever


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/reviews")
def create_review(change: ChangeRequest) -> dict:
    """Register a change-review run and return its id. Streaming starts it."""
    run_id = f"AEG-{uuid.uuid4().hex[:8].upper()}"
    _pending[run_id] = change
    store.create_run(run_id, _now(), change.model_dump())
    return {"run_id": run_id, "demo_mode": settings.demo_mode}


@router.get("/reviews/{run_id}/stream")
async def stream_review(run_id: str):
    """Run the review and stream progress events over SSE."""
    change = _pending.get(run_id)
    if change is None and not settings.demo_mode:
        raise HTTPException(404, "Unknown run id (start it via POST /api/reviews first)")

    async def event_gen():
        result: dict = {}
        try:
            # Demo mode replays the curated golden run; live mode runs the agents.
            if settings.demo_mode:
                events = golden_events(delay=0.6)
            else:
                events = run_review_events(change, _get_retriever())

            for ev in events:
                if ev.get("event") == "done":
                    result = ev.get("result", result)
                else:
                    # accumulate the pieces the UI needs from a live run
                    if ev["event"] == "agent_done":
                        result.setdefault("reports", []).append(ev["report"])
                    elif ev["event"] == "debate":
                        result["debate"] = ev["points"]
                        result["resolution"] = ev["resolution"]
                    elif ev["event"] == "score":
                        result["score"] = ev["score"]
                    elif ev["event"] == "memo":
                        result["memo"] = ev["memo"]
                yield {"event": ev["event"], "data": json.dumps(ev)}

            store.complete_run(run_id, result)
            yield {"event": "persisted", "data": json.dumps({"run_id": run_id})}
        except Exception as exc:  # surface failures to the UI rather than hang
            store.fail_run(run_id, str(exc))
            yield {"event": "error", "data": json.dumps({"error": str(exc)})}
        finally:
            _pending.pop(run_id, None)

    return EventSourceResponse(event_gen())


@router.get("/reviews/{run_id}")
def get_review(run_id: str) -> dict:
    run = store.get_run(run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return run


@router.get("/reviews")
def list_reviews() -> dict:
    return {"runs": store.list_runs()}


@router.get("/evidence")
def list_evidence() -> dict:
    """List indexed evidence files grouped from the demo folder."""
    chunks = load_evidence(str(DEMO_DATA_DIR))
    seen: dict[str, dict] = {}
    for c in chunks:
        seen.setdefault(c.source, {"file": c.source, "category": c.category, "chunks": 0})
        seen[c.source]["chunks"] += 1
    return {"files": sorted(seen.values(), key=lambda x: x["file"])}


@router.get("/evidence/search")
def search_evidence(q: str, k: int = 8) -> dict:
    results = _get_retriever().query(q, k=k)
    return {"results": [r.__dict__ for r in results]}


@router.get("/evidence/content")
def evidence_content(file: str) -> dict:
    """Return the raw text of a local evidence file (path-traversal guarded)."""
    root = DEMO_DATA_DIR.resolve()
    target = (root / file).resolve()
    if root not in target.parents and target != root:
        raise HTTPException(400, "Path outside evidence root")
    if not target.is_file():
        raise HTTPException(404, "Evidence file not found")
    return {"file": file, "content": target.read_text(encoding="utf-8", errors="replace")}
