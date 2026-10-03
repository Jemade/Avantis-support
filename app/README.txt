PC Assist application

The application combines a local Python diagnostics API, a React interface,
and an Electron desktop shell.

Development
  Start backend/main.py using the backend launch script or a Python virtual
  environment with backend/requirements.txt installed.
  In frontend/, run npm install and npm run dev.
  Open http://localhost:5173.
  Backend API: http://127.0.0.1:9140/api/about.

Windows installer
  Requirements: Windows, Python 3.10 or newer, Node.js, and internet access
  for dependency installation.
  Run build-windows.bat from this directory.
  The script packages the backend with PyInstaller, builds the interface,
  copies application resources, and runs Electron Builder.
  Installer output: electron/dist-installer/.
  The installer name includes the version in electron/package.json.

Layout
  backend/    System diagnostics and local API
  frontend/   React interface
  electron/   Desktop shell and installer configuration

Test the generated installer on the intended Windows versions. Some system
fields depend on Windows commands and can be unavailable on other systems.
See the repository README.md and component READMEs for further setup details.
