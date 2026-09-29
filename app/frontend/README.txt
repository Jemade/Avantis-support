PC ASSIST FRONT END (React + Vite)

The PC Assist window. It shows live details from the computer, which it
gets from the PC Assist backend running on the same computer.

REQUIREMENTS
  Node.js 18 or newer, 20 LTS recommended (nodejs.org).
  Internet is needed once, to download the packages.
  The PC Assist backend must be running (see the backend folder).

RUN ON WINDOWS
  Double-click run.bat
  The first run installs packages (about a minute), then your browser
  opens PC Assist at http://localhost:5173

RUN ON MAC OR LINUX
  ./run.sh

RUN BY HAND (any system)
  npm install
  npm run dev

BUILD A FINISHED COPY (optional)
  npm run build      creates the "dist" folder
  npm run preview    serves it at http://localhost:4173

HOW IT TALKS TO THE BACKEND
  The app asks for /api/... and Vite passes those requests to the backend at
  http://127.0.0.1:9140 (see vite.config.js). To use a backend somewhere else,
  set VITE_API_BASE before building, for example:
    set VITE_API_BASE=http://192.168.1.20:9140    (then npm run build)
  and add that page's address to allow_origins in the backend main.py.

IF THE PAGE SAYS "Cannot reach the PC Assist backend"
  The backend is not running. Start it, and this page reconnects by itself.

STYLE
  Colors come from the Avantis logo. Main teal is #13A3AF, defined at the top
  of src/styles.css. The logo file is src/assets/avantis-logo.png.

FEEDBACK
  The Feedback item is shown but switched off for now.
