import { useCallback } from "react";
import { ContentRow } from "../components/rows/ContentRow";
import { usePagedRow } from "../hooks/useInfiniteScroll";
import {
  getOnTheAir,
  getPopularTv,
  getTopRatedTv,
  getTrending,
} from "../lib/tmdb";
import type { TmdbMediaItem } from "../types";

export function TVShows() {
  const trending = usePagedRow(
    useCallback(async (p: number) => {
      const res = await getTrending("tv", "week", p);
      return {
        results: res.results as unknown as TmdbMediaItem[],
        total_pages: res.total_pages,
      };
    }, [])
  );
  const popular = usePagedRow(useCallback((p: number) => getPopularTv(p), []));
  const topRated = usePagedRow(useCallback((p: number) => getTopRatedTv(p), []));
  const onTheAir = usePagedRow(useCallback((p: number) => getOnTheAir(p), []));

  return (
    <div className="page-enter mx-auto max-w-[1400px] pb-24 pt-24 md:pb-16">
      <div className="px-6">
        <p className="metadata-label mb-1 text-primary-hover">Catalog</p>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-text-primary">
          TV Shows
        </h1>
      </div>
      <div className="mt-8">
        <ContentRow
          eyebrow="This week"
          title="Trending Series"
          items={trending.items}
          loading={trending.loading}
          mediaType="tv"
          hasMore={trending.hasMore}
          onLoadMore={trending.loadMore}
        />
        <ContentRow
          eyebrow="All time"
          title="Popular"
          items={popular.items}
          loading={popular.loading}
          mediaType="tv"
          hasMore={popular.hasMore}
          onLoadMore={popular.loadMore}
        />
        <ContentRow
          eyebrow="Critics"
          title="Top Rated"
          items={topRated.items}
          loading={topRated.loading}
          mediaType="tv"
          hasMore={topRated.hasMore}
          onLoadMore={topRated.loadMore}
        />
        <ContentRow
          eyebrow="Broadcasting"
          title="Currently On The Air"
          items={onTheAir.items}
          loading={onTheAir.loading}
          mediaType="tv"
          hasMore={onTheAir.hasMore}
          onLoadMore={onTheAir.loadMore}
        />
      </div>
    </div>
  );
}
