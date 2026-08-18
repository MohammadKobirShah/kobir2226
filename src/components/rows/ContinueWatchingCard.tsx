import { Play, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { img } from "../../lib/tmdb";
import { formatTimestamp } from "../../lib/utils";
import type { WatchProgressEntry } from "../../types";

export function ContinueWatchingCard({
  entry,
  width = 280,
  onRemove,
}: {
  entry: WatchProgressEntry;
  width?: number;
  onRemove: () => void;
}) {
  const navigate = useNavigate();
  const backdrop = img.backdrop(entry.backdrop_path, "w780");
  const poster = img.poster(entry.poster_path, "w342");
  const image = backdrop ?? poster;

  const resume = () => {
    navigate(
      entry.media_type === "movie"
        ? `/play/movie/${entry.tmdb_id}`
        : `/play/tv/${entry.tmdb_id}/${entry.season ?? 1}/${entry.episode ?? 1}`
    );
  };

  return (
    <div
      className="row-card group relative shrink-0 overflow-hidden rounded-card text-left shadow-card"
      style={{ width }}
    >
      <button onClick={resume} className="block w-full">
        <div className="overflow-hidden bg-elevated" style={{ aspectRatio: "16/9" }}>
          {image ? (
            <img
              src={image}
              alt={entry.title}
              loading="lazy"
              decoding="async"
              width={width}
              height={Math.round((width * 9) / 16)}
              className="row-card-img h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
              {entry.title}
            </div>
          )}
        </div>
        <div
          className="absolute inset-0 flex flex-col justify-end p-3"
          style={{
            background:
              "linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 60%)",
          }}
        >
          <p className="card-title text-text-primary">{entry.title}</p>
          <p className="mt-0.5 font-mono text-[11px] text-text-secondary">
            {entry.media_type === "tv" && entry.season != null
              ? `S${entry.season} E${entry.episode}${entry.episode_name ? ` — ${entry.episode_name}` : ""} · `
              : ""}
            {formatTimestamp(entry.position_seconds)} left of{" "}
            {formatTimestamp(entry.duration_seconds)}
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-success"
              style={{ width: `${entry.progress_percent}%` }}
            />
          </div>
        </div>
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-base shadow-lg">
            <Play size={20} fill="currentColor" />
          </span>
        </span>
      </button>
      <button
        onClick={onRemove}
        aria-label="Remove from Continue Watching"
        className="glass absolute right-2 top-2 rounded-full p-1.5 text-text-secondary opacity-0 transition hover:text-text-primary group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}
