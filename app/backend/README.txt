PC Assist backend

FastAPI service that reads system diagnostics from the computer where it
runs. It binds to http://127.0.0.1:9140.

Requirements
  Python 3.10 or newer.
  Install the packages in requirements.txt.

Run
  python -m venv .venv
  Activate .venv for your operating system.
  pip install -r requirements.txt
  python main.py

The run.bat and run.sh scripts provide platform-specific launchers.

Endpoints
  /api/overview     Summary
  /api/performance  CPU, memory, disk, and short histories
  /api/storage      Drive capacity and usage
  /api/network      Adapter and network information
  /api/about        Device and operating-system information

Check startup at http://127.0.0.1:9140/api/about.
Windows-specific fields use PowerShell and may be unavailable when a
command is blocked or unsupported. The interface handles missing values.
The API is intended for the local desktop application.
