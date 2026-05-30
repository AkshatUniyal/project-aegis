# Project AEGIS

**Local Multi-Agent AI Change Risk War Room**

AEGIS is a fully local multi-agent AI system that reviews risky technology changes
before production release. It simulates an internal architecture, SRE, database,
security, business-impact, and red-team review board — running entirely on your
machine with no external API calls.

> AEGIS is not a chatbot. It is a local AI risk council for real engineering decisions.

## Architecture

```
User Change Request
   → Supervisor Agent (routes + selects specialists)
   → Independent specialist review (Database, SRE, Security, Red-Team)
   → Cross-agent debate
   → Risk Scoring Engine (weighted, transparent)
   → Executive Synthesizer Agent
   → Final Memo + Dashboard
```

## Stack

| Layer | Technology |
|-------|-----------|
| Local LLM runtime | Ollama (open-weight models) |
| Agent orchestration | LangGraph |
| Vector database | Chroma (local) |
| Backend | Python + FastAPI |
| Frontend | Next.js / React |
| Structured store | SQLite |

## Prerequisites

- [Ollama](https://ollama.com) installed and running
- Python 3.12 (managed via `uv`)
- Node.js 20+

Pull the required models:

```bash
ollama pull llama3.2          # reasoning / agents
ollama pull nomic-embed-text  # embeddings for retrieval
```

## Setup

### Backend

```bash
cd aegis
uv venv --python 3.12
uv pip install -e .
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd aegis/frontend
npm install
npm run dev
```

## Demo Mode

AEGIS supports a semi-deterministic **demo mode** so executive demos run reliably
regardless of local model variance. Set `AEGIS_DEMO_MODE=true` to replay a curated
golden run for the MySQL 5.7 → 8.0 scenario.

## Status

MVP — MySQL 5.7 → 8.0 production upgrade scenario. See `Documents/Project_AEGIS_Scope.docx`.
