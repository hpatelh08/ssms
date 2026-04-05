@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "ROOT=%CD%"
set "CLI_MODE="
if not "%~1"=="" set "CLI_MODE=1"

set "STD_BASE=%ROOT%\student portal"
set "STD1_DIR=%STD_BASE%\Std 1"
set "STD2_DIR=%STD_BASE%\Std 2"
set "STD3_DIR=%STD_BASE%\Std 3"
set "STD4_DIR=%STD_BASE%\Std 4"
set "STD5_DIR=%STD_BASE%\Std 5"
set "STD6_DIR=%STD_BASE%\Std 6"

call :check_std_folder "Std 1" "%STD1_DIR%" STD1_OK
call :check_std_folder "Std 2" "%STD2_DIR%" STD2_OK
call :check_std_folder "Std 3" "%STD3_DIR%" STD3_OK
call :check_std_folder "Std 4" "%STD4_DIR%" STD4_OK
call :check_std_folder "Std 5" "%STD5_DIR%" STD5_OK
call :check_std_folder "Std 6" "%STD6_DIR%" STD6_OK

if /I "%~1"=="help" goto :help
if /I "%~1"=="admin" call :run_admin & goto :eof
if /I "%~1"=="student-login" call :run_student_login & goto :eof
if /I "%~1"=="teacher-portal" call :run_teacher_portal & goto :eof
if /I "%~1"=="std1" call :run_std_portal "Std 1" "%STD1_DIR%" & goto :eof
if /I "%~1"=="std2" call :run_std_portal "Std 2" "%STD2_DIR%" & goto :eof
if /I "%~1"=="std3" call :run_std_portal "Std 3" "%STD3_DIR%" & goto :eof
if /I "%~1"=="std4" call :run_std_portal "Std 4" "%STD4_DIR%" & goto :eof
if /I "%~1"=="std5" call :run_std_portal "Std 5" "%STD5_DIR%" & goto :eof
if /I "%~1"=="std6" call :run_std_portal "Std 6" "%STD6_DIR%" & goto :eof
if /I "%~1"=="build-admin" call :build_workspace "%ROOT%\Admin Dashboard\frontend-react" "Admin Frontend" & goto :eof
if /I "%~1"=="build-student-dashboard" call :build_workspace "%ROOT%\student dashboard\frontend" "Student Dashboard Frontend" & goto :eof
if /I "%~1"=="build-teacher-client" call :build_workspace "%ROOT%\teacher portal\client" "Teacher Portal Client" & goto :eof
if /I "%~1"=="build-std1" call :build_workspace "%STD1_DIR%" "Student Portal Std 1" & goto :eof
if /I "%~1"=="build-std2" call :build_workspace "%STD2_DIR%" "Student Portal Std 2" & goto :eof
if /I "%~1"=="build-std3" call :build_workspace "%STD3_DIR%" "Student Portal Std 3" & goto :eof
if /I "%~1"=="build-std4" call :build_workspace "%STD4_DIR%" "Student Portal Std 4" & goto :eof
if /I "%~1"=="build-std5" call :build_workspace "%STD5_DIR%" "Student Portal Std 5" & goto :eof
if /I "%~1"=="build-std6" call :build_workspace "%STD6_DIR%" "Student Portal Std 6" & goto :eof
if /I "%~1"=="build-all" call :build_all & goto :eof

:menu
cls
echo ===============================================
echo           Smart School System Launcher
echo ===============================================
echo.
echo Run options
echo   1. Admin + Teacher Portals
echo   2. Teacher Portal
echo   3. Student Login Page
set "STD1_STATUS="
if not defined STD1_OK set "STD1_STATUS= (missing)"
set "STD2_STATUS="
if not defined STD2_OK set "STD2_STATUS= (missing)"
set "STD3_STATUS="
if not defined STD3_OK set "STD3_STATUS= (missing)"
set "STD4_STATUS="
if not defined STD4_OK set "STD4_STATUS= (missing)"
set "STD5_STATUS="
if not defined STD5_OK set "STD5_STATUS= (missing)"
set "STD6_STATUS="
if not defined STD6_OK set "STD6_STATUS= (missing)"
echo   4. Student Portal Std 1%STD1_STATUS% (http://localhost:3001)
echo   5. Student Portal Std 2%STD2_STATUS% (http://localhost:3002)
echo   6. Student Portal Std 3%STD3_STATUS% (http://localhost:3003)
echo   7. Student Portal Std 4%STD4_STATUS% (http://localhost:3004)
echo   8. Student Portal Std 5%STD5_STATUS% (http://localhost:3005)
echo   9. Student Portal Std 6%STD6_STATUS% (http://localhost:3006)
echo.
echo Build options
echo   10. Build all frontends
echo   11. Build Admin Frontend
echo   12. Build Student Dashboard Frontend
echo   13. Build Teacher Portal Client
echo.
echo Other
echo   H. Help / command list
echo   Q. Quit
echo.
set "CHOICE="
set /p CHOICE=Select an option: 

if /I "%CHOICE%"=="1" (
  echo Launching Admin Dashboard...
  if exist "%ROOT%\Admin Dashboard\run.bat" (
    start "SSMS Admin Dashboard" cmd /k "cd /d ""%ROOT%\Admin Dashboard"" && call run.bat"
  ) else (
    echo Admin Dashboard run.bat not found.
  )
  call :ensure_backend_running
  timeout /t 2 /nobreak >nul
  echo Launching Teacher Portal...
  if exist "%ROOT%\teacher portal\run.bat" (
    start "SSMS Teacher Portal" cmd /k "cd /d ""%ROOT%\teacher portal"" && call run.bat"
  ) else (
    echo Teacher Portal run.bat not found.
  )
  goto :after_action
)
if /I "%CHOICE%"=="2" call :run_teacher_portal & goto :after_action
if /I "%CHOICE%"=="3" call :run_student_login & goto :after_action
if /I "%CHOICE%"=="4" call :run_std_portal "Std 1" "%STD1_DIR%" & goto :after_action
if /I "%CHOICE%"=="5" call :run_std_portal "Std 2" "%STD2_DIR%" & goto :after_action
if /I "%CHOICE%"=="6" call :run_std_portal "Std 3" "%STD3_DIR%" & goto :after_action
if /I "%CHOICE%"=="7" call :run_std_portal "Std 4" "%STD4_DIR%" & goto :after_action
if /I "%CHOICE%"=="8" call :run_std_portal "Std 5" "%STD5_DIR%" & goto :after_action
if /I "%CHOICE%"=="9" call :run_std_portal "Std 6" "%STD6_DIR%" & goto :after_action
if /I "%CHOICE%"=="10" call :build_all & goto :after_action
if /I "%CHOICE%"=="11" call :build_workspace "%ROOT%\Admin Dashboard\frontend-react" "Admin Frontend" & goto :after_action
if /I "%CHOICE%"=="12" call :build_workspace "%ROOT%\student dashboard\frontend" "Student Dashboard Frontend" & goto :after_action
if /I "%CHOICE%"=="13" call :build_workspace "%ROOT%\teacher portal\client" "Teacher Portal Client" & goto :after_action
if /I "%CHOICE%"=="H" goto :help
if /I "%CHOICE%"=="Q" goto :eof

echo.
echo Invalid option. Please try again.
timeout /t 2 /nobreak >nul
goto :menu

:after_action
echo.
pause
goto :menu

:check_std_folder
set "STD_LABEL=%~1"
set "STD_DIR=%~2"
set "STD_OK_VAR=%~3"
if exist "%STD_DIR%\package.json" (
  set "%STD_OK_VAR%=1"
) else (
  set "%STD_OK_VAR%="
)
exit /b 0


:run_admin
echo Launching Admin Dashboard...
if exist "%ROOT%\Admin Dashboard\run.bat" (
  start "SSMS Admin Dashboard" cmd /k "cd /d ""%ROOT%\Admin Dashboard"" && call run.bat"
  exit /b 0
)
echo Admin Dashboard run.bat not found.
exit /b 1


:run_teacher_portal
echo Launching Teacher Portal...
call :ensure_backend_running
timeout /t 2 /nobreak >nul
if exist "%ROOT%\teacher portal\run.bat" (
  start "SSMS Teacher Portal" cmd /k "cd /d ""%ROOT%\teacher portal"" && call run.bat"
  exit /b 0
)
echo Teacher Portal run.bat not found.
exit /b 1


:run_student_login
echo Launching Student Login Page...
if not exist "%ROOT%\run_app.py" (
  echo Backend launcher run_app.py not found.
  exit /b 1
)
call :ensure_backend_running
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5000/student-login"
exit /b 0


:ensure_backend_running
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5000/student-login' -TimeoutSec 2; if ($r.StatusCode -eq 200 -and ($r.Content -match 'Student Login' -or $r.Content -match 'Choose a standard')) { exit 0 } ; exit 1 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 exit /b 0
if exist "%ROOT%\.venv\Scripts\python.exe" (
  start "SSMS Backend" cmd /k "cd /d ""%ROOT%"" && ""%ROOT%\.venv\Scripts\python.exe"" run_app.py"
) else (
  start "SSMS Backend" cmd /k "cd /d ""%ROOT%"" && python run_app.py"
)
set /a ATTEMPTS=0
:wait_backend
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5000/student-login' -TimeoutSec 2; if ($r.StatusCode -eq 200 -and ($r.Content -match 'Student Login' -or $r.Content -match 'Choose a standard')) { exit 0 } ; exit 1 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 exit /b 0
set /a ATTEMPTS+=1
if %ATTEMPTS% lss 20 goto :wait_backend
echo Backend did not respond with the student login page on port 5000.
echo Check whether another app is already using port 5000, then run ssms.bat student-login again.
exit /b 0

:run_std_portal
set "STD_LABEL=%~1"
set "STD_DIR=%~2"
echo Launching Student Portal %STD_LABEL%...
if exist "%STD_DIR%\package.json" (
  start "SSMS %STD_LABEL%" cmd /k "cd /d ""%STD_DIR%"" && npm.cmd run dev"
  exit /b 0
)
echo %STD_LABEL% project folder not found.
exit /b 1

:build_workspace
set "WORKDIR=%~1"
set "LABEL=%~2"
if not exist "%WORKDIR%\package.json" (
  echo.
  echo [SKIP] %LABEL% - package.json not found.
  exit /b 0
)
echo.
echo ===============================================
echo Building: %LABEL%
echo Path: %WORKDIR%
echo ===============================================
pushd "%WORKDIR%"
call npm.cmd run build
set "BUILD_EXIT=%ERRORLEVEL%"
popd
if not "%BUILD_EXIT%"=="0" (
  echo [FAILED] %LABEL%
  exit /b %BUILD_EXIT%
)
echo [OK] %LABEL%
exit /b 0

:build_all
call :build_workspace "%ROOT%\Admin Dashboard\frontend-react" "Admin Frontend"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%ROOT%\student dashboard\frontend" "Student Dashboard Frontend"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%ROOT%\teacher portal\client" "Teacher Portal Client"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%STD1_DIR%" "Student Portal Std 1"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%STD2_DIR%" "Student Portal Std 2"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%STD3_DIR%" "Student Portal Std 3"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%STD4_DIR%" "Student Portal Std 4"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%STD5_DIR%" "Student Portal Std 5"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%STD6_DIR%" "Student Portal Std 6"
if errorlevel 1 exit /b %ERRORLEVEL%
echo.
echo All selected frontends built successfully.
exit /b 0

:help
echo.
echo Usage:
echo   ssms.bat
echo   ssms.bat help
echo   ssms.bat admin
echo   ssms.bat student-login
echo   ssms.bat student-dashboard
echo   ssms.bat teacher-portal
echo   ssms.bat std1 ^| std2 ^| std3 ^| std4 ^| std5 ^| std6
echo   ssms.bat build-admin
echo   ssms.bat build-student-dashboard
echo   ssms.bat build-teacher-client
echo   ssms.bat build-std1 ^| build-std2 ^| build-std3 ^| build-std4 ^| build-std5 ^| build-std6
echo   ssms.bat build-all
echo.
echo Notes:
echo   - Run commands open new Command Prompt windows.
echo   - Build commands run in the current window.
echo   - Student portals launch with Vite using npm.
echo.
if defined CLI_MODE exit /b 0
pause
goto :menu
