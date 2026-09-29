import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Assist from "./pages/Assist.jsx";
import Performance from "./pages/Performance.jsx";
import Storage from "./pages/Storage.jsx";
import Network from "./pages/Network.jsx";
import About from "./pages/About.jsx";

export default function App() {
  const [page, setPage] = useState("assist");
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsStarting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isStarting) {
    return (
      <div className="startup-screen" role="status" aria-live="polite">
        <div className="startup-brand">AVANTIS</div>
        <div className="startup-name">PC ASSIST</div>
        <div className="startup-spinner" aria-hidden="true" />
        <span className="startup-loading">Loading</span>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar page={page} onNavigate={setPage} />
      <main className="content">
        {page === "assist" && <Assist onNavigate={setPage} />}
        {page === "performance" && <Performance />}
        {page === "storage" && <Storage />}
        {page === "network" && <Network />}
        {page === "about" && <About />}
      </main>
    </div>
  );
}
