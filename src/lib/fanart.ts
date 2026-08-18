// Optional Fanart.tv client for HD logos/clearart. Enhances the UI when a
// key is configured via VITE_FANART_API_KEY; everything degrades gracefully
// without one.

const BASE = "https://webservice.fanart.tv/v3";
const KEY = import.meta.env.VITE_FANART_API_KEY ?? "";

export interface FanartAssets {
  hdmovielogo?: { url: string }[];
  moviebackground?: { url: string }[];
  hdtvlogo?: { url: string }[];
  tvbackground?: { url: string }[];
}

const cache = new Map<string, FanartAssets | null>();

export async function getFanartMovie(tmdbId: number): Promise<FanartAssets | null> {
  if (!KEY) return null;
  const key = `movie:${tmdbId}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const res = await fetch(`${BASE}/movies/${tmdbId}?api_key=${KEY}`);
    if (!res.ok) throw new Error("fanart miss");
    const json = (await res.json()) as FanartAssets;
    cache.set(key, json);
    return json;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export async function getFanartTv(tvdbId: number): Promise<FanartAssets | null> {
  if (!KEY || !tvdbId) return null;
  const key = `tv:${tvdbId}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const res = await fetch(`${BASE}/tv/${tvdbId}?api_key=${KEY}`);
    if (!res.ok) throw new Error("fanart miss");
    const json = (await res.json()) as FanartAssets;
    cache.set(key, json);
    return json;
  } catch {
    cache.set(key, null);
    return null;
  }
}
