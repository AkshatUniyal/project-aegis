"""Local SQLite persistence for review runs — the audit trail.

Stores every review (intake, final score, memo, reports, debate) as JSON so the
History view and Evidence audit can replay any past run. Fully local.
"""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from typing import Any

from app.core.config import SQLITE_PATH

_SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
    id            TEXT PRIMARY KEY,
    created_at    TEXT NOT NULL,
    title         TEXT NOT NULL,
    change_type   TEXT,
    environment   TEXT,
    status        TEXT NOT NULL,          -- running | complete | error
    decision      TEXT,
    overall_risk  REAL,
    confidence    REAL,
    payload       TEXT                    -- full JSON result
);
"""


@contextmanager
def _conn():
    SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(SQLITE_PATH)
    con.row_factory = sqlite3.Row
    try:
        con.execute(_SCHEMA)
        yield con
        con.commit()
    finally:
        con.close()


def create_run(run_id: str, created_at: str, change: dict) -> None:
    with _conn() as con:
        con.execute(
            "INSERT OR REPLACE INTO runs (id, created_at, title, change_type, environment, status) "
            "VALUES (?,?,?,?,?,?)",
            (run_id, created_at, change.get("title", "Untitled"),
             change.get("change_type"), change.get("environment"), "running"),
        )


def complete_run(run_id: str, result: dict) -> None:
    score = result.get("score", {})
    with _conn() as con:
        con.execute(
            "UPDATE runs SET status=?, decision=?, overall_risk=?, confidence=?, payload=? WHERE id=?",
            ("complete", score.get("decision"), score.get("overall"),
             score.get("confidence"), json.dumps(result), run_id),
        )


def fail_run(run_id: str, error: str) -> None:
    with _conn() as con:
        con.execute("UPDATE runs SET status=?, payload=? WHERE id=?",
                    ("error", json.dumps({"error": error}), run_id))


def get_run(run_id: str) -> dict[str, Any] | None:
    with _conn() as con:
        row = con.execute("SELECT * FROM runs WHERE id=?", (run_id,)).fetchone()
    if not row:
        return None
    out = dict(row)
    out["payload"] = json.loads(out["payload"]) if out["payload"] else None
    return out


def list_runs(limit: int = 50) -> list[dict]:
    with _conn() as con:
        rows = con.execute(
            "SELECT id, created_at, title, change_type, environment, status, decision, overall_risk, confidence "
            "FROM runs ORDER BY created_at DESC LIMIT ?", (limit,),
        ).fetchall()
    return [dict(r) for r in rows]
