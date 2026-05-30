"""Central configuration for AEGIS. All settings are local-first by design."""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo paths -----------------------------------------------------------------
APP_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = APP_DIR.parent
DATA_DIR = ROOT_DIR / "data"
DEMO_DATA_DIR = DATA_DIR / "demo_enterprise"
STORAGE_DIR = ROOT_DIR / "storage"
VECTOR_DIR = STORAGE_DIR / "vector_db"
SQLITE_PATH = STORAGE_DIR / "sqlite" / "aegis.db"
OUTPUTS_DIR = ROOT_DIR / "outputs"


class Settings(BaseSettings):
    """Runtime settings. Override via env vars prefixed with AEGIS_."""

    model_config = SettingsConfigDict(env_prefix="AEGIS_", env_file=".env", extra="ignore")

    # Local LLM (Ollama) — no external APIs, ever.
    ollama_host: str = "http://localhost:11434"
    llm_model: str = "llama3.2"
    embed_model: str = "nomic-embed-text"

    # Generation controls — low temperature for repeatable, structured findings.
    temperature: float = 0.2
    num_ctx: int = 8192
    request_timeout: int = 120

    # Retrieval
    chunk_size: int = 900
    chunk_overlap: int = 150
    retrieval_k: int = 6
    collection_name: str = "aegis_evidence"

    # Demo mode — replay a curated golden run for reliable executive demos.
    demo_mode: bool = False

    # Server
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
