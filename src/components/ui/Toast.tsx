import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useStore } from "../../stores/useStore";
import { cx } from "../../lib/utils";

export function ToastHost() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4 md:bottom-8">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cx(
            "fade-enter glass pointer-events-auto flex w-full items-center gap-2.5 rounded-button px-4 py-3 text-left text-sm shadow-modal",
            t.kind === "success" && "border-success/30",
            t.kind === "error" && "border-danger/30"
          )}
        >
          {t.kind === "success" && (
            <CheckCircle2 size={16} className="shrink-0 text-success" />
          )}
          {t.kind === "error" && (
            <XCircle size={16} className="shrink-0 text-danger" />
          )}
          {t.kind === "info" && (
            <Info size={16} className="shrink-0 text-primary-hover" />
          )}
          <span className="text-text-primary">{t.message}</span>
        </button>
      ))}
    </div>
  );
}
