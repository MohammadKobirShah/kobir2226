import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Captions, MonitorPlay } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";
import { availableSources, buildEmbedUrl } from "../../lib/videasy";
import { useCdnHealth } from "../../stores/useCdnHealth";
import { useStore } from "../../stores/useStore";
import { useProgressTracker, useEpisodeProgress } from "../../hooks/useWatchProgress";
import { getMovieDetails, getTvDetails } from "../../lib/tmdb";
import { cx, formatTimestamp } from "../../lib/utils";
import { CdnSelector } from "./CdnSelector";
import { NextEpisode } from "./NextEpisode";
import { PlayerError } from "./PlayerError";
import type { MediaType, TmdbMediaItem } from "../../types";

const LOAD_TIMEOUT_MS = 8000;
const SWITCH_DELAY_MS = 2000; // delay between CDN fallback switches per spec

interface LocationState {
  title?: string;
  episodeName?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  runtime?: number | null;
}

export function PlayerPage() {
  const params = useParams<{
    mediaType: string;
    tmdbId: string;
    season?: string;
    episode?: string;
  }>();
  const mediaType: MediaType = params.mediaType === "tv" ? "tv" : "movie";
  const tmdbId = Number(params.tmdbId);
  const season = params.season ? Number(params.season) : undefined;
  const episode = params.episode ? Number(params.episode) : undefined;

  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const isPremium = useStore((s) => s.profile.is_premium);
  const autoplayNext = useStore((s) => s.profile.preferences.autoplay_next);
  const pushToast = useStore((s) => s.pushToast);

  const chain = useCdnHealth((s) => s.chain);
  const markSuccess = useCdnHealth((s) => s.markSuccess);
  const markFail = useCdnHealth((s) => s.markFail);
  const recent = useCdnHealth((s) => s.recent);

  const sources = useMemo(() => availableSources(isPremium), [isPremium]);
  const orderedSources = useMemo(() => {
    const ordered = chain
      .map((id) => sources.find((s) => s.id === id))
      .filter((s): s is (typeof sources)[number] => Boolean(s));
    // include any sources missing from the chain
    for (const s of sources) if (!ordered.includes(s)) ordered.push(s);
    return ordered;
  }, [chain, sources]);

  const [cdnIndex, setCdnIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [clickGuard, setClickGuard] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [showNext, setShowNext] = useState(false);
  const [nextDismissed, setNextDismissed] = useState(false);

  const activeCdn = orderedSources[Math.min(cdnIndex, orderedSources.length - 1)];
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<number>(Date.now());

  // Title metadata (for header + progress)
  const { data: details } = useSWR(
    ["player-details", mediaType, tmdbId],
    async (): Promise<TmdbMediaItem> =>
      mediaType === "movie" ? getMovieDetails(tmdbId) : getTvDetails(tmdbId),
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const title =
    state.title ??
    (details
      ? mediaType === "movie"
        ? (details as { title?: string }).title
        : (details as { name?: string }).name
      : undefined) ??
    "Loading…";

  const runtimeMinutes =
    state.runtime ??
    (mediaType === "movie"
      ? ((details as { runtime?: number | null } | undefined)?.runtime ?? 90)
      : (((details as { episode_run_time?: number[] } | undefined)
          ?.episode_run_time?.[0]) ??
        45));
  const durationSeconds = (runtimeMinutes || 45) * 60;

  const savedProgress = useEpisodeProgress(
    tmdbId,
    mediaType,
    season ?? null,
    episode ?? null
  );
  const resumeFrom = useRef(0);
  const resumeChecked = useRef(false);

  useEffect(() => {
    if (resumeChecked.current || savedProgress === undefined) return;
    resumeChecked.current = true;
    if (savedProgress && savedProgress.position_seconds > 30) {
      const ok = window.confirm(
        `Continue from ~${formatTimestamp(savedProgress.position_seconds)}?`
      );
      if (ok) {
        resumeFrom.current = savedProgress.position_seconds;
        pushToast(
          "This source may not support resume — playback position is estimated",
          "info"
        );
      }
    }
  }, [savedProgress, pushToast]);

  // Progress tracking (time-estimated)
  useProgressTracker({
    tmdbId,
    mediaType,
    title,
    posterPath: state.posterPath ?? details?.poster_path ?? null,
    backdropPath: state.backdropPath ?? details?.backdrop_path ?? null,
    season,
    episode,
    episodeName: state.episodeName,
    resumeFromSeconds: resumeFrom.current,
    durationSeconds,
    cdnId: activeCdn?.id ?? "videasy",
    active: loaded && !allFailed,
  });

  // Elapsed ticker for overlay + next-episode trigger
  useEffect(() => {
    if (!loaded) return;
    startedAt.current = Date.now() - resumeFrom.current * 1000;
    const t = setInterval(() => {
      setElapsed((Date.now() - startedAt.current) / 1000);
    }, 1000);
    return () => clearInterval(t);
  }, [loaded, cdnIndex]);

  // Click guard: absorb accidental ad clicks for the first 3s
  useEffect(() => {
    setClickGuard(true);
    const t = setTimeout(() => setClickGuard(false), 3000);
    return () => clearTimeout(t);
  }, [cdnIndex]);

  // Load timeout → fallback
  useEffect(() => {
    if (allFailed) return;
    setLoaded(false);
    if (loadTimer.current) clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => {
      handleFail();
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (loadTimer.current) clearTimeout(loadTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cdnIndex, allFailed]);

  const handleFail = useCallback(() => {
    if (!activeCdn) return;
    markFail(activeCdn.id);
    if (cdnIndex + 1 < orderedSources.length) {
      const next = orderedSources[cdnIndex + 1];
      // 2s delay between CDN fallback switches per spec
      setTimeout(() => {
        setCdnIndex((i) => i + 1);
        pushToast(
          `Switched to ${next.name} — previous source timed out`,
          "info"
        );
      }, SWITCH_DELAY_MS);
    } else {
      setAllFailed(true);
    }
  }, [activeCdn, cdnIndex, orderedSources, markFail, pushToast]);

  const handleLoaded = useCallback(() => {
    if (loadTimer.current) clearTimeout(loadTimer.current);
    setLoaded(true);
    if (activeCdn) markSuccess(activeCdn.id);
  }, [activeCdn, markSuccess]);

  // Auto-hide overlay after 3s idle
  const pokeOverlay = useCallback(() => {
    setOverlayVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOverlayVisible(false), 3000);
  }, []);

  useEffect(() => {
    pokeOverlay();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pokeOverlay]);

  // Next episode trigger at 90% progress
  const progressPercent = Math.min(100, (elapsed / durationSeconds) * 100);
  useEffect(() => {
    if (
      mediaType === "tv" &&
      autoplayNext &&
      !nextDismissed &&
      progressPercent >= 90 &&
      episode != null
    ) {
      setShowNext(true);
    }
  }, [progressPercent, mediaType, autoplayNext, nextDismissed, episode]);

  const playNextEpisode = useCallback(() => {
    if (episode == null || season == null) return;
    setShowNext(false);
    setNextDismissed(false);
    setCdnIndex(0);
    navigate(`/play/tv/${tmdbId}/${season}/${episode + 1}`, {
      replace: true,
      state: { ...state, title },
    });
  }, [episode, season, navigate, tmdbId, state, title]);

  const healthDot = (id: string): "green" | "yellow" | "red" => {
    const outcomes = recent[id] ?? [];
    if (outcomes.length === 0) return "green";
    const rate = outcomes.filter(Boolean).length / outcomes.length;
    return rate >= 0.7 ? "green" : rate >= 0.4 ? "yellow" : "red";
  };

  const embedUrl = activeCdn
    ? buildEmbedUrl(activeCdn.id, tmdbId, mediaType, season, episode)
    : "";

  const retry = () => {
    setAllFailed(false);
    setCdnIndex(0);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black"
      onMouseMove={pokeOverlay}
      onTouchStart={pokeOverlay}
    >
      {/* Top bar */}
      <div
        className={cx(
          "absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 transition-opacity duration-300 md:px-6",
          overlayVisible ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="glass flex h-10 w-10 items-center justify-center rounded-full text-text-primary transition hover:border-white/20"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold text-text-primary">
            {title}
          </p>
          {mediaType === "tv" && season != null && (
            <p className="font-mono text-xs text-text-secondary">
              S{season} · E{episode}
              {state.episodeName ? ` — ${state.episodeName}` : ""}
            </p>
          )}
        </div>
        <CdnSelector
          sources={orderedSources}
          activeId={activeCdn?.id ?? ""}
          healthDot={healthDot}
          onSelect={(id) => {
            const idx = orderedSources.findIndex((s) => s.id === id);
            if (idx >= 0) {
              setAllFailed(false);
              setCdnIndex(idx);
            }
          }}
        />
      </div>

      {/* Video area */}
      <div className="relative flex h-full w-full items-center justify-center">
        {allFailed ? (
          <PlayerError onRetry={retry} onBack={() => navigate(-1)} />
        ) : (
          <div className="relative aspect-video max-h-screen w-full">
            {!loaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-base">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="font-mono text-xs text-text-muted">
                  Loading {activeCdn?.name}…
                </p>
              </div>
            )}
            <iframe
              key={`${activeCdn?.id}-${cdnIndex}-${tmdbId}-${season}-${episode}`}
              src={embedUrl}
              title={`${title} player`}
              className="h-full w-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
              referrerPolicy="no-referrer"
              onLoad={handleLoaded}
            />
            {/* Click guard for first 3s to absorb accidental ad clicks */}
            {clickGuard && loaded && (
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => setClickGuard(false)}
                aria-hidden
              />
            )}
          </div>
        )}

        <NextEpisode
          show={showNext}
          nextLabel={`S${season} E${(episode ?? 0) + 1}`}
          onPlayNext={playNextEpisode}
          onDismiss={() => {
            setShowNext(false);
            setNextDismissed(true);
          }}
        />
      </div>

      {/* Bottom overlay */}
      <div
        className={cx(
          "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10 transition-opacity duration-300 md:px-6",
          overlayVisible ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* Estimated progress */}
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 font-mono text-xs text-text-secondary">
            <span>
              {formatTimestamp(elapsed)} / {formatTimestamp(durationSeconds)}
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <Captions size={13} />
              Subtitles via player
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <MonitorPlay size={13} />
              {isPremium ? "Up to 4K" : "Up to 1080p"}
            </span>
          </div>
          <div className="flex gap-1.5">
            {orderedSources.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  setAllFailed(false);
                  setCdnIndex(i);
                }}
                className={cx(
                  "rounded-full px-2.5 py-1 font-mono text-[10px] font-medium transition",
                  i === cdnIndex
                    ? "bg-primary text-white"
                    : "glass text-text-secondary hover:text-text-primary"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
