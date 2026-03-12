@echo off
title AISpringFES 2026 Admin Launcher
echo --------------------------------------------------
echo  AISpringFES 2026 Admin Tool Launcher
echo --------------------------------------------------
echo.
echo  [1] Starting local server...
echo  [2] Opening browser in 3 seconds...
echo.
echo  * IMPORTANT: Keep this window open while working.
echo  * Close this window to stop the server.
echo.
echo --------------------------------------------------

start /b "" powershell -Command "Start-Process 'http://localhost:3000/admin/index.html'"

node server.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Failed to start server.
    echo Please ensure Node.js is installed.
    pause
)

