// Shared TypeScript interfaces for VideasyPro

export type MediaType = "movie" | "tv";

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TmdbLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TmdbNetwork {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
}

export interface TmdbImage {
  file_path: string;
  aspect_ratio: number;
  height: number;
  width: number;
  vote_average: number;
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TmdbCredits {
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  genres: TmdbGenre[];
  imdb_id: string | null;
  tagline: string | null;
  status: string;
  budget: number;
  revenue: number;
  production_companies?: TmdbCompany[];
  spoken_languages?: TmdbLanguage[];
  media_type?: "movie";
  credits?: TmdbCredits | null;
  videos?: { results: TmdbVideo[] } | null;
  similar?: { results: TmdbMovie[] } | null;
  recommendations?: { results: TmdbMovie[] } | null;
  images?: {
    backdrops: TmdbImage[];
    posters: TmdbImage[];
    logos: TmdbImage[];
  } | null;
}

export interface TmdbSeasonSummary {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string | null;
  episode_count: number;
}

export interface TmdbTvShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date?: string;
  vote_average: number;
  vote_count: number;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  genres: TmdbGenre[];
  status: string;
  in_production: boolean;
  languages?: string[];
  origin_country?: string[];
  networks?: TmdbNetwork[];
  created_by?: TmdbPerson[];
  seasons: TmdbSeasonSummary[];
  media_type?: "tv";
  credits?: TmdbCredits | null;
  videos?: { results: TmdbVideo[] } | null;
  similar?: { results: TmdbTvShow[] } | null;
  recommendations?: { results: TmdbTvShow[] } | null;
  external_ids?: { tvdb_id: number | null; imdb_id: string | null } | null;
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

export interface TmdbSeason extends TmdbSeasonSummary {
  episodes: TmdbEpisode[] | null;
}

export type TmdbMediaItem = TmdbMovie | TmdbTvShow;

export interface TmdbSearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  profile_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  known_for_department?: string;
}

export interface TmdbListResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface CdnSource {
  id: string;
  name: string;
  buildUrl: (
    tmdbId: number,
    mediaType: MediaType,
    season?: number,
    episode?: number
  ) => string;
  healthScore: number;
  lastSuccess: string | null;
  lastFailure: string | null;
  consecutiveFailures: number;
}

export interface WatchProgressEntry {
  id?: number;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  season: number | null;
  episode: number | null;
  episode_name: string | null;
  progress_percent: number;
  position_seconds: number;
  duration_seconds: number;
  last_watched: string;
  cdn_used: string;
}

export interface WatchlistEntry {
  id?: number;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  added_date: string;
}

export interface RatingEntry {
  id?: number;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  stars: number; // 1-5
  rated_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar_color: string;
  is_premium: boolean;
  preferences: {
    accent_color: string;
    default_cdn: string;
    autoplay_next: boolean;
    subtitle_language: string;
    preferred_quality: "auto" | "720p" | "1080p" | "4k";
  };
}

export interface CdnHealthStats {
  name: string;
  success_count: number;
  fail_count: number;
  success_rate: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  kind: "info" | "success" | "error";
}
