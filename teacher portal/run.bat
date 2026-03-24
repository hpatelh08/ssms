@echo off
SETLOCAL
REM Ensure we're in the script directory
cd /d "%~dp0"
echo Starting server and client in separate windows...
start "Server" cmd /k "cd /d "%~dp0server" && npm run dev"
start "Client" cmd /k "cd /d "%~dp0client" && npm start"
echo Launched. Close these windows to stop the processes.
ENDLOCAL