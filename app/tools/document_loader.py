"""Local document loading and chunking for AEGIS evidence folders.

Reads plain-text evidence (markdown, sql, log, txt) from a local folder and
splits it into overlapping chunks. No external services are touched.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from pathlib import Path

from app.core.config import settings

# Evidence file types we index. Everything stays local and text-based.
TEXT_SUFFIXES = {".md", ".txt", ".sql", ".log", ".yaml", ".yml", ".json", ".cfg", ".ini"}

# Map a file's parent folder to an evidence category for filtering in the UI.
CATEGORY_BY_FOLDER = {
    "architecture": "architecture",
    "changes": "change_plan",
    "incidents": "incident",
    "logs": "log",
    "policies": "policy",
}


@dataclass
class Chunk:
    """A single retrievable unit of evidence."""

    id: str
    text: str
    source: str  # path relative to the evidence root
    category: str
    metadata: dict = field(default_factory=dict)


def _categorize(path: Path, root: Path) -> str:
    for part in path.relative_to(root).parts:
        if part in CATEGORY_BY_FOLDER:
            return CATEGORY_BY_FOLDER[part]
    return "other"


def _chunk_text(text: str, size: int, overlap: int) -> list[str]:
    """Split on paragraph boundaries, packing into ~size-char chunks with overlap."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) + 2 <= size:
            current = f"{current}\n\n{para}" if current else para
        else:
            if current:
                chunks.append(current)
            # carry overlap from the tail of the previous chunk for context
            tail = current[-overlap:] if overlap and current else ""
            current = f"{tail}\n\n{para}" if tail else para
    if current:
        chunks.append(current)
    return chunks or ([text] if text.strip() else [])


def load_evidence(folder: str | Path) -> list[Chunk]:
    """Load and chunk every text file under `folder` (recursively)."""
    root = Path(folder).expanduser().resolve()
    if not root.exists():
        raise FileNotFoundError(f"Evidence folder not found: {root}")

    chunks: list[Chunk] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        try:
            raw = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        rel = str(path.relative_to(root))
        category = _categorize(path, root)
        for i, piece in enumerate(_chunk_text(raw, settings.chunk_size, settings.chunk_overlap)):
            digest = hashlib.sha1(f"{rel}:{i}:{piece[:64]}".encode()).hexdigest()[:16]
            chunks.append(
                Chunk(
                    id=digest,
                    text=piece,
                    source=rel,
                    category=category,
                    metadata={"source": rel, "category": category, "chunk": i},
                )
            )
    return chunks
