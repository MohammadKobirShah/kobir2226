import { useCallback, useEffect, useState } from "react";
import {
  getProgress,
  getRecentProgress,
  removeProgress,
  saveProgress,
} from "../lib/db";
import { useStore } from "../stores/useStore";
import type { MediaType, WatchProgressEntry } from "../types";

export function useContinueWatching() {
  const progressVersion = useStore((s) => s.progressVersion);
  const bumpProgress = useStore((s) => s.bumpProgress);
  const [items, setItems] = useState<WatchProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRecentProgress(20).then((list) => {
      if (!cancelled) {
        setItems(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [progressVersion]);

  const remove = useCallback(
    async (entry: WatchProgressEntry) => {
      await removeProgress(
        entry.tmdb_id,
        entry.media_type,
        entry.season,
        entry.episode
      );
      bumpProgress();
    },
    [bumpProgress]
  );

  return { items, loading, remove };
}

export function useEpisodeProgress(
  tmdbId: number,
  mediaType: MediaType,
  season: number | null,
  episode: number | null
) {
  const progressVersion = useStore((s) => s.progressVersion);
  const [entry, setEntry] = useState<WatchProgressEntry | undefined>();

  useEffect(() => {
    let cancelled = false;
    getProgress(tmdbId, mediaType, season, episode).then((e) => {
      if (!cancelled) setEntry(e);
    });
    return () => {
      cancelled = true;
    };
  }, [tmdbId, mediaType, season, episode, progressVersion]);

  return entry;
}

// Persists time-estimated playback progress (cross-origin iframes don't
// expose real positions — see implementation notes).
export function useProgressTracker(args: {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  season?: number;
  episode?: number;
  episodeName?: string;
  resumeFromSeconds: number;
  durationSeconds: number;
  cdnId: string;
  active: boolean;
}) {
  const bumpProgress = useStore((s) => s.bumpProgress);

  useEffect(() => {
    if (!args.active) return;
    const startedAt = Date.now();
    const save = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const position = args.resumeFromSeconds + elapsed;
      const percent = Math.min(
        100,
        Math.round((position / args.durationSeconds) * 100)
      );
      void saveProgress({
        tmdb_id: args.tmdbId,
        media_type: args.mediaType,
        title: args.title,
        poster_path: args.posterPath,
        backdrop_path: args.backdropPath,
        season: args.season ?? null,
        episode: args.episode ?? null,
        episode_name: args.episodeName ?? null,
        progress_percent: percent,
        position_seconds: Math.round(position),
        duration_seconds: args.durationSeconds,
        last_watched: new Date().toISOString(),
        cdn_used: args.cdnId,
      });
      bumpProgress();
    };
    const interval = setInterval(save, 10_000); // update every 10s
    save();
    return () => {
      clearInterval(interval);
      save(); // final position on close
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.active, args.cdnId, args.tmdbId, args.season, args.episode]);
}
