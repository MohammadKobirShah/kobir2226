import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { img, posterSrcSet } from "../../lib/tmdb";
import { useStore } from "../../stores/useStore";
import { RatingCircle } from "../ui/RatingCircle";
import { cx, getMediaType, getTitle, getYear } from "../../lib/utils";
import type { MediaType, TmdbMediaItem } from "../../types";

export function RowCard({
  item,
  width = 200,
  mediaType,
  revealIndex = 0,
}: {
  item: TmdbMediaItem;
  width?: number;
  mediaType?: MediaType;
  revealIndex?: number;
}) {
  const navigate = useNavigate();
  const openModal = useStore((s) => s.openModal);
  const type = mediaType ?? getMediaType(item);
  const title = getTitle(item);
  const year = getYear(item);
  const poster = img.poster(item.poster_path, "w342");

  return (
    <button
      data-reveal
      data-reveal-index={revealIndex}
      onClick={() => openModal(item.id, type)}
      className="row-card group relative shrink-0 overflow-hidden rounded-poster text-left shadow-card"
      style={{ width }}
    >
      <div className="overflow-hidden bg-elevated" style={{ aspectRatio: "2/3" }}>
        {poster ? (
          <img
            src={poster}
            srcSet={posterSrcSet(item.poster_path)}
            sizes={`${width}px`}
            alt={title}
            loading="lazy"
            decoding="async"
            width={width}
            height={Math.round(width * 1.5)}
            className="row-card-img h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-text-muted">
            {title}
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div
        className={cx(
          "absolute inset-0 flex flex-col justify-end p-3 opacity-0 transition-opacity duration-250 group-hover:opacity-100"
        )}
        style={{
          background:
            "linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.4) 55%, transparent 100%)",
        }}
      >
        <p className="card-title text-text-primary">{title}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-[11px] text-text-muted">{year}</span>
          {item.vote_average > 0 && (
            <RatingCircle vote={item.vote_average} size={30} />
          )}
        </div>
        <span
          onClick={(e) => {
            e.stopPropagation();
            navigate(
              type === "movie"
                ? `/play/movie/${item.id}`
                : `/play/tv/${item.id}/1/1`
            );
          }}
          className="mt-2 flex h-8 items-center justify-center gap-1.5 rounded-button bg-success text-xs font-semibold text-base transition hover:brightness-110"
        >
          <Play size={13} fill="currentColor" />
          Play
        </span>
      </div>
    </button>
  );
}
