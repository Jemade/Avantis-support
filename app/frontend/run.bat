@echo off
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Install Node.js 20 LTS or newer from nodejs.org, then run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing packages. This takes about a minute.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo Could not install the packages. Check your internet connection.
    pause
    exit /b 1
  )
)

echo.
echo PC Assist is starting at http://localhost:5173
echo The backend must be running too. Start it with run.bat in the backend folder.
echo.
call npm run dev -- --open
pause
