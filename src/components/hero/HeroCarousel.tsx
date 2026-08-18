import useSWR from "swr";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { backdropSrcSet, getTrending, img } from "../../lib/tmdb";
import { useStore } from "../../stores/useStore";
import { cx, getMediaType, getTitle, getYear, truncate } from "../../lib/utils";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import type { TmdbSearchResult } from "../../types";

const ROTATE_MS = 8000;
const SLIDE_COUNT = 5;

export function HeroCarousel() {
  const { data } = useSWR("hero-trending", () => getTrending("all", "day"), {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });
  const slides = (data?.results ?? [])
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .filter((r) => r.backdrop_path)
    .slice(0, SLIDE_COUNT);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const openModal = useStore((s) => s.openModal);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const go = useCallback(
    (next: number) => setIndex((next + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, slides.length]);

  if (slides.length === 0) {
    return (
      <div
        className="skeleton w-full"
        style={{ height: isMobile ? "50vh" : isTablet ? "60vh" : "85vh" }}
      />
    );
  }

  const height = isMobile ? "50vh" : isTablet ? "60vh" : "85vh";

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <HeroSlide
          key={slide.id}
          slide={slide}
          active={i === index}
          isMobile={isMobile}
          onPlay={() => {
            const type = getMediaType(slide as never);
            navigate(
              type === "movie"
                ? `/play/movie/${slide.id}`
                : `/play/tv/${slide.id}/1/1`
            );
          }}
          onInfo={() => openModal(slide.id, getMediaType(slide as never))}
        />
      ))}

      {/* Arrows */}
      {!isMobile && slides.length > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="Previous"
            className="glass absolute left-6 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary opacity-0 transition hover:text-text-primary group-hover:opacity-100 [section:hover>&]:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="Next"
            className="glass absolute right-6 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition hover:text-text-primary"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 right-6 z-10 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}`}
              className={cx(
                "h-1.5 rounded-full transition-all duration-300",
                i === index
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HeroSlide({
  slide,
  active,
  isMobile,
  onPlay,
  onInfo,
}: {
  slide: TmdbSearchResult;
  active: boolean;
  isMobile: boolean;
  onPlay: () => void;
  onInfo: () => void;
}) {
  const title = getTitle(slide as never);
  const year = getYear(slide as never);
  const backdrop = img.backdrop(slide.backdrop_path ?? null, "original");

  return (
    <div
      className={cx(
        "absolute inset-0 transition-opacity duration-[600ms]",
        active ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden={!active}
    >
      {backdrop && (
        <img
          key={String(active)}
          src={backdrop}
          srcSet={backdropSrcSet(slide.backdrop_path ?? null)}
          sizes="100vw"
          alt=""
          fetchPriority={active ? "high" : "auto"}
          className={cx(
            "h-full w-full object-cover",
            active && "ken-burns"
          )}
        />
      )}
      {/* Overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.6) 50%, rgba(10,10,15,0.2) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(10,10,15,1) 0%, transparent 40%)",
        }}
      />

      {/* Info */}
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[1400px] px-6 pb-16 md:pb-24">
        <div className="max-w-[600px]">
          <h1 className="hero-title text-text-primary">{title}</h1>
          <div className="metadata-label mt-3 flex flex-wrap items-center gap-3 text-text-secondary">
            <span>{year}</span>
            {typeof slide.vote_average === "number" && slide.vote_average > 0 && (
              <span className="text-success">
                {Math.round(slide.vote_average * 10)}% match
              </span>
            )}
            <span className="rounded-badge border border-glass-border px-1.5 py-0.5">
              {slide.media_type === "tv" ? "Series" : "Film"}
            </span>
          </div>
          {!isMobile && slide.overview && (
            <p className="mt-4 text-[0.95rem] leading-relaxed text-text-secondary">
              {truncate(slide.overview, 220)}
            </p>
          )}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onPlay}
              className="play-pulse flex h-12 items-center gap-2 rounded-button bg-success px-6 font-semibold text-base transition hover:brightness-110"
            >
              <Play size={20} fill="currentColor" />
              Play
            </button>
            {!isMobile && (
              <button
                onClick={onInfo}
                className="glass flex h-12 items-center gap-2 rounded-button px-6 font-semibold text-text-primary transition hover:border-white/20"
              >
                <Info size={18} />
                More Info
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
