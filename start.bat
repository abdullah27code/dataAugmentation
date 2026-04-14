@echo off
setlocal

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found. Install Node.js and ensure npm is on your PATH.
  exit /b 1
)

where uvicorn >nul 2>nul
if errorlevel 1 (
  echo [ERROR] uvicorn was not found. Install it with: pip install uvicorn
  exit /b 1
)

echo App started successfully
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
start "Backend" cmd /k "cd /d %~dp0 && uvicorn main:app --reload"

endlocal
