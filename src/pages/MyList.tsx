import { useMemo, useState } from "react";
import { Bookmark } from "lucide-react";
import { useWatchlist } from "../hooks/useWatchlist";
import { RowCard } from "../components/rows/RowCard";
import { SkeletonCard } from "../components/ui/SkeletonCard";
import { cx } from "../lib/utils";
import type { TmdbMediaItem } from "../types";

type Sort = "added" | "alpha";

export function MyList() {
  const { items, loading } = useWatchlist();
  const [sort, setSort] = useState<Sort>("added");

  const sorted = useMemo(() => {
    if (sort === "alpha") {
      return [...items].sort((a, b) => a.title.localeCompare(b.title));
    }
    return items; // already sorted by added_date desc
  }, [items, sort]);

  return (
    <div className="page-enter mx-auto max-w-[1400px] px-6 pb-24 pt-24 md:pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="metadata-label mb-1 text-primary-hover">Yours</p>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-text-primary">
            My List
          </h1>
        </div>
        <div className="glass flex rounded-button p-1">
          {(
            [
              ["added", "Recently added"],
              ["alpha", "A–Z"],
            ] as [Sort, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={cx(
                "rounded-badge px-3.5 py-1.5 text-sm font-medium transition",
                sort === value
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} width={160} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <Bookmark size={40} className="text-text-muted" />
          <p className="text-lg font-medium text-text-secondary">
            Your list is empty
          </p>
          <p className="max-w-sm text-sm text-text-muted">
            Tap the + button on any title to save it here for later. Your list
            is stored locally on this device.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap gap-3">
          {sorted.map((w) => (
            <RowCard
              key={`${w.media_type}-${w.tmdb_id}`}
              item={
                {
                  id: w.tmdb_id,
                  title: w.media_type === "movie" ? w.title : undefined,
                  name: w.media_type === "tv" ? w.title : undefined,
                  poster_path: w.poster_path,
                  backdrop_path: null,
                  overview: "",
                  vote_average: 0,
                  vote_count: 0,
                  genres: [],
                  media_type: w.media_type,
                  release_date: "",
                  first_air_date: "",
                } as unknown as TmdbMediaItem
              }
              width={160}
              mediaType={w.media_type}
            />
          ))}
        </div>
      )}
    </div>
  );
}
