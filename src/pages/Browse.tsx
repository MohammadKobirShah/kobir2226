import useSWR from "swr";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { discover, getGenres } from "../lib/tmdb";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { RowCard } from "../components/rows/RowCard";
import { SkeletonCard } from "../components/ui/SkeletonCard";
import { PremiumLock } from "../components/ui/PremiumLock";
import { cx } from "../lib/utils";
import type { MediaType, TmdbMediaItem } from "../types";

// Genre/discover page with infinite scroll. Advanced filters (year range,
// rating threshold, sort) are a premium feature.
export function Browse() {
  const params = useParams<{ mediaType?: string; genres?: string }>();
  const mediaType: MediaType = params.mediaType === "tv" ? "tv" : "movie";
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    params.genres ? params.genres.split(",") : []
  );
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const { data: genreData } = useSWR(["genres", mediaType], () =>
    getGenres(mediaType)
  );

  const [items, setItems] = useState<TmdbMediaItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const queryParams = useMemo(
    () => ({
      with_genres: selectedGenres.join(",") || undefined,
      sort_by: sortBy,
      "vote_average.gte": minRating > 0 ? minRating : undefined,
      "primary_release_date.gte":
        mediaType === "movie" && yearFrom ? `${yearFrom}-01-01` : undefined,
      "primary_release_date.lte":
        mediaType === "movie" && yearTo ? `${yearTo}-12-31` : undefined,
      "first_air_date.gte":
        mediaType === "tv" && yearFrom ? `${yearFrom}-01-01` : undefined,
      "first_air_date.lte":
        mediaType === "tv" && yearTo ? `${yearTo}-12-31` : undefined,
    }),
    [selectedGenres, sortBy, minRating, yearFrom, yearTo, mediaType]
  );

  const fetchPage = useCallback(
    async (p: number) => {
      const res = await discover(mediaType, { ...queryParams, page: p });
      return res;
    },
    [mediaType, queryParams]
  );

  // Reset + load first page when filters change
  useMemo(() => {
    setLoading(true);
    setItems([]);
    setPage(0);
    fetchPage(1).then((res) => {
      setItems(res.results as TmdbMediaItem[]);
      setPage(1);
      setTotalPages(Math.min(res.total_pages, 20));
      setLoading(false);
    });
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (page >= totalPages) return;
    fetchPage(page + 1).then((res) => {
      setItems((prev) => [...prev, ...(res.results as TmdbMediaItem[])]);
      setPage((p) => p + 1);
    });
  }, [fetchPage, page, totalPages]);

  const sentinelRef = useInfiniteScroll(loadMore, page < totalPages);

  const toggleGenre = (id: string) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  return (
    <div className="page-enter mx-auto max-w-[1400px] px-6 pb-24 pt-24 md:pb-16">
      <p className="metadata-label mb-1 text-primary-hover">Discover</p>
      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-text-primary">
        Browse {mediaType === "movie" ? "Movies" : "TV Shows"}
      </h1>

      {/* Genre pills */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
        {(genreData?.genres ?? []).map((g) => (
          <button
            key={g.id}
            onClick={() => toggleGenre(String(g.id))}
            className={cx(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
              selectedGenres.includes(String(g.id))
                ? "bg-primary text-white"
                : "glass text-text-secondary hover:text-text-primary"
            )}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Advanced filters — premium */}
      <div className="mt-6">
        <PremiumLock feature="Advanced search filters — year range, rating threshold, and custom sorting">
          <div className="glass flex flex-wrap items-center gap-4 rounded-card p-4">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              Min rating
              <input
                type="range"
                min={0}
                max={9}
                step={1}
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="accent-primary"
              />
              <span className="w-6 font-mono text-xs text-text-primary">
                {minRating > 0 ? `${minRating}+` : "Any"}
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              Year
              <input
                type="number"
                placeholder="From"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                className="w-20 rounded-input border border-glass-border bg-base px-2 py-1 text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary"
              />
              –
              <input
                type="number"
                placeholder="To"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                className="w-20 rounded-input border border-glass-border bg-base px-2 py-1 text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              Sort
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-input border border-glass-border bg-base px-2 py-1 text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="popularity.desc">Most popular</option>
                <option value="vote_average.desc">Highest rated</option>
                <option value="primary_release_date.desc">Newest</option>
                <option value="primary_release_date.asc">Oldest</option>
                <option value="revenue.desc">Highest grossing</option>
              </select>
            </label>
          </div>
        </PremiumLock>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} width={180} />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {items.map((item) => (
              <RowCard
                key={item.id}
                item={item}
                width={180}
                mediaType={mediaType}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="h-10" />
          {page < totalPages && (
            <p className="mt-4 text-center font-mono text-xs text-text-muted">
              Loading more…
            </p>
          )}
        </>
      )}
    </div>
  );
}
