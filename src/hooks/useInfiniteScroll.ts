import { useCallback, useEffect, useRef, useState } from "react";

// Infinite scroll for horizontal content rows and vertical browse grids.
// Calls `loadMore` when the sentinel approaches the visible edge.
export function useInfiniteScroll(
  loadMore: () => void,
  hasMore: boolean,
  options: { horizontal?: boolean; rootMargin?: string } = {}
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadingRef.current = true;
          loadMore();
          setTimeout(() => {
            loadingRef.current = false;
          }, 500);
        }
      },
      { rootMargin: options.rootMargin ?? "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, options.rootMargin]);

  return sentinelRef;
}

// Paginated list helper for content rows: keeps up to `maxPages` in memory.
export function usePagedRow<T>(
  fetchPage: (page: number) => Promise<{ results: T[]; total_pages: number }>,
  maxPages = 5
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPage(1).then((res) => {
      if (cancelled) return;
      setItems(res.results);
      setPage(1);
      setTotalPages(Math.min(res.total_pages, maxPages));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(() => {
    if (page >= totalPages) return;
    fetchPage(page + 1).then((res) => {
      setItems((prev) => [...prev, ...res.results]);
      setPage((p) => p + 1);
    });
  }, [fetchPage, page, totalPages]);

  return { items, loading, loadMore, hasMore: page < totalPages };
}
