"""AEGIS FastAPI application entrypoint."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title="Project AEGIS",
    description="Local Multi-Agent AI Change Risk War Room",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    """Liveness probe — confirms the service and local config are loaded."""
    return {
        "status": "ok",
        "llm_model": settings.llm_model,
        "embed_model": settings.embed_model,
        "demo_mode": settings.demo_mode,
        "local_only": True,
    }


from app.api import reviews  # noqa: E402

app.include_router(reviews.router)
