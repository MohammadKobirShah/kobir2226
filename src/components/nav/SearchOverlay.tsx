import useSWR from "swr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Film, PersonStanding, Search, TrendingUp, Tv, X } from "lucide-react";
import { getTrending, img, searchMulti } from "../../lib/tmdb";
import { useStore } from "../../stores/useStore";
import { RatingCircle } from "../ui/RatingCircle";
import { Badge } from "../ui/Badge";
import { cx, debounce } from "../../lib/utils";
import type { TmdbSearchResult } from "../../types";

export function SearchOverlay() {
  const open = useStore((s) => s.searchOpen);
  const setOpen = useStore((s) => s.setSearchOpen);
  const openModal = useStore((s) => s.openModal);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSet = useMemo(
    () => debounce((q: string) => setDebouncedQuery(q), 350),
    []
  );

  const { data: results } = useSWR(
    debouncedQuery ? ["search", debouncedQuery] : null,
    () => searchMulti(debouncedQuery),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  const { data: trending } = useSWR(
    open && !debouncedQuery ? "trending-searches" : null,
    () => getTrending("all", "week"),
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const items = useMemo(
    () =>
      (results?.results ?? [])
        .filter((r) => r.media_type !== "person" || r.known_for_department === "Acting")
        .slice(0, 8),
    [results]
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
    setActiveIndex(-1);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  const select = (item: TmdbSearchResult) => {
    if (item.media_type === "movie" || item.media_type === "tv") {
      openModal(item.id, item.media_type);
      close();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
      select(items[activeIndex]);
    }
  };

  return (
    <div
      className="fade-enter fixed inset-0 z-[90] flex flex-col items-center overflow-y-auto bg-base/60 px-4 pt-24 backdrop-blur-xl"
      onClick={close}
    >
      <div
        className="w-full max-w-[720px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass flex h-14 items-center gap-3 rounded-input px-4 focus-within:ring-2 focus-within:ring-primary">
          <Search size={20} className="shrink-0 text-text-secondary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              debouncedSet(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search movies, TV shows, people..."
            className="h-full w-full bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
          />
          <button
            onClick={close}
            aria-label="Close search"
            className="rounded-full p-1.5 text-text-secondary hover:bg-white/5 hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        {debouncedQuery && items.length > 0 && (
          <div className="glass mt-3 overflow-hidden rounded-card">
            {items.map((item, i) => {
              const title = item.title ?? item.name ?? "Untitled";
              const year = (item.release_date ?? item.first_air_date ?? "").slice(0, 4);
              const thumb =
                item.media_type === "person"
                  ? img.profile(item.profile_path ?? null)
                  : img.poster(item.poster_path ?? null, "w185");
              return (
                <button
                  key={`${item.media_type}-${item.id}`}
                  onClick={() => select(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cx(
                    "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors",
                    activeIndex === i ? "bg-elevated" : "bg-transparent"
                  )}
                >
                  <div className="h-[72px] w-12 shrink-0 overflow-hidden rounded-badge bg-elevated">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-muted">
                        {item.media_type === "person" ? (
                          <PersonStanding size={18} />
                        ) : item.media_type === "tv" ? (
                          <Tv size={18} />
                        ) : (
                          <Film size={18} />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {title}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-text-muted">
                      {year || "—"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      item.media_type === "person"
                        ? "outline"
                        : item.media_type === "tv"
                          ? "default"
                          : "hd"
                    }
                  >
                    {item.media_type === "person"
                      ? "Person"
                      : item.media_type === "tv"
                        ? "TV"
                        : "Movie"}
                  </Badge>
                  {typeof item.vote_average === "number" &&
                    item.vote_average > 0 && (
                      <RatingCircle vote={item.vote_average} size={32} />
                    )}
                </button>
              );
            })}
          </div>
        )}

        {/* No results */}
        {debouncedQuery && results && items.length === 0 && (
          <div className="glass mt-3 rounded-card p-8 text-center">
            <p className="text-text-secondary">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </p>
            <p className="mt-2 text-sm text-text-muted">
              Try checking the spelling or searching for something else.
            </p>
          </div>
        )}

        {/* Trending searches */}
        {!debouncedQuery && (
          <div className="mt-8">
            <p className="metadata-label mb-3 flex items-center gap-2 text-text-muted">
              <TrendingUp size={14} />
              Trending searches
            </p>
            <div className="flex flex-wrap gap-2">
              {(trending?.results ?? [])
                .slice(0, 10)
                .map((t) => t.title ?? t.name ?? "")
                .filter(Boolean)
                .map((title) => (
                  <button
                    key={title}
                    onClick={() => {
                      setQuery(title);
                      setDebouncedQuery(title);
                    }}
                    className="glass rounded-full px-4 py-2 text-sm text-text-secondary transition hover:border-primary/40 hover:text-text-primary"
                  >
                    {title}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
