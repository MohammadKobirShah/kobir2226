# VideasyPro — Premium Streaming Client

A production-ready, cinematic streaming client for movies and TV shows. Browse
trending titles via TMDB, track your watchlist and progress locally, and stream
through a resilient multi-CDN fallback chain (Videasy primary + 5 fallbacks).

## Key technologies

- **React 18 + Vite 5 + TypeScript** — route-based code splitting, fast HMR
- **Tailwind CSS 3** — custom theme implementing the obsidian/indigo/amber
  design system
- **SWR + Zustand** — data fetching with dedup/cache, lightweight global state
- **IndexedDB (idb)** — local-first watchlist, watch progress, ratings, and
  metadata cache
- **Netlify Database (Postgres) + Drizzle ORM** — community CDN health
  aggregation behind a Netlify Function (`/api/cdn-health`)
- **Service Worker** — cache-first TMDB images (30d), stale-while-revalidate
  TMDB API (24h), offline shell

## Features

- Hero carousel with Ken Burns effect, auto-rotating trending titles
- Horizontal content rows with snap scrolling, hover previews, infinite
  pagination
- Title detail modal: metadata, cast, episodes with season selector,
  recommendations, local 1–5 star ratings
- Full-screen player with automatic CDN fallback (8s timeout → next source),
  health-aware chain reordering, next-episode countdown, progress tracking
- Search overlay with 350ms debounce, keyboard navigation, trending searches
- Pro (free) and Premium tiers — premium unlocks all 6 CDNs, accent color
  picker, advanced browse filters, and cloud-sync-ready architecture
- Fully responsive: bottom tab bar on mobile, condensed nav on tablet, full
  nav on desktop

## Running locally

```bash
npm install
netlify dev --port 8889
```

Or with plain Vite (API routes won't be available):

```bash
npm run dev
```

## Environment variables

Set these in the Netlify UI (or a local `.env`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_TMDB_API_KEY` | Yes | TMDB metadata API |
| `VITE_FANART_API_KEY` | No | HD logos/artwork enhancement |
| `VITE_SUPABASE_URL` | No | Premium cloud sync (future) |
| `VITE_SUPABASE_ANON_KEY` | No | Premium cloud sync (future) |

## Build & deploy

```bash
npm run build   # outputs static files to dist/
```

Deploys to Netlify automatically — `netlify.toml` configures the build, the
SPA redirect, and the functions directory. Database migrations in
`netlify/database/migrations/` are applied automatically at deploy time.
