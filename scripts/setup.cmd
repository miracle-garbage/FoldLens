@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node ^20.19 or newer, then reopen the terminal.
  exit /b 1
)
node "%~dp0setup.mjs" %*
