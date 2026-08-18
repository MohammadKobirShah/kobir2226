import { cx } from "../../lib/utils";
import type { TmdbSeasonSummary } from "../../types";

export function SeasonSelector({
  seasons,
  active,
  onChange,
}: {
  seasons: TmdbSeasonSummary[];
  active: number;
  onChange: (season: number) => void;
}) {
  const real = seasons.filter((s) => s.season_number > 0);
  if (real.length <= 1) return null;

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {real.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.season_number)}
          className={cx(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
            s.season_number === active
              ? "bg-primary text-white"
              : "glass text-text-secondary hover:text-text-primary"
          )}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
