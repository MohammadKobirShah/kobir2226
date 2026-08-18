import { create } from "zustand";
import type { MediaType } from "../types";

interface PlayerState {
  current: {
    tmdbId: number;
    mediaType: MediaType;
    title: string;
    season?: number;
    episode?: number;
    episodeName?: string;
  } | null;
  activeCdn: string;
  setCurrent: (
    current: PlayerState["current"],
    cdnId: string
  ) => void;
  setActiveCdn: (cdnId: string) => void;
  clear: () => void;
}

export const usePlayer = create<PlayerState>((set) => ({
  current: null,
  activeCdn: "videasy",
  setCurrent: (current, cdnId) => set({ current, activeCdn: cdnId }),
  setActiveCdn: (cdnId) => set({ activeCdn: cdnId }),
  clear: () => set({ current: null }),
}));
