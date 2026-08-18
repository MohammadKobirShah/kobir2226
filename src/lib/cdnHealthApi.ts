// Client for the server-side CDN health aggregation (Netlify Function +
// Netlify Database). Reports are best-effort: failures here never block the
// player.

import type { CdnHealthStats } from "../types";

const REPORT_COOLDOWN_MS = 30_000;
const lastReport = new Map<string, number>();

export async function reportCdnEvent(
  cdnId: string,
  cdnName: string,
  outcome: "success" | "fail"
): Promise<void> {
  const key = `${cdnId}:${outcome}`;
  const now = Date.now();
  if (now - (lastReport.get(key) ?? 0) < REPORT_COOLDOWN_MS) return;
  lastReport.set(key, now);
  try {
    await fetch("/api/cdn-health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cdn_id: cdnId, cdn_name: cdnName, outcome }),
    });
  } catch {
    // Swallow — telemetry must never break playback.
  }
}

export async function fetchCdnHealth(): Promise<CdnHealthStats[]> {
  try {
    const res = await fetch("/api/cdn-health");
    if (!res.ok) return [];
    const data = (await res.json()) as { stats: CdnHealthStats[] };
    return data.stats ?? [];
  } catch {
    return [];
  }
}
