import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "../../lib/utils";
import type { CdnSource } from "../../types";

export function CdnSelector({
  sources,
  activeId,
  healthDot,
  onSelect,
}: {
  sources: CdnSource[];
  activeId: string;
  healthDot: (id: string) => "green" | "yellow" | "red";
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = sources.find((s) => s.id === activeId) ?? sources[0];

  const dotColor = {
    green: "bg-success",
    yellow: "bg-premium",
    red: "bg-danger",
  } as const;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-text-primary transition hover:border-white/20"
      >
        <span
          className={cx("h-1.5 w-1.5 rounded-full", dotColor[healthDot(active.id)])}
        />
        {active.name}
        <ChevronDown size={13} className="text-text-secondary" />
      </button>
      {open && (
        <div className="glass absolute right-0 top-10 z-20 min-w-[160px] overflow-hidden rounded-card p-1">
          {sources.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelect(s.id);
                setOpen(false);
              }}
              className={cx(
                "flex w-full items-center gap-2.5 rounded-badge px-3 py-2 text-left text-xs font-medium transition",
                s.id === activeId
                  ? "bg-primary/20 text-primary-hover"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              )}
            >
              <span
                className={cx("h-1.5 w-1.5 rounded-full", dotColor[healthDot(s.id)])}
              />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
