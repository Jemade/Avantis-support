import { useEffect, useState } from "react";
import { useApi } from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import Assist from "./pages/Assist.jsx";
import Performance from "./pages/Performance.jsx";
import Storage from "./pages/Storage.jsx";
import Network from "./pages/Network.jsx";
import About from "./pages/About.jsx";

export default function App() {
  const [page, setPage] = useState("assist");
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);
  const { data, error } = useApi("/api/overview", page === "assist" ? 2000 : 0);

  useEffect(() => {
    const timer = setTimeout(() => setMinimumSplashElapsed(true), 2400);
    return () => clearTimeout(timer);
  }, []);

  if (!minimumSplashElapsed || (!data && !error)) {
    return (
      <div className="splash" role="status" aria-live="polite">
        <div className="splash-content">
          <h1>AVANTIS PC ASSIST</h1>
          <span className="splash-spinner" aria-hidden="true" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar page={page} onNavigate={setPage} />
      <main className="content">
        {page === "assist" && <Assist onNavigate={setPage} data={data} error={error} />}
        {page === "performance" && <Performance />}
        {page === "storage" && <Storage />}
        {page === "network" && <Network />}
        {page === "about" && <About />}
      </main>
    </div>
  );
}
