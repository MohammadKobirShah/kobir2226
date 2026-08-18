import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

export function PlayerError({
  onRetry,
  onBack,
}: {
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle size={40} className="text-danger" />
      <h2 className="font-heading text-2xl font-bold text-text-primary">
        All sources unavailable
      </h2>
      <p className="max-w-md text-sm text-text-secondary">
        Every CDN in the fallback chain timed out for this title. This is
        usually temporary — try again in a moment, or pick a different title.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={onRetry}
          className="flex h-11 items-center gap-2 rounded-button bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          <RotateCcw size={16} />
          Retry
        </button>
        <button
          onClick={onBack}
          className="glass flex h-11 items-center gap-2 rounded-button px-5 text-sm font-semibold text-text-primary transition hover:border-white/20"
        >
          <ArrowLeft size={16} />
          Go back
        </button>
      </div>
    </div>
  );
}
