import { useEffect, useRef } from "react";

// IntersectionObserver-driven scroll reveal: elements with [data-reveal]
// fade/slide in with a 50ms stagger per card.
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const idx = Number(el.dataset.revealIndex ?? 0);
            el.style.transitionDelay = `${Math.min(idx * 50, 400)}ms`;
            el.classList.add("revealed");
            observer.unobserve(el);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return ref;
}
