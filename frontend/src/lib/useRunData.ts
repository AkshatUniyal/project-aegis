"use client";

import { useEffect, useState } from "react";
import { latestRun, getReview, type RunResult } from "./api";
import { MOCK_REPORTS, MOCK_DEBATE, MOCK_RESOLUTION, MOCK_SCORE, MOCK_MEMO } from "./mock";

const MOCK: RunResult = {
  reports: MOCK_REPORTS, debate: MOCK_DEBATE, resolution: MOCK_RESOLUTION,
  score: MOCK_SCORE, memo: MOCK_MEMO,
};

/**
 * Returns run data for the screen. If the URL carries `?run=ID` (e.g. when opened
 * from History), that specific run is loaded; otherwise the most recent completed
 * run is used. Falls back to curated mock data when the backend is unavailable.
 * `live` indicates a real backend source.
 */
export function useRunData(): { data: RunResult; live: boolean; loading: boolean } {
  const [data, setData] = useState<RunResult>(MOCK);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const runId = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("run") : null;

    const fetcher = runId
      ? getReview(runId).then((r) => (r?.payload ?? null))
      : latestRun();

    fetcher.then((r) => {
      if (!active) return;
      if (r) { setData(r); setLive(true); }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return { data, live, loading };
}
