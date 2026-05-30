// Client for the local AEGIS FastAPI backend. All calls are localhost-only.
import type { AgentReport, DebatePoint, RiskScore, ExecutiveMemo, ChangeRequestInput } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export interface RunResult {
  reports: AgentReport[];
  debate: DebatePoint[];
  resolution: string;
  score: RiskScore;
  memo: ExecutiveMemo;
}

export interface RunSummary {
  id: string; created_at: string; title: string; change_type: string | null;
  environment: string | null; status: string; decision: string | null;
  overall_risk: number | null; confidence: number | null;
}

async function safe<T>(p: Promise<Response>): Promise<T | null> {
  try {
    const r = await p;
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null; // backend not running → caller falls back to mock
  }
}

export const createReview = (change: ChangeRequestInput) =>
  safe<{ run_id: string; demo_mode: boolean }>(
    fetch(`${API_BASE}/api/reviews`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(change),
    }),
  );

export const getReview = (id: string) =>
  safe<{ payload: RunResult | null; status: string }>(fetch(`${API_BASE}/api/reviews/${id}`));

export const listReviews = () =>
  safe<{ runs: RunSummary[] }>(fetch(`${API_BASE}/api/reviews`));

export const getHealth = () =>
  safe<{ status: string; llm_model: string; embed_model: string; demo_mode: boolean; local_only: boolean }>(
    fetch(`${API_BASE}/health`));

export const listEvidence = () =>
  safe<{ files: { file: string; category: string; chunks: number }[] }>(fetch(`${API_BASE}/api/evidence`));

export const getEvidenceContent = (file: string) =>
  safe<{ file: string; content: string }>(fetch(`${API_BASE}/api/evidence/content?file=${encodeURIComponent(file)}`));

/** Open an SSE stream for a run. Returns the EventSource so the caller can close it. */
export function streamReview(runId: string, onEvent: (ev: { event: string } & Record<string, unknown>) => void): EventSource {
  const es = new EventSource(`${API_BASE}/api/reviews/${runId}/stream`);
  const handler = (e: MessageEvent) => {
    try { onEvent(JSON.parse(e.data)); } catch { /* ignore */ }
  };
  ["supervisor", "agent_start", "agent_done", "debate_start", "debate", "score", "memo", "done", "persisted", "error"]
    .forEach((name) => es.addEventListener(name, handler));
  return es;
}

/** Fetch the most recent completed run's full result, or null. */
export async function latestRun(): Promise<RunResult | null> {
  const list = await listReviews();
  const done = list?.runs.find((r) => r.status === "complete");
  if (!done) return null;
  const run = await getReview(done.id);
  return run?.payload ?? null;
}
