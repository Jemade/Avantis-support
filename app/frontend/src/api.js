import { useEffect, useState } from "react";

// Leave empty to use the built-in proxy (see vite.config.js).
// To point at a backend somewhere else, set VITE_API_BASE before building.
const BASE = import.meta.env.VITE_API_BASE || "";
export const FEEDBACK_URL =
  import.meta.env.VITE_FEEDBACK_URL ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? "http://127.0.0.1:8080"
    : "https://avantis.co.zw/feedback/");

// Fetches `path` now and again every `intervalMs`. Every value shown in the app
// comes from here, straight from the backend running on the computer.
export function useApi(path, intervalMs) {
  const [state, setState] = useState({ data: null, error: null });

  useEffect(() => {
    let alive = true;
    let timer = null;
    const controller = new AbortController();

    async function tick() {
      try {
        const response = await fetch(BASE + path, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Request failed: " + response.status);
        const data = await response.json();
        if (alive) setState({ data, error: null });
      } catch (error) {
        if (alive && error.name !== "AbortError") {
          setState((previous) => ({ data: previous.data, error }));
        }
      }
      if (alive && intervalMs) timer = setTimeout(tick, intervalMs);
    }

    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [path, intervalMs]);

  return state;
}
