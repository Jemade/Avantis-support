@echo off
setlocal

echo ============================================
echo   PC Assist - build the installer (Windows)
echo ============================================
echo.
echo This turns the app into one file: PC Assist Setup 1.0.0.exe
echo You only need to run this once, on one Windows computer that has
echo Python and Node.js installed. The installer it produces can then be
echo copied to any other Windows computer, with nothing else installed.
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo [X] Python was not found. Install it from python.org, tick
  echo     "Add python.exe to PATH", then run this file again.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js was not found. Install Node.js 20 LTS from nodejs.org,
  echo     then run this file again.
  pause
  exit /b 1
)

set ROOT=%~dp0

echo.
echo [1/4] Building the backend into one program (this takes a minute) ...
cd /d "%ROOT%backend"
if not exist .venv (
  python -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install --disable-pip-version-check -q -r requirements.txt pyinstaller
if errorlevel 1 goto :fail

pyinstaller --onefile --noconsole --name pcassist-backend ^
  --distpath dist --workpath build --specpath build ^
  --hidden-import uvicorn.logging --hidden-import uvicorn.loops ^
  --hidden-import uvicorn.loops.auto --hidden-import uvicorn.protocols ^
  --hidden-import uvicorn.protocols.http --hidden-import uvicorn.protocols.http.auto ^
  --hidden-import uvicorn.protocols.websockets --hidden-import uvicorn.protocols.websockets.auto ^
  --hidden-import uvicorn.lifespan --hidden-import uvicorn.lifespan.on ^
  main.py
if errorlevel 1 goto :fail
call .venv\Scripts\deactivate.bat

echo.
echo [2/4] Building the app screens (the same ones the web version uses) ...
cd /d "%ROOT%frontend"
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail
set VITE_API_BASE=http://127.0.0.1:9140
call npm run build
if errorlevel 1 goto :fail

echo.
echo [3/4] Putting both pieces where the installer expects them ...
if not exist "%ROOT%electron\resources\backend" mkdir "%ROOT%electron\resources\backend"
if not exist "%ROOT%electron\resources\frontend" mkdir "%ROOT%electron\resources\frontend"
copy /y "%ROOT%backend\dist\pcassist-backend.exe" "%ROOT%electron\resources\backend\pcassist-backend.exe" >nul
xcopy /e /i /y "%ROOT%frontend\dist\*" "%ROOT%electron\resources\frontend\" >nul

echo.
echo [4/4] Building the installer ...
cd /d "%ROOT%electron"
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail
call npm run dist
if errorlevel 1 goto :fail

echo.
echo ============================================
echo   Done.
echo   Find it in: electron\dist-installer\
echo   Look for:   PC Assist Setup 1.0.0.exe
echo   That is the one file to share with people.
echo ============================================
pause
exit /b 0

:fail
echo.
echo Something went wrong. Scroll up to see which step failed.
pause
exit /b 1
