import { cx } from "../../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-badge", className)} />;
}
