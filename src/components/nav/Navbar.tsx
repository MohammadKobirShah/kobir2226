import { Crown, Search } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useScrollDirection } from "../../hooks/useScrollDirection";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useStore } from "../../stores/useStore";
import { cx } from "../../lib/utils";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/tv", label: "TV Shows" },
  { to: "/anime", label: "Anime" },
  { to: "/my-list", label: "My List" },
];

export function Navbar() {
  const { direction, scrolled } = useScrollDirection();
  const isMobile = useIsMobile();
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const isPremium = useStore((s) => s.profile.is_premium);
  const location = useLocation();
  const onHeroPage = ["/", "/movies", "/tv", "/anime"].includes(
    location.pathname
  );

  if (isMobile) return null; // mobile uses MobileTabBar

  const transparent = onHeroPage && !scrolled;
  const hidden = direction === "down" && scrolled;

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300",
        hidden && "-translate-y-full",
        transparent
          ? "bg-transparent"
          : "glass shadow-nav-bar"
      )}
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6">
        <Link
          to="/"
          className="font-heading text-xl font-extrabold tracking-tight"
        >
          Videasy<span className="text-primary">Pro</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cx(
                  "nav-link text-sm font-medium",
                  isActive
                    ? "active text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="rounded-full p-2 text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
          >
            <Search size={20} />
          </button>
          {isPremium && (
            <span className="flex items-center gap-1 rounded-badge bg-premium/15 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-premium shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Crown size={11} />
              PRO
            </span>
          )}
          <Link
            to="/settings"
            aria-label="Profile"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-heading text-xs font-bold text-white transition hover:bg-primary-hover"
          >
            {useStore.getState().profile.name.slice(0, 1).toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  );
}
