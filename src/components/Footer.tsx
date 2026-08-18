import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="surface-depth border-t border-glass-border py-12">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-6 md:grid-cols-4">
        <div>
          <p className="font-heading text-lg font-extrabold tracking-tight">
            Videasy<span className="text-primary">Pro</span>
          </p>
          <p className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-success" />
            All systems operational
          </p>
          <p className="mt-2 font-mono text-[10px] text-text-muted">v1.0.0</p>
        </div>
        <div>
          <p className="metadata-label mb-3 text-text-muted">About</p>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>
              <Link to="/settings" className="hover:text-text-primary">
                Account
              </Link>
            </li>
            <li>
              <Link to="/settings" className="hover:text-text-primary">
                Premium
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="metadata-label mb-3 text-text-muted">Content</p>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>
              <Link to="/movies" className="hover:text-text-primary">
                Movies
              </Link>
            </li>
            <li>
              <Link to="/tv" className="hover:text-text-primary">
                TV Shows
              </Link>
            </li>
            <li>
              <Link to="/anime" className="hover:text-text-primary">
                Anime
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="metadata-label mb-3 text-text-muted">Legal</p>
          <p className="text-xs leading-relaxed text-text-muted">
            VideasyPro is a metadata browser and embed client. Metadata and
            artwork are provided by TMDB. This product uses the TMDB API but is
            not endorsed or certified by TMDB. Playback is provided by
            third-party embed sources.
          </p>
        </div>
      </div>
    </footer>
  );
}
