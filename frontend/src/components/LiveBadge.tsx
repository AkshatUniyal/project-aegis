"use client";

import { Wifi, FlaskConical } from "lucide-react";

/** Small indicator showing whether a screen is backed by a live run or demo data. */
export function LiveBadge({ live }: { live: boolean }) {
  return live ? (
    <span className="chip chip-low"><Wifi size={11} /> Live run</span>
  ) : (
    <span className="chip" style={{ color: "var(--text-faint)", borderColor: "var(--border)" }}>
      <FlaskConical size={11} /> Demo data
    </span>
  );
}
