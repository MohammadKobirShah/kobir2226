import useSWR from "swr";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSeasonDetails, img } from "../../lib/tmdb";
import { formatRuntime, truncate } from "../../lib/utils";
import { Skeleton } from "../ui/Skeleton";
import type { TmdbEpisode } from "../../types";

export function EpisodeList({
  tvId,
  season,
  showTitle,
  posterPath,
  backdropPath,
}: {
  tvId: number;
  season: number;
  showTitle: string;
  posterPath: string | null;
  backdropPath: string | null;
}) {
  const { data, isLoading } = useSWR(
    ["season", tvId, season],
    () => getSeasonDetails(tvId, season),
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-[90px] w-40 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const episodes = data?.episodes ?? [];
  if (episodes.length === 0) {
    return (
      <p className="mt-4 text-sm text-text-muted">
        No episode information available for this season yet.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-1">
      {episodes.map((ep) => (
        <EpisodeRow
          key={ep.id}
          ep={ep}
          onPlay={() =>
            navigate(`/play/tv/${tvId}/${season}/${ep.episode_number}`, {
              state: {
                title: showTitle,
                episodeName: ep.name,
                posterPath,
                backdropPath,
                runtime: ep.runtime,
              },
            })
          }
        />
      ))}
    </div>
  );
}

function EpisodeRow({ ep, onPlay }: { ep: TmdbEpisode; onPlay: () => void }) {
  const still = img.still(ep.still_path);
  return (
    <button
      onClick={onPlay}
      className="group flex w-full items-center gap-4 rounded-card p-2 text-left transition hover:bg-elevated"
    >
      <span className="w-6 shrink-0 text-center font-mono text-sm text-text-muted">
        {ep.episode_number}
      </span>
      <div className="relative h-[90px] w-40 shrink-0 overflow-hidden rounded-badge bg-surface">
        {still ? (
          <img
            src={still}
            alt=""
            loading="lazy"
            decoding="async"
            width={160}
            height={90}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-base/40 opacity-0 transition group-hover:opacity-100">
          <Play size={22} className="text-success" fill="currentColor" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-semibold text-text-primary">
            {ep.name}
          </p>
          <span className="shrink-0 font-mono text-xs text-text-muted">
            {formatRuntime(ep.runtime)}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          {truncate(ep.overview || "No synopsis available.", 120)}
        </p>
      </div>
    </button>
  );
}
