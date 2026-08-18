import useSWR from "swr";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Play, Plus, Share2, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMovieDetails, getTvDetails, img } from "../../lib/tmdb";
import { useStore } from "../../stores/useStore";
import { useInWatchlist, useWatchlist } from "../../hooks/useWatchlist";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { getRating, setRating } from "../../lib/db";
import {
  cx,
  formatRuntime,
  getMediaType,
  getTitle,
  getYear,
} from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { RatingCircle } from "../ui/RatingCircle";
import { Skeleton } from "../ui/Skeleton";
import { SeasonSelector } from "./SeasonSelector";
import { EpisodeList } from "./EpisodeList";
import { CastRow } from "./CastRow";
import { RecommendationsRow } from "./RecommendationsRow";
import type { TmdbMediaItem, TmdbTvShow } from "../../types";

export function TitleModal() {
  const modal = useStore((s) => s.modal);
  const closeModal = useStore((s) => s.closeModal);
  const isMobile = useIsMobile();
  const touchStartY = useRef<number | null>(null);

  const { data, isLoading } = useSWR(
    modal ? ["details", modal.mediaType, modal.tmdbId] : null,
    async (): Promise<TmdbMediaItem> =>
      modal!.mediaType === "movie"
        ? getMovieDetails(modal!.tmdbId)
        : getTvDetails(modal!.tmdbId),
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const close = useCallback(() => closeModal(), [closeModal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (modal) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modal, close]);

  if (!modal) return null;

  return (
    <div
      className="fade-enter fixed inset-0 z-[80] flex items-end justify-center bg-base/70 backdrop-blur-md md:items-center md:p-6"
      onClick={close}
    >
      <div
        className={cx(
          "glass relative max-h-[92vh] w-full overflow-y-auto shadow-modal",
          isMobile
            ? "sheet-enter rounded-t-modal"
            : "modal-enter max-w-[900px] rounded-modal"
        )}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          if (
            touchStartY.current !== null &&
            e.changedTouches[0].clientY - touchStartY.current > 120 &&
            (e.currentTarget.scrollTop ?? 0) <= 0
          ) {
            close();
          }
          touchStartY.current = null;
        }}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="glass absolute right-4 top-4 z-20 rounded-full p-2 text-text-secondary transition hover:text-text-primary"
        >
          <X size={18} />
        </button>

        {isLoading || !data ? (
          <ModalSkeleton />
        ) : (
          <ModalBody item={data} mediaType={modal.mediaType} />
        )}
      </div>
    </div>
  );
}

function ModalSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-3 p-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

function ModalBody({
  item,
  mediaType,
}: {
  item: TmdbMediaItem;
  mediaType: "movie" | "tv";
}) {
  const navigate = useNavigate();
  const pushToast = useStore((s) => s.pushToast);
  const { toggle } = useWatchlist();
  const inList = useInWatchlist(item.id, mediaType);
  const [season, setSeason] = useState(1);
  const [myRating, setMyRating] = useState(0);
  const [ratingOpen, setRatingOpen] = useState(false);

  const title = getTitle(item);
  const year = getYear(item);
  const backdrop = img.backdrop(item.backdrop_path, "w1280");
  const isTv = mediaType === "tv";
  const tv = isTv ? (item as TmdbTvShow) : null;
  const runtime = isTv
    ? (tv?.episode_run_time?.[0] ?? null)
    : ((item as { runtime?: number | null }).runtime ?? null);
  const genres = item.genres ?? [];
  const cast = item.credits?.cast ?? [];
  const recs =
    item.recommendations?.results?.length
      ? item.recommendations.results
      : (item.similar?.results ?? []);

  useEffect(() => {
    void getRating(item.id, mediaType).then((r) => setMyRating(r?.stars ?? 0));
  }, [item.id, mediaType]);

  const play = () => {
    navigate(
      isTv ? `/play/tv/${item.id}/${season}/1` : `/play/movie/${item.id}`,
      {
        state: {
          title,
          posterPath: item.poster_path,
          backdropPath: item.backdrop_path,
          runtime,
        },
      }
    );
  };

  const share = async () => {
    const url = `${location.origin}/${mediaType}/${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      pushToast("Link copied to clipboard", "success");
    } catch {
      pushToast("Couldn't copy link", "error");
    }
  };

  const rate = async (stars: number) => {
    setMyRating(stars);
    setRatingOpen(false);
    await setRating({
      tmdb_id: item.id,
      media_type: mediaType,
      title,
      stars,
      rated_at: new Date().toISOString(),
    });
    pushToast(`Rated ${title} ${stars}/5`, "success");
  };

  return (
    <div>
      {/* Hero backdrop */}
      <div className="relative aspect-video w-full overflow-hidden">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            className="h-full w-full object-cover"
            decoding="async"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, #12121A 0%, rgba(18,18,26,0.3) 50%, transparent 100%)",
          }}
        />
      </div>

      <div className="px-6 pb-8 md:px-10">
        {/* Title block */}
        <h2 className="font-heading text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
          {title}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {item.vote_average > 0 && <RatingCircle vote={item.vote_average} />}
          <span className="metadata-label text-text-secondary">{year}</span>
          {runtime && (
            <span className="metadata-label text-text-secondary">
              {formatRuntime(runtime)}
            </span>
          )}
          {isTv && tv && (
            <span className="metadata-label text-text-secondary">
              {tv.number_of_seasons} Season{tv.number_of_seasons === 1 ? "" : "s"}
            </span>
          )}
          <Badge variant="hd">HD</Badge>
          {genres.slice(0, 3).map((g) => (
            <span key={g.id} className="metadata-label text-text-muted">
              {g.name}
            </span>
          ))}
        </div>
        {item.overview && (
          <p className="mt-4 max-w-[640px] text-[0.95rem] leading-relaxed text-text-secondary">
            {item.overview}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={play}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-button bg-success px-6 font-semibold text-base transition hover:brightness-110 md:flex-none"
          >
            <Play size={20} fill="currentColor" />
            Play
          </button>
          <button
            onClick={() =>
              void toggle({
                tmdb_id: item.id,
                media_type: mediaType,
                title,
                poster_path: item.poster_path,
              })
            }
            className="glass flex h-12 items-center gap-2 rounded-button px-5 font-medium text-text-primary transition hover:border-white/20"
          >
            {inList ? <Check size={18} className="text-success" /> : <Plus size={18} />}
            {inList ? "In My List" : "My List"}
          </button>
          <div className="relative">
            <button
              onClick={() => setRatingOpen((v) => !v)}
              className="glass flex h-12 items-center gap-2 rounded-button px-5 font-medium text-text-primary transition hover:border-white/20"
            >
              <Star
                size={18}
                className={myRating > 0 ? "fill-premium text-premium" : ""}
              />
              {myRating > 0 ? `${myRating}/5` : "Rate"}
            </button>
            {ratingOpen && (
              <div className="glass absolute left-0 top-14 z-10 flex gap-1 rounded-button p-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => void rate(s)}
                    className="rounded-badge p-1.5 transition hover:bg-white/10"
                    aria-label={`Rate ${s} stars`}
                  >
                    <Star
                      size={20}
                      className={
                        s <= myRating
                          ? "fill-premium text-premium"
                          : "text-text-secondary"
                      }
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => void share()}
            aria-label="Share"
            className="glass flex h-12 w-12 items-center justify-center rounded-button text-text-primary transition hover:border-white/20"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* TV: seasons + episodes */}
        {isTv && tv && (
          <div className="mt-8">
            <h3 className="section-title mb-4 text-text-primary">Episodes</h3>
            <SeasonSelector
              seasons={tv.seasons ?? []}
              active={season}
              onChange={setSeason}
            />
            <EpisodeList
              tvId={item.id}
              season={season}
              showTitle={title}
              posterPath={item.poster_path}
              backdropPath={item.backdrop_path}
            />
          </div>
        )}

        <CastRow cast={cast} />
        <RecommendationsRow
          items={recs as TmdbMediaItem[]}
          mediaType={mediaType}
        />
      </div>
    </div>
  );
}
