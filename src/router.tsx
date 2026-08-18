import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { App } from "./App";

// Route-based code splitting: each page is its own chunk.
const Home = lazy(() =>
  import("./pages/Home").then((m) => ({ default: m.Home }))
);
const Movies = lazy(() =>
  import("./pages/Movies").then((m) => ({ default: m.Movies }))
);
const TVShows = lazy(() =>
  import("./pages/TVShows").then((m) => ({ default: m.TVShows }))
);
const Anime = lazy(() =>
  import("./pages/Anime").then((m) => ({ default: m.Anime }))
);
const MyList = lazy(() =>
  import("./pages/MyList").then((m) => ({ default: m.MyList }))
);
const Browse = lazy(() =>
  import("./pages/Browse").then((m) => ({ default: m.Browse }))
);
const Settings = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.Settings }))
);
const PlayerPage = lazy(() =>
  import("./components/player/PlayerPage").then((m) => ({
    default: m.PlayerPage,
  }))
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "movies", element: <Movies /> },
      { path: "tv", element: <TVShows /> },
      { path: "anime", element: <Anime /> },
      { path: "my-list", element: <MyList /> },
      { path: "browse/:mediaType/:genres?", element: <Browse /> },
      { path: "settings", element: <Settings /> },
      { path: "play/:mediaType/:tmdbId", element: <PlayerPage /> },
      { path: "play/:mediaType/:tmdbId/:season/:episode", element: <PlayerPage /> },
      { path: "*", element: <Home /> },
    ],
  },
]);
