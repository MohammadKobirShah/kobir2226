import { ratingColor } from "../../lib/utils";

export function RatingCircle({
  vote,
  size = 36,
}: {
  vote: number;
  size?: number;
}) {
  const pct = Math.round(vote * 10);
  const color = ratingColor(vote);
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div
      className="relative flex items-center justify-center rounded-full bg-base/80"
      style={{ width: size, height: size }}
      title={`${pct}% user score`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute font-mono font-semibold text-text-primary"
        style={{ fontSize: size * 0.28 }}
      >
        {pct}
      </span>
    </div>
  );
}
