@echo off
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found.
  echo Install Python 3.10 or newer from python.org and tick Add python.exe to PATH.
  pause
  exit /b 1
)

if not exist .venv (
  echo Creating virtual environment...
  python -m venv .venv
)

call .venv\Scripts\activate.bat
python -m pip install --disable-pip-version-check -q -r requirements.txt
if errorlevel 1 (
  echo Could not install the requirements. Check your internet connection.
  pause
  exit /b 1
)

echo.
echo PC Assist backend is running at http://127.0.0.1:9140
echo Leave this window open. Close it to stop the backend.
echo.
python main.py
pause
