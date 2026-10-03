PC Assist frontend

React and Vite interface for the local diagnostics API.

Run
  npm install
  npm run dev
  Open http://localhost:5173.

Build
  npm run build
  npm run preview
  Preview runs at http://localhost:4173.

Start the backend before using the interface. Vite proxies /api requests
to http://127.0.0.1:9140; see vite.config.js.
VITE_API_BASE can set the API base for a packaged build. The Windows
installer script supplies the local backend URL when building resources.

Source
  src/            Interface components and styles
  src/assets/     Brand assets
  vite.config.js  Relative build paths and development proxy

The Feedback navigation item is currently disabled. The separate feedback
website is documented in the repository's feedback/ directory.
