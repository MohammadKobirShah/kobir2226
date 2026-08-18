import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

// "Next Episode" countdown card. Appears near the (estimated) end of an
// episode; auto-plays the next episode after 10s unless dismissed.
export function NextEpisode({
  show,
  nextLabel,
  onPlayNext,
  onDismiss,
}: {
  show: boolean;
  nextLabel: string;
  onPlayNext: () => void;
  onDismiss: () => void;
}) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!show) {
      setCountdown(10);
      return;
    }
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          onPlayNext();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [show, onPlayNext]);

  if (!show) return null;

  return (
    <div className="fade-enter glass absolute bottom-24 right-6 z-30 w-72 rounded-card p-4 shadow-modal">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="metadata-label text-text-muted">Up next</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            {nextLabel}
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded-full p-1 text-text-secondary hover:text-text-primary"
        >
          <X size={14} />
        </button>
      </div>
      <button
        onClick={onPlayNext}
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-button bg-success text-sm font-semibold text-base transition hover:brightness-110"
      >
        <Play size={16} fill="currentColor" />
        Play next in {countdown}s
      </button>
    </div>
  );
}
