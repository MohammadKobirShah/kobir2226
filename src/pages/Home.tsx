import useSWR from "swr";
import { useCallback } from "react";
import { HeroCarousel } from "../components/hero/HeroCarousel";
import { ContentRow } from "../components/rows/ContentRow";
import { ContinueWatchingCard } from "../components/rows/ContinueWatchingCard";
import { SkeletonRow } from "../components/ui/SkeletonRow";
import { useContinueWatching } from "../hooks/useWatchProgress";
import { useWatchlist } from "../hooks/useWatchlist";
import { usePagedRow } from "../hooks/useInfiniteScroll";
import {
  getActionAdventure,
  getAnime,
  getComedy,
  getDocumentary,
  getNowPlaying,
  getPopularMovies,
  getPopularTv,
  getTopRatedMovies,
  getTrending,
} from "../lib/tmdb";
import type { TmdbMediaItem, TmdbSearchResult } from "../types";

function toMediaItems(results: TmdbSearchResult[]): TmdbMediaItem[] {
  return results.filter(
    (r): r is TmdbSearchResult & { media_type: "movie" | "tv" } =>
      r.media_type === "movie" || r.media_type === "tv"
  ) as unknown as TmdbMediaItem[];
}

export function Home() {
  const { items: continueWatching, loading: cwLoading, remove } =
    useContinueWatching();
  const { items: watchlist } = useWatchlist();

  const trending = usePagedRow(
    useCallback(async () => {
      const res = await getTrending("all", "week");
      return { results: toMediaItems(res.results), total_pages: res.total_pages };
    }, [])
  );
  const popularMovies = usePagedRow(
    useCallback((p: number) => getPopularMovies(p), [])
  );
  const popularTv = usePagedRow(useCallback((p: number) => getPopularTv(p), []));
  const topRated = usePagedRow(
    useCallback((p: number) => getTopRatedMovies(p), [])
  );
  const newReleases = usePagedRow(
    useCallback((p: number) => getNowPlaying(p), [])
  );
  const action = usePagedRow(
    useCallback((p: number) => getActionAdventure(p), [])
  );
  const comedy = usePagedRow(useCallback((p: number) => getComedy(p), []));
  const documentary = usePagedRow(
    useCallback((p: number) => getDocumentary(p), [])
  );
  const anime = usePagedRow(useCallback((p: number) => getAnime(p), []));

  return (
    <div className="page-enter pb-24 md:pb-16">
      <HeroCarousel />

      <div className="relative z-10 -mt-10 md:-mt-16">
        {/* Continue Watching */}
        {cwLoading ? (
          <SkeletonRow width={280} count={4} />
        ) : (
          continueWatching.length > 0 && (
            <section className="mb-10">
              <div className="mx-auto mb-4 max-w-[1400px] px-6">
                <p className="metadata-label mb-1 text-success">Resume</p>
                <h2 className="section-title text-text-primary">
                  Continue Watching
                </h2>
              </div>
              <div className="no-scrollbar mx-auto flex max-w-[1400px] gap-3 overflow-x-auto px-6 pb-2">
                {continueWatching.map((entry) => (
                  <ContinueWatchingCard
                    key={`${entry.tmdb_id}-${entry.season}-${entry.episode}`}
                    entry={entry}
                    onRemove={() => void remove(entry)}
                  />
                ))}
              </div>
            </section>
          )
        )}

        <ContentRow
          eyebrow="Trending"
          title="Trending Now"
          items={trending.items}
          loading={trending.loading}
          hasMore={trending.hasMore}
          onLoadMore={trending.loadMore}
        />
        <ContentRow
          eyebrow="Movies"
          title="Popular Movies"
          items={popularMovies.items}
          loading={popularMovies.loading}
          mediaType="movie"
          seeAllTo="/movies"
          hasMore={popularMovies.hasMore}
          onLoadMore={popularMovies.loadMore}
        />
        <ContentRow
          eyebrow="Series"
          title="Popular TV Shows"
          items={popularTv.items}
          loading={popularTv.loading}
          mediaType="tv"
          seeAllTo="/tv"
          hasMore={popularTv.hasMore}
          onLoadMore={popularTv.loadMore}
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
          eyebrow="Fresh"
          title="New Releases"
          items={newReleases.items}
          loading={newReleases.loading}
          mediaType="movie"
          hasMore={newReleases.hasMore}
          onLoadMore={newReleases.loadMore}
        />
        <ContentRow
          eyebrow="Genre"
          title="Action & Adventure"
          items={action.items}
          loading={action.loading}
          mediaType="movie"
          seeAllTo="/browse/movie/28,12"
          hasMore={action.hasMore}
          onLoadMore={action.loadMore}
        />
        <ContentRow
          eyebrow="Genre"
          title="Comedy"
          items={comedy.items}
          loading={comedy.loading}
          mediaType="movie"
          seeAllTo="/browse/movie/35"
          hasMore={comedy.hasMore}
          onLoadMore={comedy.loadMore}
        />
        <ContentRow
          eyebrow="Genre"
          title="Documentary"
          items={documentary.items}
          loading={documentary.loading}
          mediaType="movie"
          seeAllTo="/browse/movie/99"
          hasMore={documentary.hasMore}
          onLoadMore={documentary.loadMore}
        />
        <ContentRow
          eyebrow="Japan"
          title="Anime"
          items={anime.items}
          loading={anime.loading}
          mediaType="tv"
          seeAllTo="/anime"
          hasMore={anime.hasMore}
          onLoadMore={anime.loadMore}
        />

        {/* My List */}
        {watchlist.length > 0 && (
          <ContentRow
            eyebrow="Yours"
            title="My List"
            items={watchlist.map((w) => ({
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
              original_title: w.title,
              original_name: w.title,
              status: "",
              number_of_seasons: 0,
              number_of_episodes: 0,
              episode_run_time: [],
              seasons: [],
              in_production: false,
              runtime: null,
              imdb_id: null,
              tagline: null,
              budget: 0,
              revenue: 0,
            })) as unknown as TmdbMediaItem[]}
            seeAllTo="/my-list"
          />
        )}
      </div>
    </div>
  );
}
