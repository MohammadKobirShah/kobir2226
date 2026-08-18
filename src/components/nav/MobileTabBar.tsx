import { Bookmark, Home, Search, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useStore } from "../../stores/useStore";
import { cx } from "../../lib/utils";

export function MobileTabBar() {
  const isMobile = useIsMobile();
  const setSearchOpen = useStore((s) => s.setSearchOpen);

  if (!isMobile) return null;

  const item = ({ isActive }: { isActive: boolean }) =>
    cx(
      "flex flex-col items-center gap-1 text-[10px] font-medium transition-colors",
      isActive ? "text-primary-hover" : "text-text-secondary"
    );

  return (
    <nav className="glass safe-bottom fixed inset-x-0 bottom-0 z-50 flex h-14 items-stretch justify-around border-t border-glass-border">
      <NavLink to="/" end className={item}>
        <Home size={20} className="mt-2" />
        Home
      </NavLink>
      <button
        onClick={() => setSearchOpen(true)}
        className="flex flex-col items-center gap-1 text-[10px] font-medium text-text-secondary"
      >
        <Search size={20} className="mt-2" />
        Search
      </button>
      <NavLink to="/my-list" className={item}>
        <Bookmark size={20} className="mt-2" />
        My List
      </NavLink>
      <NavLink to="/settings" className={item}>
        <User size={20} className="mt-2" />
        Profile
      </NavLink>
    </nav>
  );
}
