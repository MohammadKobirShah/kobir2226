import { useCallback } from "react";
import { ContentRow } from "../components/rows/ContentRow";
import { usePagedRow } from "../hooks/useInfiniteScroll";
import { discover, getAnime } from "../lib/tmdb";
import type { TmdbMediaItem } from "../types";

export function Anime() {
  const popular = usePagedRow(useCallback((p: number) => getAnime(p), []));
  const topRated = usePagedRow(
    useCallback(
      (p: number) =>
        discover("tv", {
          with_genres: "16",
          with_origin_country: "JP",
          sort_by: "vote_average.desc",
          "vote_average.gte": 7,
          page: p,
        }) as Promise<{ results: TmdbMediaItem[]; total_pages: number }>,
      []
    )
  );
  const newAnime = usePagedRow(
    useCallback(
      (p: number) =>
        discover("tv", {
          with_genres: "16",
          with_origin_country: "JP",
          sort_by: "first_air_date.desc",
          page: p,
        }) as Promise<{ results: TmdbMediaItem[]; total_pages: number }>,
      []
    )
  );

  return (
    <div className="page-enter mx-auto max-w-[1400px] pb-24 pt-24 md:pb-16">
      <div className="px-6">
        <p className="metadata-label mb-1 text-primary-hover">Japan</p>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-text-primary">
          Anime
        </h1>
      </div>
      <div className="mt-8">
        <ContentRow
          eyebrow="Most watched"
          title="Popular Anime"
          items={popular.items}
          loading={popular.loading}
          mediaType="tv"
          hasMore={popular.hasMore}
          onLoadMore={popular.loadMore}
        />
        <ContentRow
          eyebrow="Critics"
          title="Top Rated Anime"
          items={topRated.items}
          loading={topRated.loading}
          mediaType="tv"
          hasMore={topRated.hasMore}
          onLoadMore={topRated.loadMore}
        />
        <ContentRow
          eyebrow="Fresh"
          title="New & Airing"
          items={newAnime.items}
          loading={newAnime.loading}
          mediaType="tv"
          hasMore={newAnime.hasMore}
          onLoadMore={newAnime.loadMore}
        />
      </div>
    </div>
  );
}
