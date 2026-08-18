// Videasy + fallback CDN URL builders.
// Order matters: index 0 is the primary source. Free tier uses the first 4,
// premium unlocks the full 6-CDN fallback chain.

import type { CdnSource, MediaType } from "../types";

export const CDN_SOURCES: CdnSource[] = [
  {
    id: "videasy",
    name: "Videasy",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://videasy.to/movie/${id}`
        : `https://videasy.to/tv/${id}/${s ?? 1}/${e ?? 1}`,
    healthScore: 1,
    lastSuccess: null,
    lastFailure: null,
    consecutiveFailures: 0,
  },
  {
    id: "vidlink",
    name: "Vidlink",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidlink.pro/movie/${id}`
        : `https://vidlink.pro/tv/${id}/${s ?? 1}/${e ?? 1}`,
    healthScore: 1,
    lastSuccess: null,
    lastFailure: null,
    consecutiveFailures: 0,
  },
  {
    id: "blackvid",
    name: "Blackvid",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://blackvid.space/embed/${id}`
        : `https://blackvid.space/embedtv/${id}/${s ?? 1}/${e ?? 1}`,
    healthScore: 1,
    lastSuccess: null,
    lastFailure: null,
    consecutiveFailures: 0,
  },
  {
    id: "moviesapi",
    name: "MoviesAPI",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://moviesapi.club/movie/${id}`
        : `https://moviesapi.club/tv/${id}/${s ?? 1}/${e ?? 1}`,
    healthScore: 1,
    lastSuccess: null,
    lastFailure: null,
    consecutiveFailures: 0,
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://multiembed.mov/?video_id=${id}`
        : `https://multiembed.mov/?video_id=${id}&s=${s ?? 1}&e=${e ?? 1}`,
    healthScore: 1,
    lastSuccess: null,
    lastFailure: null,
    consecutiveFailures: 0,
  },
  {
    id: "embedsu",
    name: "Embed.su",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://embed.su/embed/movie/${id}`
        : `https://embed.su/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
    healthScore: 1,
    lastSuccess: null,
    lastFailure: null,
    consecutiveFailures: 0,
  },
];

export const FREE_CDN_COUNT = 4;

export function availableSources(isPremium: boolean): CdnSource[] {
  return isPremium ? CDN_SOURCES : CDN_SOURCES.slice(0, FREE_CDN_COUNT);
}

export function buildEmbedUrl(
  cdnId: string,
  tmdbId: number,
  mediaType: MediaType,
  season?: number,
  episode?: number
): string {
  const src = CDN_SOURCES.find((s) => s.id === cdnId) ?? CDN_SOURCES[0];
  return src.buildUrl(tmdbId, mediaType, season, episode);
}
