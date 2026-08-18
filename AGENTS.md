# AGENTS.md — VideasyPro

## What this is

A cinematic streaming client ("VideasyPro") built with React 18 + Vite 5 +
TypeScript + Tailwind CSS 3, deployed on Netlify. It browses TMDB metadata and
plays through a chain of third-party embed CDNs (Videasy primary, 5
fallbacks). Local-first persistence via IndexedDB; community CDN health stats
persist in Netlify Database (Postgres) via a Netlify Function.

## Architecture

- `src/lib/tmdb.ts` — TMDB client. In-memory LRU cache (24h metadata / 1h
  search) + in-flight request deduplication. All endpoints used by the app
  live here; add new ones in this file, not ad-hoc in components.
- `src/lib/videasy.ts` — CDN source registry. `CDN_SOURCES` order defines the
  default fallback chain; free tier uses the first 4 (`FREE_CDN_COUNT`),
  premium gets all 6.
- `src/lib/db.ts` — IndexedDB wrapper (idb). Stores: `watchlist`,
  `watch_progress`, `ratings`, `meta_cache`. NOTE: `watch_progress` uses a
  composite string `key` (e.g. `123:tv:1:4`) because IndexedDB index keys
  cannot contain `null` — do not revert to array keys with nulls.
- `src/lib/cdnHealthApi.ts` — client for `/api/cdn-health` (Netlify Function).
  Telemetry is best-effort and must never block playback.
- `src/stores/` — Zustand stores: `useStore` (profile, modal, toasts, list
  version counters), `useCdnHealth` (local success window of 10 per CDN,
  5-minute deprioritization after 2 consecutive failures, chain reordering),
  `usePlayer` (active playback state).
- `src/components/` — UI organized by area: `nav/`, `hero/`, `rows/`,
  `detail/`, `player/`, `ui/`. `ui/` holds primitives (Skeleton, Badge,
  RatingCircle, Toast, PremiumLock).
- `src/pages/` — route targets, each lazy-loaded in `src/router.tsx`.
- `db/schema.ts` + `netlify/functions/cdn-health.ts` — Drizzle schema and the
  health-aggregation endpoint. Migrations live in
  `netlify/database/migrations/` and are applied by Netlify at deploy time.

## Conventions

- **Styling**: Tailwind with the custom theme in `tailwind.config.js` (colors
  `base/surface/elevated/primary/premium/success`, radii `card/button/modal/
  poster/badge/input`, shadows `card/card-hover/modal/nav-bar`). Global CSS
  (animations, glass, reveal) lives in `src/index.css`. Forced dark mode —
  no light theme.
- **Data fetching**: SWR for all TMDB data (`revalidateOnFocus: false`,
  `dedupingInterval` ≥ 60s). Mutations to IndexedDB bump version counters in
  `useStore` (`bumpWatchlist`/`bumpProgress`) to re-render subscribers.
- **Images**: always via `img.*` helpers and `posterSrcSet`/`backdropSrcSet`
  from `src/lib/tmdb.ts`; always `loading="lazy"` + explicit width/height
  below the fold.
- **Types**: all shared interfaces in `src/types/index.ts`.
- **Imports**: functions/db code uses `.js` extensions for ESM
  (`../../db/index.js`); frontend code uses extensionless imports.

## Non-obvious decisions

- **Playback progress is time-estimated.** Embed iframes are cross-origin, so
  real video position is unreadable. The player estimates position from wall
  clock + resume point and asks the user to confirm resume. See
  `useProgressTracker`.
- **CDN fallback**: 8s iframe load timeout → mark fail → 2s delay → next
  source → toast. All sources failing renders `PlayerError`.
- **Iframe sandbox**: `allow-scripts allow-same-origin allow-presentation
  allow-forms` — deliberately no `allow-popups` (ad popup mitigation), plus a
  3s transparent click-guard overlay after each source switch.
- **Premium gating** is a simulated toggle (`useStore.setPremium`) persisted
  to localStorage — no real payments in v1. Premium-only UI is wrapped in
  `PremiumLock`.
- **API keys are client-side** (`VITE_TMDB_API_KEY`, optional
  `VITE_FANART_API_KEY`) by design; TMDB keys are low-sensitivity and
  rate-limited server-side. Never print key values in logs or docs.
- **Database**: only CDN health events are stored server-side. User data
  (watchlist/progress/ratings) is intentionally local-only in v1; Supabase
  sync is a stub seam in `src/lib/supabase.ts`.
- **Service worker** is hand-rolled (`public/sw.js`), registered only in
  production builds. CDN embed hosts are explicitly never cached.

## Schema changes

If you change `db/schema.ts`, run
`npx drizzle-kit generate --name <snake_case_description>` and commit the
generated migration. Never edit applied migrations; never run DDL manually.
