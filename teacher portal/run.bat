@echo off
SETLOCAL
REM Ensure we're in the script directory
cd /d "%~dp0"
set "TEACHER_PORTAL_SERVER_PORT=5001"
set "TEACHER_PORTAL_CLIENT_PORT=3000"
set "TEACHER_PORTAL_API_BASE=http://127.0.0.1:%TEACHER_PORTAL_SERVER_PORT%"
echo Starting server and client in separate windows...
start "Teacher Portal API" cmd /k "cd /d ""%~dp0server"" && set ""PORT=%TEACHER_PORTAL_SERVER_PORT%"" && npm.cmd start"
start "Teacher Portal UI" cmd /k "cd /d ""%~dp0client"" && set ""PORT=%TEACHER_PORTAL_CLIENT_PORT%"" && set ""BROWSER=none"" && set ""REACT_APP_API_BASE_URL=%TEACHER_PORTAL_API_BASE%"" && npm.cmd start"
echo Launched. Close these windows to stop the processes.
ENDLOCAL
