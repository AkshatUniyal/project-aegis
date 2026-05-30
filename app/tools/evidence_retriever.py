"""Local semantic retrieval over evidence using Chroma + Ollama embeddings.

The vector store is persisted under storage/vector_db. Embeddings are produced
by a local Ollama model (nomic-embed-text by default) — nothing leaves the box.
"""
from __future__ import annotations

from dataclasses import dataclass

import chromadb
import ollama
from chromadb.config import Settings as ChromaSettings

from app.core.config import VECTOR_DIR, settings
from app.tools.document_loader import Chunk, load_evidence


@dataclass
class RetrievedEvidence:
    source: str
    category: str
    text: str
    score: float


class EvidenceRetriever:
    """Index an evidence folder and run semantic queries against it."""

    def __init__(self, collection_name: str | None = None):
        self.client = chromadb.PersistentClient(
            path=str(VECTOR_DIR),
            settings=ChromaSettings(anonymized_telemetry=False, allow_reset=True),
        )
        self.collection_name = collection_name or settings.collection_name
        self._ollama = ollama.Client(host=settings.ollama_host)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name, metadata={"hnsw:space": "cosine"}
        )

    # -- embeddings ---------------------------------------------------------
    def _embed(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            resp = self._ollama.embeddings(model=settings.embed_model, prompt=text)
            vectors.append(resp["embedding"])
        return vectors

    # -- indexing -----------------------------------------------------------
    def index_folder(self, folder: str, reset: bool = True) -> int:
        """Load, embed, and store every chunk in `folder`. Returns chunk count."""
        if reset:
            try:
                self.client.delete_collection(self.collection_name)
            except Exception:
                pass
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name, metadata={"hnsw:space": "cosine"}
            )

        chunks: list[Chunk] = load_evidence(folder)
        if not chunks:
            return 0

        # Embed and add in batches to keep memory modest on a 16GB machine.
        batch = 32
        for start in range(0, len(chunks), batch):
            window = chunks[start : start + batch]
            self.collection.add(
                ids=[c.id for c in window],
                documents=[c.text for c in window],
                embeddings=self._embed([c.text for c in window]),
                metadatas=[c.metadata for c in window],
            )
        return len(chunks)

    # -- retrieval ----------------------------------------------------------
    def query(
        self, text: str, k: int | None = None, categories: list[str] | None = None
    ) -> list[RetrievedEvidence]:
        """Return the top-k evidence chunks for a query, optionally category-filtered."""
        where = {"category": {"$in": categories}} if categories else None
        result = self.collection.query(
            query_embeddings=self._embed([text]),
            n_results=k or settings.retrieval_k,
            where=where,
        )
        out: list[RetrievedEvidence] = []
        docs = result.get("documents", [[]])[0]
        metas = result.get("metadatas", [[]])[0]
        dists = result.get("distances", [[]])[0]
        for doc, meta, dist in zip(docs, metas, dists):
            out.append(
                RetrievedEvidence(
                    source=meta.get("source", "?"),
                    category=meta.get("category", "other"),
                    text=doc,
                    score=round(1.0 - float(dist), 4),  # cosine distance → similarity
                )
            )
        return out

    def count(self) -> int:
        return self.collection.count()
