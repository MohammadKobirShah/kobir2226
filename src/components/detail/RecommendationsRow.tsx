import { RowCard } from "../rows/RowCard";
import type { MediaType, TmdbMediaItem } from "../../types";

export function RecommendationsRow({
  items,
  mediaType,
}: {
  items: TmdbMediaItem[];
  mediaType: MediaType;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="section-title mb-4 text-text-primary">More Like This</h3>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {items.slice(0, 15).map((item) => (
          <RowCard
            key={item.id}
            item={item}
            width={140}
            mediaType={mediaType}
          />
        ))}
      </div>
    </div>
  );
}
