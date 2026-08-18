import type { MediaType, TmdbMediaItem, TmdbMovie, TmdbTvShow } from "../types";

export function getTitle(item: TmdbMediaItem): string {
  return (item as TmdbMovie).title ?? (item as TmdbTvShow).name ?? "Untitled";
}

export function getYear(item: TmdbMediaItem): string {
  const date =
    (item as TmdbMovie).release_date ?? (item as TmdbTvShow).first_air_date;
  return date ? date.slice(0, 4) : "—";
}

export function getMediaType(item: TmdbMediaItem): MediaType {
  if (item.media_type === "movie" || item.media_type === "tv")
    return item.media_type;
  return "title" in item ? "movie" : "tv";
}

export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatTimestamp(seconds: number): string {
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function ratingColor(vote: number): string {
  if (vote >= 7) return "#10B981";
  if (vote >= 5) return "#F59E0B";
  return "#EF4444";
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let last = 0;
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    } else {
      clearTimeout(t);
      t = setTimeout(() => {
        last = Date.now();
        fn(...args);
      }, ms - (now - last));
    }
  };
}

export function pluralize(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
