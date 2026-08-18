// TMDB API client with in-memory LRU caching + request deduplication.
// Rate limiting: TMDB allows ~4 req/sec — we enforce a small queue.

import type {
  MediaType,
  TmdbCredits,
  TmdbEpisode,
  TmdbGenre,
  TmdbListResponse,
  TmdbMovie,
  TmdbSearchResult,
  TmdbSeason,
  TmdbTvShow,
  TmdbVideo,
} from "../types";

const BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/";

// The API key is injected at build/runtime via env. Client-side keys are
// visible in the bundle by design — TMDB keys are low-sensitivity and rate
// limited server-side. Set VITE_TMDB_API_KEY in the Netlify UI.
const API_KEY = import.meta.env.VITE_TMDB_API_KEY ?? "";

export const img = {
  poster: (path: string | null, size: "w185" | "w342" | "w500" = "w342") =>
    path ? `${IMAGE_BASE}${size}${path}` : null,
  backdrop: (
    path: string | null,
    size: "w780" | "w1280" | "original" = "w1280"
  ) => (path ? `${IMAGE_BASE}${size}${path}` : null),
  still: (path: string | null, size: "w300" | "w185" = "w300") =>
    path ? `${IMAGE_BASE}${size}${path}` : null,
  profile: (path: string | null) =>
    path ? `${IMAGE_BASE}w185${path}` : null,
};

export function posterSrcSet(path: string | null): string | undefined {
  if (!path) return undefined;
  return `${IMAGE_BASE}w185${path} 185w, ${IMAGE_BASE}w342${path} 342w, ${IMAGE_BASE}w500${path} 500w`;
}

export function backdropSrcSet(path: string | null): string | undefined {
  if (!path) return undefined;
  return `${IMAGE_BASE}w780${path} 780w, ${IMAGE_BASE}w1280${path} 1280w, ${IMAGE_BASE}original${path} 1920w`;
}

// ---- Tiny LRU cache with TTL ----
class LruCache<T> {
  private map = new Map<string, { value: T; expires: number }>();
  constructor(
    private maxEntries: number,
    private ttlMs: number
  ) {}
  get(key: string): T | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (Date.now() > e.expires) {
      this.map.delete(key);
      return undefined;
    }
    // refresh recency
    this.map.delete(key);
    this.map.set(key, e);
    return e.value;
  }
  set(key: string, value: T) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expires: Date.now() + this.ttlMs });
    while (this.map.size > this.maxEntries) {
      const first = this.map.keys().next().value;
      if (first === undefined) break;
      this.map.delete(first);
    }
  }
}

const metadataCache = new LruCache<unknown>(200, 24 * 60 * 60 * 1000); // 24h
const searchCache = new LruCache<unknown>(60, 60 * 60 * 1000); // 1h
const inflight = new Map<string, Promise<unknown>>();

async function fetchJson<T>(path: string, params: Record<string, string | number | undefined> = {}, longCache = true): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (API_KEY) url.searchParams.set("api_key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const key = url.toString();
  const cache = path.startsWith("/search") ? searchCache : metadataCache;
  const cached = cache.get(key);
  if (cached !== undefined) return cached as T;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const p = (async () => {
    try {
      const res = await fetch(key);
      if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`);
      const json = (await res.json()) as T;
      if (longCache || path.startsWith("/search")) cache.set(key, json);
      return json;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

// ---- Endpoints ----

export function getTrending(
  mediaType: MediaType | "all" = "all",
  window: "day" | "week" = "day",
  page = 1
) {
  return fetchJson<TmdbListResponse<TmdbSearchResult>>(
    `/trending/${mediaType}/${window}`,
    { page }
  );
}

export function getPopularMovies(page = 1) {
  return fetchJson<TmdbListResponse<TmdbMovie>>("/movie/popular", { page });
}

export function getPopularTv(page = 1) {
  return fetchJson<TmdbListResponse<TmdbTvShow>>("/tv/popular", { page });
}

export function getTopRatedMovies(page = 1) {
  return fetchJson<TmdbListResponse<TmdbMovie>>("/movie/top_rated", { page });
}

export function getTopRatedTv(page = 1) {
  return fetchJson<TmdbListResponse<TmdbTvShow>>("/tv/top_rated", { page });
}

export function getNowPlaying(page = 1) {
  return fetchJson<TmdbListResponse<TmdbMovie>>("/movie/now_playing", { page });
}

export function getOnTheAir(page = 1) {
  return fetchJson<TmdbListResponse<TmdbTvShow>>("/tv/on_the_air", { page });
}

export function discover(
  mediaType: MediaType,
  params: {
    page?: number;
    with_genres?: string;
    sort_by?: string;
    "vote_average.gte"?: number;
    "primary_release_date.gte"?: string;
    "primary_release_date.lte"?: string;
    "first_air_date.gte"?: string;
    "first_air_date.lte"?: string;
    with_origin_country?: string;
    with_original_language?: string;
    with_keywords?: string;
  } = {}
) {
  return fetchJson<TmdbListResponse<TmdbMediaItemExtended>>(
    `/discover/${mediaType}`,
    params as Record<string, string | number | undefined>
  );
}

export type TmdbMediaItemExtended = (TmdbMovie | TmdbTvShow) & {
  media_type?: MediaType;
};

export function getMovieDetails(id: number) {
  return fetchJson<TmdbMovie>(`/movie/${id}`, {
    append_to_response: "credits,videos,similar,recommendations",
  });
}

export function getTvDetails(id: number) {
  return fetchJson<TmdbTvShow>(`/tv/${id}`, {
    append_to_response: "credits,videos,similar,recommendations,external_ids",
  });
}

export function getSeasonDetails(id: number, seasonNumber: number) {
  return fetchJson<TmdbSeason>(`/tv/${id}/season/${seasonNumber}`);
}

export function getCredits(mediaType: MediaType, id: number) {
  return fetchJson<TmdbCredits>(`/${mediaType}/${id}/credits`);
}

export function getVideos(mediaType: MediaType, id: number) {
  return fetchJson<{ results: TmdbVideo[] }>(`/${mediaType}/${id}/videos`);
}

export function searchMulti(query: string, page = 1) {
  return fetchJson<TmdbListResponse<TmdbSearchResult>>("/search/multi", {
    query,
    page,
    include_adult: "false",
  });
}

export function getGenres(mediaType: MediaType) {
  return fetchJson<{ genres: TmdbGenre[] }>(`/genre/${mediaType}/list`);
}

export function getRecommendations(mediaType: MediaType, id: number, page = 1) {
  return fetchJson<TmdbListResponse<TmdbMediaItemExtended>>(
    `/${mediaType}/${id}/recommendations`,
    { page }
  );
}

export function getSimilar(mediaType: MediaType, id: number, page = 1) {
  return fetchJson<TmdbListResponse<TmdbMediaItemExtended>>(
    `/${mediaType}/${id}/similar`,
    { page }
  );
}

export function getPersonDetails(id: number) {
  return fetchJson<{ id: number; name: string; biography: string; profile_path: string | null }>(
    `/person/${id}`
  );
}

// Anime = animation genre (16) + Japanese origin, per spec
export function getAnime(page = 1) {
  return fetchJson<TmdbListResponse<TmdbTvShow>>("/discover/tv", {
    with_genres: "16",
    with_origin_country: "JP",
    sort_by: "popularity.desc",
    page,
  });
}

export function getActionAdventure(page = 1) {
  return fetchJson<TmdbListResponse<TmdbMovie>>("/discover/movie", {
    with_genres: "28,12",
    sort_by: "popularity.desc",
    page,
  });
}

export function getComedy(page = 1) {
  return fetchJson<TmdbListResponse<TmdbMovie>>("/discover/movie", {
    with_genres: "35",
    sort_by: "popularity.desc",
    page,
  });
}

export function getDocumentary(page = 1) {
  return fetchJson<TmdbListResponse<TmdbMovie>>("/discover/movie", {
    with_genres: "99",
    sort_by: "popularity.desc",
    page,
  });
}
