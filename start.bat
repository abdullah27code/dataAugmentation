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

if not exist "%~dp0frontend\node_modules\.bin\vite.cmd" (
  echo [INFO] Frontend dependencies are missing. Running npm install...
  pushd "%~dp0frontend"
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed. Frontend could not be prepared.
    popd
    exit /b 1
  )
  popd
)

echo App started successfully
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 2 /nobreak >nul
start "Backend" cmd /k "cd /d %~dp0 && uvicorn main:app --reload"
start "" http://localhost:5173

endlocal
