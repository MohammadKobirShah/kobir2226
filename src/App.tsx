import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./components/nav/Navbar";
import { MobileTabBar } from "./components/nav/MobileTabBar";
import { SearchOverlay } from "./components/nav/SearchOverlay";
import { TitleModal } from "./components/detail/TitleModal";
import { ToastHost } from "./components/ui/Toast";
import { Footer } from "./components/Footer";
import { useCdnHealth } from "./stores/useCdnHealth";
import { useStore } from "./stores/useStore";

export function App() {
  const location = useLocation();
  const isPlayer = location.pathname.startsWith("/play");
  const isPremium = useStore((s) => s.profile.is_premium);
  const defaultCdn = useStore((s) => s.profile.preferences.default_cdn);
  const loadInitialOrder = useCdnHealth((s) => s.loadInitialOrder);
  const cdnLoaded = useCdnHealth((s) => s.loaded);

  useEffect(() => {
    if (!cdnLoaded) loadInitialOrder(isPremium, defaultCdn);
  }, [cdnLoaded, isPremium, defaultCdn, loadInitialOrder]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (isPlayer) {
    // Full-screen takeover: no nav, no footer
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
        <Outlet />
        <ToastHost />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileTabBar />
      <SearchOverlay />
      <TitleModal />
      <ToastHost />
    </div>
  );
}
