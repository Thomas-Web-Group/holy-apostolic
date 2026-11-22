@echo off
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. See README.md.
  pause
  exit /b 1
)
node "%~dp0server.cjs" --stop
if errorlevel 1 pause
