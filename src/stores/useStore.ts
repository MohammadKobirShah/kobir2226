import { create } from "zustand";
import type { MediaType, ToastMessage, UserProfile } from "../types";
import { uid } from "../lib/utils";

const PROFILE_KEY = "videasypro:profile";

const defaultProfile: UserProfile = {
  id: "local",
  name: "Guest",
  avatar_color: "#6366F1",
  is_premium: false,
  preferences: {
    accent_color: "#6366F1",
    default_cdn: "videasy",
    autoplay_next: true,
    subtitle_language: "en",
    preferred_quality: "auto",
  },
};

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultProfile;
}

interface AppState {
  profile: UserProfile;
  setPremium: (value: boolean) => void;
  updatePreferences: (prefs: Partial<UserProfile["preferences"]>) => void;

  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Detail modal state: which title is open
  modal: { tmdbId: number; mediaType: MediaType } | null;
  openModal: (tmdbId: number, mediaType: MediaType) => void;
  closeModal: () => void;

  toasts: ToastMessage[];
  pushToast: (message: string, kind?: ToastMessage["kind"]) => void;
  dismissToast: (id: string) => void;

  // Bump counters to trigger list refreshes after IndexedDB writes
  watchlistVersion: number;
  progressVersion: number;
  bumpWatchlist: () => void;
  bumpProgress: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  profile: loadProfile(),
  setPremium: (value) => {
    const profile = { ...get().profile, is_premium: value };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    set({ profile });
    get().pushToast(
      value ? "Premium unlocked — all 6 CDNs available" : "Reverted to Pro tier",
      value ? "success" : "info"
    );
  },
  updatePreferences: (prefs) => {
    const profile = {
      ...get().profile,
      preferences: { ...get().profile.preferences, ...prefs },
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    set({ profile });
  },

  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  modal: null,
  openModal: (tmdbId, mediaType) => set({ modal: { tmdbId, mediaType } }),
  closeModal: () => set({ modal: null }),

  toasts: [],
  pushToast: (message, kind = "info") => {
    const toast: ToastMessage = { id: uid(), message, kind };
    set({ toasts: [...get().toasts, toast] });
    setTimeout(() => get().dismissToast(toast.id), 4200);
  },
  dismissToast: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  watchlistVersion: 0,
  progressVersion: 0,
  bumpWatchlist: () => set({ watchlistVersion: get().watchlistVersion + 1 }),
  bumpProgress: () => set({ progressVersion: get().progressVersion + 1 }),
}));
