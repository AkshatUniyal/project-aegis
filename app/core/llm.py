"""Local LLM client wrapper around Ollama with robust JSON extraction.

Small local models are inconsistent at returning clean JSON. This module forces
JSON output format, retries on parse failure, and salvages JSON from noisy text.
"""
from __future__ import annotations

import json
import re

import ollama
from tenacity import retry, stop_after_attempt, wait_fixed

from app.core.config import settings

_client = ollama.Client(host=settings.ollama_host)


def _extract_json(text: str) -> dict | list | None:
    """Best-effort recovery of a JSON object/array from model output."""
    text = text.strip()
    # Strip code fences if present.
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Find the outermost {...} or [...] block.
    for opener, closer in (("{", "}"), ("[", "]")):
        start = text.find(opener)
        end = text.rfind(closer)
        if start != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                continue
    return None


@retry(stop=stop_after_attempt(3), wait=wait_fixed(1), reraise=True)
def generate_json(system: str, prompt: str, schema_hint: str = "") -> dict | list:
    """Call the local model and return parsed JSON. Retries on parse failure."""
    full_prompt = prompt
    if schema_hint:
        full_prompt = f"{prompt}\n\nReturn ONLY valid JSON matching:\n{schema_hint}"

    resp = _client.chat(
        model=settings.llm_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": full_prompt},
        ],
        format="json",  # Ollama-native structured output nudge
        options={
            "temperature": settings.temperature,
            "num_ctx": settings.num_ctx,
        },
    )
    content = resp["message"]["content"]
    parsed = _extract_json(content)
    if parsed is None:
        raise ValueError(f"Model did not return parseable JSON: {content[:200]}")
    return parsed


def generate_text(system: str, prompt: str) -> str:
    """Plain text generation for narrative summaries."""
    resp = _client.chat(
        model=settings.llm_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        options={"temperature": settings.temperature, "num_ctx": settings.num_ctx},
    )
    return resp["message"]["content"].strip()
