@echo off
cd /d "%~dp0"
set "SWEA_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "SWEA_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  ) else (
    echo Node.js saknas. Installera Node.js 20 eller senare och forsok igen.
    pause
    exit /b 1
  )
)
"%SWEA_NODE%" scripts\build.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
"%SWEA_NODE%" scripts\serve.mjs
pause
