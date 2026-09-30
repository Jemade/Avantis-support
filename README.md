PC ASSIST DESKTOP APP  README
================================

This turns PC Assist into one installer, the same way Microsoft PC Manager
or any normal Windows program is installed: double-click a Setup file,
click through the install screens, then open "PC Assist" from the Start
Menu or desktop shortcut. The people you give it to do not need Python,
Node.js, or the internet to run it. Internet is only needed on YOUR
computer, once, to build the installer.

This is the same PC Assist app as before (same screens, same design, same
live PC data). Nothing about how it looks or works was changed. Building
it as a desktop app only needed two small, one-line packaging settings,
explained at the bottom of this file.


WHAT'S IN THIS FOLDER
----------------------
  backend/            The Python program that reads the computer's live
                       details (same as before).
  frontend/            The screens (same as before).
  electron/            The desktop app shell. This is the new part: it
                       opens a window, starts the backend inside it, and
                       shows the screens in that window instead of a
                       browser tab.
  build-windows.bat     Run this once. It builds everything into a single
                       installer file.


STEP 1: BUILD THE INSTALLER (do this once, on a Windows computer)
--------------------------------------------------------------
You need, on this one computer only:
  - Python 3.10 or newer, from python.org (tick "Add python.exe to PATH")
  - Node.js 20 LTS or newer, from nodejs.org
  - An internet connection (to download the packages, once)

Double-click:
  build-windows.bat

It runs on its own for a few minutes and does four things:
  1. Turns the Python backend into its own program (pcassist-backend.exe)
     that runs without Python installed.
  2. Builds the app screens, the same way the web version does.
  3. Puts both of those inside the desktop app.
  4. Builds the installer.

When it finishes, you will have:
  electron\dist-installer\PC Assist Setup 1.0.0.exe

That one file is everything. Nothing else in this folder needs to be sent
to anyone.


STEP 2: SHARE IT
------------------
Send "PC Assist Setup 1.0.0.exe" to anyone, any way you like (email, USB
drive, a shared drive, a chat app). They do not need Python, Node.js, or
this folder. They do not need internet to install or run it, since
everything it needs is already inside that one file.


STEP 3: WHAT THE PERSON RECEIVING IT DOES
--------------------------------------------
  1. Double-click "PC Assist Setup 1.0.0.exe".
  2. Windows may show a blue "Windows protected your PC" screen, because
     the file was not bought from the Microsoft Store and is not yet
     recognised by Windows (this is normal for a new app from a small
     developer, and goes away once enough people have run it, or once
     the file is digitally signed, which costs money and is a separate
     step, not included here). Click "More info", then "Run anyway".
  3. Follow the install screens (Next, Next, Install).
  4. Open "PC Assist" from the Start Menu or the desktop shortcut it
     creates.

The app opens in its own window, not a browser, and shows that computer's
own live details, the same way it did as a web page.


IF YOU CHANGE THE APP LATER
------------------------------
Edit the files in backend/ or frontend/ as normal, then run
build-windows.bat again. It rebuilds everything from scratch and makes a
new installer with the same file name.

To give it a new version number, change "version" in electron/package.json
(for example "1.0.1") before building; the installer's file name follows
that number automatically.


WHAT WAS ADDED FOR THE DESKTOP VERSION
------------------------------------------
Two small packaging settings were added, both explained where they appear:

  1. frontend/vite.config.js has one added line, base: "./" , so the built
     screens can open from a plain file the way the desktop app opens
     them (a browser tab always did this correctly already; only opening
     the built files directly needed this line).

  2. backend/main.py has one entry added to its existing list of allowed
     addresses, so the desktop app's window is allowed to ask it for
     data, the same as the browser version already was for its own
     address.

Nothing else was changed. The screens, the colours, the data shown, and
everything the app does are exactly the same as the web version.


IF SOMETHING GOES WRONG WHILE BUILDING
------------------------------------------
build-windows.bat prints which of its four steps it was on when it
stopped. Most causes:
  - Python or Node.js not installed, or not added to PATH during install.
  - No internet connection during the build.
  - A previous, half-finished build left files behind: delete the
    "backend\.venv", "backend\build", "backend\dist", "frontend\node_modules",
    "frontend\dist", and "electron\node_modules" folders, then run
    build-windows.bat again.



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
