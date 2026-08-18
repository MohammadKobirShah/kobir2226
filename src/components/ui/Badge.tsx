import { cx } from "../../lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "hd" | "premium" | "success" | "danger" | "outline";
  className?: string;
}) {
  const styles: Record<string, string> = {
    default: "bg-elevated text-text-secondary",
    hd: "bg-primary/20 text-primary-hover border border-primary/30",
    premium:
      "bg-premium/15 text-premium border border-premium/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
    success: "bg-success/15 text-success border border-success/30",
    danger: "bg-danger/15 text-danger border border-danger/30",
    outline: "border border-glass-border text-text-secondary",
  };
  return (
    <span
      className={cx(
        "metadata-label inline-flex items-center gap-1 rounded-badge px-1.5 py-0.5",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
