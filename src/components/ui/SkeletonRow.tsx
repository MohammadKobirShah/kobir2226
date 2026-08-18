import { SkeletonCard } from "./SkeletonCard";

export function SkeletonRow({ width = 200, count = 7 }: { width?: number; count?: number }) {
  return (
    <div className="mb-10">
      <div className="skeleton mb-1.5 h-3 w-24 rounded-badge" />
      <div className="skeleton mb-4 h-6 w-48 rounded-badge" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} width={width} />
        ))}
      </div>
    </div>
  );
}
