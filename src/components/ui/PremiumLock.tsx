import { Crown } from "lucide-react";
import { useStore } from "../../stores/useStore";

// Wraps premium-only features. Free users see a glass overlay with an
// upgrade CTA; premium users get the feature directly.
export function PremiumLock({
  children,
  feature,
}: {
  children: React.ReactNode;
  feature: string;
}) {
  const isPremium = useStore((s) => s.profile.is_premium);
  const setPremium = useStore((s) => s.setPremium);

  if (isPremium) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-card">
      <div className="pointer-events-none select-none opacity-40 blur-[2px]">
        {children}
      </div>
      <div className="glass absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <Crown size={28} className="text-premium" />
        <p className="text-sm font-medium text-text-primary">{feature}</p>
        <p className="text-xs text-text-secondary">
          Available on the Premium tier
        </p>
        <button
          onClick={() => setPremium(true)}
          className="rounded-button bg-premium px-4 py-2 text-sm font-semibold text-base transition hover:brightness-110"
        >
          Upgrade to Premium
        </button>
      </div>
    </div>
  );
}
