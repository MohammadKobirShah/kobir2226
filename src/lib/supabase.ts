// Optional Supabase sync for premium cloud sync.
//
// v1 ships offline-first: IndexedDB is the source of truth and all premium
// features work locally. When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are
// configured, this module can be extended to sync watchlist/history/ratings
// in the background. Keeping this as a thin, isolated seam so sync can be
// enabled without touching the rest of the app.

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function syncWatchlist(): Promise<void> {
  // no-op until Supabase env vars are provided
}

export async function syncProgress(): Promise<void> {
  // no-op until Supabase env vars are provided
}
