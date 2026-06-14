@echo off
setlocal
cd /d "%~dp0"

set "ANALYZER_URL=http://127.0.0.1:3920/"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Install Node.js LTS first, then run this file again.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 3920 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if not errorlevel 1 (
  echo Buy or Bye server is already running.  
  start "" "%ANALYZER_URL%"
  exit /b 0
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting Buy or Bye server...
start "Buy or Bye Server - close this window to stop" cmd /k "title Buy or Bye Server - close this window to stop && echo Buy or Bye server is running. Close this window or press Ctrl+C to stop. && echo. && npm start"
timeout /t 2 /nobreak >nul
start "" "%ANALYZER_URL%"
