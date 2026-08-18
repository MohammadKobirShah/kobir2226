// Local CDN health tracking: success/fail over the last 10 requests per CDN,
// auto-reordering the fallback chain. Failed CDNs are deprioritized for 5
// minutes. Aggregated stats are reported to the server-side function.

import { create } from "zustand";
import { availableSources, CDN_SOURCES } from "../lib/videasy";
import { reportCdnEvent } from "../lib/cdnHealthApi";
import type { CdnSource } from "../types";

const DEPRIORITIZE_MS = 5 * 60 * 1000;
const WINDOW = 10;

interface CdnHealthState {
  // ordered chain of CDN ids, best first
  chain: string[];
  recent: Record<string, boolean[]>; // cdn id -> last N outcomes (true=success)
  deprioritizedUntil: Record<string, number>;
  loaded: boolean;
  markSuccess: (cdnId: string) => void;
  markFail: (cdnId: string) => void;
  loadInitialOrder: (isPremium: boolean, preferred?: string) => void;
  serverStats: Record<string, number>; // cdn name -> success rate
  setServerStats: (stats: Record<string, number>) => void;
}

function reorder(state: CdnHealthState): string[] {
  const now = Date.now();
  const score = (id: string): number => {
    const outcomes = state.recent[id] ?? [];
    if (outcomes.length === 0) return 1;
    const successes = outcomes.filter(Boolean).length;
    let s = successes / outcomes.length;
    if ((state.deprioritizedUntil[id] ?? 0) > now) s -= 1;
    return s;
  };
  return [...state.chain].sort((a, b) => score(b) - score(a));
}

export const useCdnHealth = create<CdnHealthState>((set, get) => ({
  chain: CDN_SOURCES.map((s) => s.id),
  recent: {},
  deprioritizedUntil: {},
  loaded: false,
  serverStats: {},
  setServerStats: (stats) => set({ serverStats: stats }),

  loadInitialOrder: (isPremium, preferred) => {
    const ids = availableSources(isPremium).map((s) => s.id);
    // Preferred CDN first, then default order; local outcomes reorder later.
    const chain = preferred && ids.includes(preferred)
      ? [preferred, ...ids.filter((i) => i !== preferred)]
      : ids;
    set({ chain, loaded: true });
  },

  markSuccess: (cdnId) => {
    const recent = { ...get().recent };
    recent[cdnId] = [...(recent[cdnId] ?? []), true].slice(-WINDOW);
    const src = CDN_SOURCES.find((s) => s.id === cdnId);
    if (src) void reportCdnEvent(src.id, src.name, "success");
    set({ recent });
  },

  markFail: (cdnId) => {
    const state = get();
    const recent = { ...state.recent };
    recent[cdnId] = [...(recent[cdnId] ?? []), false].slice(-WINDOW);
    const outcomes = recent[cdnId];
    const consecutiveFails = countTrailing(outcomes, false);
    const deprioritizedUntil = { ...state.deprioritizedUntil };
    if (consecutiveFails >= 2) {
      deprioritizedUntil[cdnId] = Date.now() + DEPRIORITIZE_MS;
    }
    const src = CDN_SOURCES.find((s) => s.id === cdnId);
    if (src) void reportCdnEvent(src.id, src.name, "fail");
    const next = { ...state, recent, deprioritizedUntil };
    set({ recent, deprioritizedUntil, chain: reorder(next) });
  },
}));

function countTrailing(arr: boolean[], value: boolean): number {
  let n = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === value) n++;
    else break;
  }
  return n;
}

export function sourcesForCurrentChain(): CdnSource[] {
  const { chain } = useCdnHealth.getState();
  return chain
    .map((id) => CDN_SOURCES.find((s) => s.id === id))
    .filter((s): s is CdnSource => Boolean(s));
}
