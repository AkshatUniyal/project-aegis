"""Supervisor Agent — selects relevant specialists for the proposed change."""
from __future__ import annotations

from app.agents.personas import SPECIALISTS, Persona
from app.core.models import ChangeRequest

# Which specialists are mandatory regardless of change type.
_ALWAYS = {"sre", "red_team", "security"}

# Change-type → additional relevant specialists.
_BY_TYPE = {
    "database upgrade": {"database", "business"},
    "infrastructure migration": {"database", "business"},
    "security rule change": {"business"},
    "ai feature release": {"business"},
}


def select_specialists(change: ChangeRequest) -> list[Persona]:
    """Route the change to the relevant review board members."""
    wanted = set(_ALWAYS)
    wanted |= _BY_TYPE.get(change.change_type.strip().lower(), {"database", "business"})
    # Preserve canonical ordering from personas.SPECIALISTS.
    return [p for p in SPECIALISTS if p.key in wanted]
