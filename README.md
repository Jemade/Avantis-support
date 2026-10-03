# PC Assist

A desktop diagnostics application with a Python/FastAPI backend, React interface, and Electron packaging. It displays information from the computer on which it runs.

## Features

- Device and operating-system overview.
- CPU, memory, disk, storage, and network information.
- Short performance histories and live refresh.
- Local backend bound to `127.0.0.1:9140`.
- Windows installer build through PyInstaller and Electron.

## Run the development app

Requires Python 3.10 or newer and Node.js.

In one terminal:

```bash
cd app/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

On Windows, activate the environment with `.venv\Scripts\activate.bat`.

In a second terminal:

```bash
cd app/frontend
npm install
npm run dev
```

Open http://localhost:5173. The frontend proxy connects to the local backend. Each directory also includes platform-specific launch scripts.

## Build a Windows installer

On Windows, run `app/build-windows.bat`. It packages the backend, builds the frontend, and invokes Electron's installer build. Generated installers are written under `app/electron/dist-installer/`; the filename follows the Electron package version.

Test the resulting installer on the target Windows versions before distribution.

## Repository

| Path | Purpose |
| --- | --- |
| `app/backend/` | System diagnostics API |
| `app/frontend/` | React interface |
| `app/electron/` | Desktop shell and packaging |
| `app/build-windows.bat` | Windows build orchestration |
| `feedback/` | Separate feedback page and PHP handler |

See the component READMEs and [feedback setup](feedback/README.md) for details.

## Current scope

The Windows build requires Windows tooling. Some fields use Windows-specific commands and may be unavailable on other systems. The feedback website is separate from the desktop application and requires its own PHP hosting and mail configuration.
