export function SkeletonCard({ width = 200 }: { width?: number }) {
  return (
    <div className="shrink-0" style={{ width }}>
      <div
        className="skeleton rounded-poster w-full"
        style={{ aspectRatio: "2/3" }}
      />
      <div className="skeleton mt-2 h-3 w-3/4 rounded-badge" />
      <div className="skeleton mt-1.5 h-2.5 w-1/2 rounded-badge" />
    </div>
  );
}
