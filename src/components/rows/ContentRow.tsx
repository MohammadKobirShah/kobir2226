import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile, useIsTablet, useIsWide } from "../../hooks/useMediaQuery";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { cx } from "../../lib/utils";
import { RowCard } from "./RowCard";
import { SkeletonRow } from "../ui/SkeletonRow";
import type { MediaType, TmdbMediaItem } from "../../types";

export function ContentRow({
  eyebrow,
  title,
  items,
  loading,
  mediaType,
  seeAllTo,
  onLoadMore,
  hasMore,
}: {
  eyebrow?: string;
  title: string;
  items: TmdbMediaItem[];
  loading?: boolean;
  mediaType?: MediaType;
  seeAllTo?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isWide = useIsWide();
  const cardWidth = isMobile ? 130 : isTablet ? 150 : isWide ? 220 : 200;
  const gap = isMobile ? 8 : isTablet ? 10 : isWide ? 16 : 12;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const revealRef = useScrollReveal<HTMLDivElement>();
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir * 4 * (cardWidth + gap),
      behavior: "smooth",
    });
  };

  if (loading) return <SkeletonRow width={cardWidth} />;
  if (items.length === 0) return null;

  return (
    <section className="group/row relative mb-10" ref={revealRef}>
      <div className="mx-auto mb-4 flex max-w-[1400px] items-end justify-between px-6">
        <div>
          {eyebrow && (
            <p className="metadata-label mb-1 text-primary-hover">{eyebrow}</p>
          )}
          <h2 className="section-title text-text-primary">{title}</h2>
        </div>
        {seeAllTo && (
          <Link
            to={seeAllTo}
            className="text-sm font-medium text-primary-hover underline-offset-4 hover:underline"
          >
            See All
          </Link>
        )}
      </div>

      <div className="relative mx-auto max-w-[1400px]">
        <div
          ref={scrollerRef}
          onScroll={updateEdges}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto px-6 pb-2 pt-1"
          style={{ gap }}
        >
          {items.map((item, i) => (
            <div key={`${item.id}-${i}`} className="snap-start">
              <RowCard
                item={item}
                width={cardWidth}
                mediaType={mediaType}
                revealIndex={i}
              />
            </div>
          ))}
          {hasMore && onLoadMore && (
            <div className="flex items-center">
              <button
                onClick={onLoadMore}
                className="glass flex h-24 w-14 items-center justify-center rounded-card text-text-secondary transition hover:text-text-primary"
                aria-label="Load more"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Desktop hover arrows */}
        {!isMobile && (
          <>
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className={cx(
                "glass absolute -left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary opacity-0 transition hover:text-text-primary group-hover/row:opacity-100",
                atStart && "pointer-events-none !opacity-0"
              )}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className={cx(
                "glass absolute -right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary opacity-0 transition hover:text-text-primary group-hover/row:opacity-100",
                atEnd && "pointer-events-none !opacity-0"
              )}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
