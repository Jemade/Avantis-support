PC ASSIST BACKEND (Python)

Reads live details from the computer it runs on and serves them at
http://127.0.0.1:9140 for the PC Assist front end. Nothing is hardcoded
about a machine, so this same folder works on any computer.

REQUIREMENTS
  Python 3.10 or newer (python.org). Tick "Add python.exe to PATH" when installing.
  Internet is needed once, to download the three packages in requirements.txt.

RUN ON WINDOWS
  Double-click run.bat
  The first run creates a .venv folder and installs the packages (about a minute).
  Leave the window open. Close it to stop the backend.

RUN ON MAC OR LINUX
  ./run.sh

RUN BY HAND (any system)
  python -m venv .venv
  .venv\Scripts\activate        (Mac/Linux: source .venv/bin/activate)
  pip install -r requirements.txt
  python main.py

CHECK IT WORKS
  Open http://127.0.0.1:9140/api/about in a browser. You should see this
  computer's name, processor and memory.

ENDPOINTS
  /api/overview     Assist page summary
  /api/performance  CPU, memory and disk, with 60 second histories
  /api/storage      Space used and free on each drive
  /api/network      Active adapter, speeds, SSID, DNS, IP addresses
  /api/about        Device, operating system, processor, memory

NOTES
  The backend only listens on 127.0.0.1, so other computers cannot reach it.
  It never writes, deletes or changes anything on the computer. It only reads.
  Windows: device model, serial number, DNS servers and the system disk model
  are read with built-in PowerShell commands. If one of them is blocked or
  unavailable, that single value shows as "Not available" and the rest keep working.
