@echo off
title SSMS - Smart School Management System
echo ============================================
echo   Smart School Management System (SSMS)
echo   React + Vite Frontend  ^|  Node.js Backend
echo ============================================
echo.

:: ---- Backend ----
cd /d "%~dp0backend"
echo [1/4] Installing backend dependencies...
call npm install
echo.

echo [2/4] Starting backend server (port 5000)...
start "" cmd /c "title SSMS Backend ^| http://localhost:5000 & node server.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

:: ---- React Frontend ----
cd /d "%~dp0frontend-react"
echo [3/4] Installing React frontend dependencies...
call npm install
echo.

echo [4/4] Starting React dev server (port 5173)...
start "" cmd /c "title SSMS React Frontend ^| http://localhost:5173 & npm run dev"

echo Waiting for React server to start...
timeout /t 4 /nobreak >nul

echo Opening app in browser...
start http://localhost:5173

echo.
echo ============================================
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:5173  (React)
echo.
echo   Press any key to close this window.
echo   (Both servers keep running in their own windows)
echo ============================================
pause >nul
taskkill /f /fi "WINDOWTITLE eq SSMS Backend" >nul 2>&1
echo Done.
