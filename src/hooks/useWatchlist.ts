import { useCallback, useEffect, useState } from "react";
import {
  addToWatchlist,
  getWatchlist,
  isInWatchlist,
  removeFromWatchlist,
} from "../lib/db";
import { useStore } from "../stores/useStore";
import type { MediaType, WatchlistEntry } from "../types";

export function useWatchlist() {
  const watchlistVersion = useStore((s) => s.watchlistVersion);
  const bumpWatchlist = useStore((s) => s.bumpWatchlist);
  const pushToast = useStore((s) => s.pushToast);
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getWatchlist().then((list) => {
      if (!cancelled) {
        setItems(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [watchlistVersion]);

  const toggle = useCallback(
    async (entry: Omit<WatchlistEntry, "id" | "added_date">) => {
      const present = await isInWatchlist(entry.tmdb_id, entry.media_type);
      if (present) {
        await removeFromWatchlist(entry.tmdb_id, entry.media_type);
        pushToast(`Removed "${entry.title}" from My List`);
      } else {
        await addToWatchlist({ ...entry, added_date: new Date().toISOString() });
        pushToast(`Added "${entry.title}" to My List`, "success");
      }
      bumpWatchlist();
    },
    [bumpWatchlist, pushToast]
  );

  return { items, loading, toggle };
}

export function useInWatchlist(tmdbId: number, mediaType: MediaType) {
  const watchlistVersion = useStore((s) => s.watchlistVersion);
  const [present, setPresent] = useState(false);
  useEffect(() => {
    let cancelled = false;
    isInWatchlist(tmdbId, mediaType).then((v) => {
      if (!cancelled) setPresent(v);
    });
    return () => {
      cancelled = true;
    };
  }, [tmdbId, mediaType, watchlistVersion]);
  return present;
}
