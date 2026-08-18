import { img } from "../../lib/tmdb";
import type { TmdbCastMember } from "../../types";

export function CastRow({ cast }: { cast: TmdbCastMember[] }) {
  const top = cast.slice(0, 10);
  if (top.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="section-title mb-4 text-text-primary">Cast</h3>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {top.map((member) => (
          <div key={member.id} className="w-16 shrink-0 text-center">
            <div className="mx-auto h-12 w-12 overflow-hidden rounded-full bg-elevated">
              {member.profile_path ? (
                <img
                  src={img.profile(member.profile_path)!}
                  alt={member.name}
                  loading="lazy"
                  decoding="async"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-heading text-sm font-bold text-text-muted">
                  {member.name.slice(0, 1)}
                </div>
              )}
            </div>
            <p className="mt-2 truncate text-xs font-medium text-text-primary">
              {member.name}
            </p>
            <p className="truncate text-[10px] text-text-muted">
              {member.character}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
