// IndexedDB persistence layer for watchlist, watch progress, ratings, and
// TMDB metadata cache. Local-first: IndexedDB is the source of truth.

import { openDB, type IDBPDatabase } from "idb";
import type {
  MediaType,
  RatingEntry,
  WatchlistEntry,
  WatchProgressEntry,
} from "../types";

const DB_NAME = "videasypro";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("watchlist")) {
          const store = db.createObjectStore("watchlist", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("by_title", ["tmdb_id", "media_type"], {
            unique: true,
          });
          store.createIndex("by_added", "added_date");
        }
        if (!db.objectStoreNames.contains("watch_progress")) {
          const store = db.createObjectStore("watch_progress", {
            keyPath: "id",
            autoIncrement: true,
          });
          // Composite string key — IndexedDB keys cannot contain null,
          // so season/episode are folded into a sentinel-safe string.
          store.createIndex("by_episode", "key", { unique: true });
          store.createIndex("by_last_watched", "last_watched");
        }
        if (!db.objectStoreNames.contains("ratings")) {
          const store = db.createObjectStore("ratings", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("by_title", ["tmdb_id", "media_type"], {
            unique: true,
          });
        }
        if (!db.objectStoreNames.contains("meta_cache")) {
          db.createObjectStore("meta_cache", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

// ---------- Watchlist ----------

export async function getWatchlist(): Promise<WatchlistEntry[]> {
  const db = await getDb();
  const all = (await db.getAll("watchlist")) as WatchlistEntry[];
  return all.sort((a, b) => b.added_date.localeCompare(a.added_date));
}

export async function addToWatchlist(
  entry: Omit<WatchlistEntry, "id">
): Promise<void> {
  const db = await getDb();
  const existing = (await db.getFromIndex("watchlist", "by_title", [
    entry.tmdb_id,
    entry.media_type,
  ])) as WatchlistEntry | undefined;
  if (existing) return;
  await db.add("watchlist", entry);
}

export async function removeFromWatchlist(
  tmdbId: number,
  mediaType: MediaType
): Promise<void> {
  const db = await getDb();
  const existing = (await db.getFromIndex("watchlist", "by_title", [
    tmdbId,
    mediaType,
  ])) as WatchlistEntry | undefined;
  if (existing?.id != null) await db.delete("watchlist", existing.id);
}

export async function isInWatchlist(
  tmdbId: number,
  mediaType: MediaType
): Promise<boolean> {
  const db = await getDb();
  const existing = await db.getFromIndex("watchlist", "by_title", [
    tmdbId,
    mediaType,
  ]);
  return existing !== undefined;
}

// ---------- Watch progress ----------

const MAX_PROGRESS_ENTRIES = 50;

function progressKey(
  tmdbId: number,
  mediaType: MediaType,
  season: number | null,
  episode: number | null
): string {
  return `${tmdbId}:${mediaType}:${season ?? -1}:${episode ?? -1}`;
}

export async function saveProgress(
  entry: Omit<WatchProgressEntry, "id">
): Promise<void> {
  const db = await getDb();
  const key = progressKey(
    entry.tmdb_id,
    entry.media_type,
    entry.season,
    entry.episode
  );
  const existing = (await db.getFromIndex(
    "watch_progress",
    "by_episode",
    key
  )) as (WatchProgressEntry & { key: string }) | undefined;
  if (existing?.id != null) {
    await db.put("watch_progress", { ...entry, id: existing.id, key });
  } else {
    await db.add("watch_progress", { ...entry, key });
  }
  // Trim to most recent entries
  const all = (await db.getAll("watch_progress")) as WatchProgressEntry[];
  if (all.length > MAX_PROGRESS_ENTRIES) {
    const sorted = all.sort((a, b) =>
      a.last_watched.localeCompare(b.last_watched)
    );
    const toDelete = sorted.slice(0, all.length - MAX_PROGRESS_ENTRIES);
    for (const e of toDelete) {
      if (e.id != null) await db.delete("watch_progress", e.id);
    }
  }
}

export async function getProgress(
  tmdbId: number,
  mediaType: MediaType,
  season: number | null,
  episode: number | null
): Promise<WatchProgressEntry | undefined> {
  const db = await getDb();
  return (await db.getFromIndex(
    "watch_progress",
    "by_episode",
    progressKey(tmdbId, mediaType, season, episode)
  )) as WatchProgressEntry | undefined;
}

export async function getRecentProgress(limit = 20): Promise<WatchProgressEntry[]> {
  const db = await getDb();
  const all = (await db.getAll("watch_progress")) as WatchProgressEntry[];
  return all
    .filter((e) => e.progress_percent > 2 && e.progress_percent < 97)
    .sort((a, b) => b.last_watched.localeCompare(a.last_watched))
    .slice(0, limit);
}

export async function removeProgress(
  tmdbId: number,
  mediaType: MediaType,
  season: number | null,
  episode: number | null
): Promise<void> {
  const db = await getDb();
  const existing = (await db.getFromIndex(
    "watch_progress",
    "by_episode",
    progressKey(tmdbId, mediaType, season, episode)
  )) as WatchProgressEntry | undefined;
  if (existing?.id != null) await db.delete("watch_progress", existing.id);
}

// ---------- Ratings ----------

export async function setRating(
  entry: Omit<RatingEntry, "id">
): Promise<void> {
  const db = await getDb();
  const existing = (await db.getFromIndex("ratings", "by_title", [
    entry.tmdb_id,
    entry.media_type,
  ])) as RatingEntry | undefined;
  if (existing?.id != null) {
    await db.put("ratings", { ...entry, id: existing.id });
  } else {
    await db.add("ratings", entry);
  }
}

export async function getRating(
  tmdbId: number,
  mediaType: MediaType
): Promise<RatingEntry | undefined> {
  const db = await getDb();
  return (await db.getFromIndex("ratings", "by_title", [
    tmdbId,
    mediaType,
  ])) as RatingEntry | undefined;
}

// ---------- Metadata cache (for offline browse) ----------

export async function cacheMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put("meta_cache", { key, value, at: Date.now() });
}

export async function getCachedMeta<T>(key: string, maxAgeMs: number): Promise<T | undefined> {
  const db = await getDb();
  const row = (await db.get("meta_cache", key)) as
    | { key: string; value: T; at: number }
    | undefined;
  if (!row) return undefined;
  if (Date.now() - row.at > maxAgeMs) return undefined;
  return row.value;
}
