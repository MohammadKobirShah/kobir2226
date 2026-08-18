import useSWR from "swr";
import { useEffect } from "react";
import { Crown, Database, Gauge, Palette, User } from "lucide-react";
import { useStore } from "../stores/useStore";
import { useCdnHealth } from "../stores/useCdnHealth";
import { fetchCdnHealth } from "../lib/cdnHealthApi";
import { availableSources } from "../lib/videasy";
import { PremiumLock } from "../components/ui/PremiumLock";
import { Badge } from "../components/ui/Badge";
import { cx } from "../lib/utils";

const ACCENT_PRESETS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
];

export function Settings() {
  const profile = useStore((s) => s.profile);
  const setPremium = useStore((s) => s.setPremium);
  const updatePreferences = useStore((s) => s.updatePreferences);
  const recent = useCdnHealth((s) => s.recent);
  const serverStats = useCdnHealth((s) => s.serverStats);
  const setServerStats = useCdnHealth((s) => s.setServerStats);

  const { data: health } = useSWR("cdn-health", fetchCdnHealth, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (health) {
      const map: Record<string, number> = {};
      for (const s of health) map[s.name] = s.success_rate;
      setServerStats(map);
    }
  }, [health, setServerStats]);

  const sources = availableSources(profile.is_premium);

  return (
    <div className="page-enter mx-auto max-w-[900px] px-6 pb-24 pt-24 md:pb-16">
      <p className="metadata-label mb-1 text-primary-hover">Account</p>
      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-text-primary">
        Settings
      </h1>

      {/* Profile */}
      <section className="surface-depth mt-8 rounded-card border border-glass-border p-6">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-text-primary">
          <User size={18} className="text-primary-hover" />
          Profile
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full font-heading text-xl font-bold text-white"
            style={{ backgroundColor: profile.avatar_color }}
          >
            {profile.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-text-primary">{profile.name}</p>
            <p className="text-sm text-text-secondary">
              {profile.is_premium ? "Premium member" : "Pro tier (free)"}
            </p>
          </div>
          {profile.is_premium ? (
            <Badge variant="premium">
              <Crown size={11} />
              PREMIUM
            </Badge>
          ) : (
            <button
              onClick={() => setPremium(true)}
              className="rounded-button bg-premium px-4 py-2 text-sm font-semibold text-base transition hover:brightness-110"
            >
              Upgrade to Premium
            </button>
          )}
        </div>
        {profile.is_premium && (
          <button
            onClick={() => setPremium(false)}
            className="mt-4 text-xs text-text-muted underline-offset-2 hover:underline"
          >
            Revert to free tier (demo)
          </button>
        )}
      </section>

      {/* Preferences */}
      <section className="surface-depth mt-6 rounded-card border border-glass-border p-6">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-text-primary">
          <Palette size={18} className="text-primary-hover" />
          Preferences
        </h2>
        <div className="space-y-5">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-text-secondary">
              Autoplay next episode
            </span>
            <button
              role="switch"
              aria-checked={profile.preferences.autoplay_next}
              onClick={() =>
                updatePreferences({
                  autoplay_next: !profile.preferences.autoplay_next,
                })
              }
              className={cx(
                "relative h-6 w-11 rounded-full transition",
                profile.preferences.autoplay_next
                  ? "bg-success"
                  : "bg-elevated"
              )}
            >
              <span
                className={cx(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                  profile.preferences.autoplay_next ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </label>

          <div>
            <p className="mb-2 text-sm text-text-secondary">
              Accent color{" "}
              {!profile.is_premium && (
                <span className="ml-1 font-mono text-[10px] uppercase text-premium">
                  Premium
                </span>
              )}
            </p>
            <div className="flex gap-2">
              {ACCENT_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    if (profile.is_premium) {
                      updatePreferences({ accent_color: color });
                      document.documentElement.style.setProperty(
                        "--accent",
                        color
                      );
                    }
                  }}
                  aria-label={`Accent ${color}`}
                  className={cx(
                    "h-8 w-8 rounded-full border-2 transition",
                    profile.preferences.accent_color === color
                      ? "border-white"
                      : "border-transparent",
                    !profile.is_premium && "cursor-not-allowed opacity-40"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-text-secondary">
              Preferred quality
            </span>
            <select
              value={profile.preferences.preferred_quality}
              onChange={(e) =>
                updatePreferences({
                  preferred_quality: e.target
                    .value as typeof profile.preferences.preferred_quality,
                })
              }
              className="rounded-input border border-glass-border bg-base px-3 py-1.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="auto">Auto</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="4k">4K (Premium)</option>
            </select>
          </label>
        </div>
      </section>

      {/* CDN health dashboard */}
      <section className="surface-depth mt-6 rounded-card border border-glass-border p-6">
        <h2 className="mb-1 flex items-center gap-2 font-heading text-lg font-bold text-text-primary">
          <Gauge size={18} className="text-primary-hover" />
          CDN Health
        </h2>
        <p className="mb-4 text-xs text-text-muted">
          Local success rates (last 10 requests) and community-wide stats from
          the health aggregation API.
        </p>
        <div className="space-y-3">
          {sources.map((s) => {
            const outcomes = recent[s.id] ?? [];
            const localRate =
              outcomes.length > 0
                ? outcomes.filter(Boolean).length / outcomes.length
                : null;
            const community = serverStats[s.name];
            const rate = localRate ?? community ?? 1;
            return (
              <div key={s.id} className="flex items-center gap-3">
                <span
                  className={cx(
                    "h-2 w-2 shrink-0 rounded-full",
                    rate >= 0.7
                      ? "bg-success"
                      : rate >= 0.4
                        ? "bg-premium"
                        : "bg-danger"
                  )}
                />
                <span className="w-28 text-sm font-medium text-text-primary">
                  {s.name}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cx(
                      "h-full rounded-full",
                      rate >= 0.7
                        ? "bg-success"
                        : rate >= 0.4
                          ? "bg-premium"
                          : "bg-danger"
                    )}
                    style={{ width: `${Math.round(rate * 100)}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-xs text-text-secondary">
                  {Math.round(rate * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cloud sync — premium */}
      <section className="mt-6">
        <PremiumLock feature="Cloud sync — watchlist, history, and ratings across devices">
          <div className="surface-depth rounded-card border border-glass-border p-6">
            <h2 className="mb-2 flex items-center gap-2 font-heading text-lg font-bold text-text-primary">
              <Database size={18} className="text-primary-hover" />
              Cloud Sync
            </h2>
            <p className="text-sm text-text-secondary">
              Sync your watchlist, watch progress, and ratings across devices.
              Local data remains the source of truth; sync runs in the
              background.
            </p>
            <button className="mt-4 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover">
              Connect account
            </button>
          </div>
        </PremiumLock>
      </section>
    </div>
  );
}
