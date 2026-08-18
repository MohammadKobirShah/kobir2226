import { useCallback } from "react";
import { ContentRow } from "../components/rows/ContentRow";
import { usePagedRow } from "../hooks/useInfiniteScroll";
import {
  getNowPlaying,
  getPopularMovies,
  getTopRatedMovies,
  getTrending,
} from "../lib/tmdb";
import type { TmdbMediaItem, TmdbSearchResult } from "../types";

export function Movies() {
  const trending = usePagedRow(
    useCallback(async (p: number) => {
      const res = await getTrending("movie", "week", p);
      return {
        results: res.results as unknown as TmdbMediaItem[],
        total_pages: res.total_pages,
      };
    }, [])
  );
  const popular = usePagedRow(useCallback((p: number) => getPopularMovies(p), []));
  const topRated = usePagedRow(
    useCallback((p: number) => getTopRatedMovies(p), [])
  );
  const nowPlaying = usePagedRow(
    useCallback((p: number) => getNowPlaying(p), [])
  );

  return (
    <div className="page-enter mx-auto max-w-[1400px] px-0 pb-24 pt-24 md:pb-16">
      <div className="px-6">
        <p className="metadata-label mb-1 text-primary-hover">Catalog</p>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-text-primary">
          Movies
        </h1>
      </div>
      <div className="mt-8">
        <ContentRow
          eyebrow="This week"
          title="Trending Movies"
          items={trending.items}
          loading={trending.loading}
          mediaType="movie"
          hasMore={trending.hasMore}
          onLoadMore={trending.loadMore}
        />
        <ContentRow
          eyebrow="All time"
          title="Popular"
          items={popular.items}
          loading={popular.loading}
          mediaType="movie"
          hasMore={popular.hasMore}
          onLoadMore={popular.loadMore}
        />
        <ContentRow
          eyebrow="Critics"
          title="Top Rated"
          items={topRated.items}
          loading={topRated.loading}
          mediaType="movie"
          hasMore={topRated.hasMore}
          onLoadMore={topRated.loadMore}
        />
        <ContentRow
          eyebrow="In theaters"
          title="Now Playing"
          items={nowPlaying.items}
          loading={nowPlaying.loading}
          mediaType="movie"
          hasMore={nowPlaying.hasMore}
          onLoadMore={nowPlaying.loadMore}
        />
      </div>
    </div>
  );
}
