@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "ROOT=%CD%"
set "CLI_MODE="
if not "%~1"=="" set "CLI_MODE=1"

if /I "%~1"=="help" goto :help
if /I "%~1"=="root-app" call :run_root_app & goto :eof
if /I "%~1"=="admin" call :run_admin & goto :eof
if /I "%~1"=="student-dashboard" call :run_student_dashboard & goto :eof
if /I "%~1"=="teacher-portal" call :run_teacher_portal & goto :eof
if /I "%~1"=="std1" call :run_std_portal "Std 1" "%ROOT%\student portal\Std 1\Std 1" & goto :eof
if /I "%~1"=="std2" call :run_std_portal "Std 2" "%ROOT%\student portal\Std 2\Std 2" & goto :eof
if /I "%~1"=="std3" call :run_std_portal "Std 3" "%ROOT%\student portal\Std 3\Std 3" & goto :eof
if /I "%~1"=="std4" call :run_std_portal "Std 4" "%ROOT%\student portal\Std 4\Std 4" & goto :eof
if /I "%~1"=="std5" call :run_std_portal "Std 5" "%ROOT%\student portal\Std 5\Std 5" & goto :eof
if /I "%~1"=="std6" call :run_std_portal "Std 6" "%ROOT%\student portal\Std 6\Std 6\Std 6" & goto :eof
if /I "%~1"=="std7" call :run_std_portal "Std 7" "%ROOT%\student portal\Std 7\Std 3" & goto :eof
if /I "%~1"=="build-admin" call :build_workspace "%ROOT%\Admin Dashboard\Admin Dashboard\frontend-react" "Admin Frontend" & goto :eof
if /I "%~1"=="build-student-dashboard" call :build_workspace "%ROOT%\student dashboard\frontend" "Student Dashboard Frontend" & goto :eof
if /I "%~1"=="build-teacher-client" call :build_workspace "%ROOT%\teacher portal\client" "Teacher Portal Client" & goto :eof
if /I "%~1"=="build-std1" call :build_workspace "%ROOT%\student portal\Std 1\Std 1" "Student Portal Std 1" & goto :eof
if /I "%~1"=="build-std2" call :build_workspace "%ROOT%\student portal\Std 2\Std 2" "Student Portal Std 2" & goto :eof
if /I "%~1"=="build-std3" call :build_workspace "%ROOT%\student portal\Std 3\Std 3" "Student Portal Std 3" & goto :eof
if /I "%~1"=="build-std4" call :build_workspace "%ROOT%\student portal\Std 4\Std 4" "Student Portal Std 4" & goto :eof
if /I "%~1"=="build-std5" call :build_workspace "%ROOT%\student portal\Std 5\Std 5" "Student Portal Std 5" & goto :eof
if /I "%~1"=="build-std6" call :build_workspace "%ROOT%\student portal\Std 6\Std 6\Std 6" "Student Portal Std 6" & goto :eof
if /I "%~1"=="build-std7" call :build_workspace "%ROOT%\student portal\Std 7\Std 3" "Student Portal Std 7" & goto :eof
if /I "%~1"=="build-all" call :build_all & goto :eof

:menu
cls
echo ===============================================
echo         Smart School System Launcher
echo ===============================================
echo.
echo Run options
echo   1. Root Python app
echo   2. Admin Dashboard
echo   3. Student Dashboard
echo   4. Teacher Portal
echo   5. Student Portal Std 1
echo   6. Student Portal Std 2
echo   7. Student Portal Std 3
echo   8. Student Portal Std 4
echo   9. Student Portal Std 5
echo   10. Student Portal Std 6
echo   11. Student Portal Std 7
echo.
echo Build options
echo   12. Build all frontends
echo   13. Build Admin Frontend
echo   14. Build Student Dashboard Frontend
echo   15. Build Teacher Portal Client
echo.
echo Other
echo   H. Help / command list
echo   Q. Quit
echo.
set "CHOICE="
set /p CHOICE=Select an option: 

if /I "%CHOICE%"=="1" call :run_root_app & goto :after_action
if /I "%CHOICE%"=="2" call :run_admin & goto :after_action
if /I "%CHOICE%"=="3" call :run_student_dashboard & goto :after_action
if /I "%CHOICE%"=="4" call :run_teacher_portal & goto :after_action
if /I "%CHOICE%"=="5" call :run_std_portal "Std 1" "%ROOT%\student portal\Std 1\Std 1" & goto :after_action
if /I "%CHOICE%"=="6" call :run_std_portal "Std 2" "%ROOT%\student portal\Std 2\Std 2" & goto :after_action
if /I "%CHOICE%"=="7" call :run_std_portal "Std 3" "%ROOT%\student portal\Std 3\Std 3" & goto :after_action
if /I "%CHOICE%"=="8" call :run_std_portal "Std 4" "%ROOT%\student portal\Std 4\Std 4" & goto :after_action
if /I "%CHOICE%"=="9" call :run_std_portal "Std 5" "%ROOT%\student portal\Std 5\Std 5" & goto :after_action
if /I "%CHOICE%"=="10" call :run_std_portal "Std 6" "%ROOT%\student portal\Std 6\Std 6\Std 6" & goto :after_action
if /I "%CHOICE%"=="11" call :run_std_portal "Std 7" "%ROOT%\student portal\Std 7\Std 3" & goto :after_action
if /I "%CHOICE%"=="12" call :build_all & goto :after_action
if /I "%CHOICE%"=="13" call :build_workspace "%ROOT%\Admin Dashboard\Admin Dashboard\frontend-react" "Admin Frontend" & goto :after_action
if /I "%CHOICE%"=="14" call :build_workspace "%ROOT%\student dashboard\frontend" "Student Dashboard Frontend" & goto :after_action
if /I "%CHOICE%"=="15" call :build_workspace "%ROOT%\teacher portal\client" "Teacher Portal Client" & goto :after_action
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

:run_root_app
echo Launching root Python app...
if exist "%ROOT%\.venv\Scripts\activate.bat" (
  start "SSMS Root App" cmd /k "cd /d ""%ROOT%"" && call "".venv\Scripts\activate.bat"" && python app.py"
) else (
  start "SSMS Root App" cmd /k "cd /d ""%ROOT%"" && python app.py"
)
exit /b 0

:run_admin
echo Launching Admin Dashboard...
if exist "%ROOT%\Admin Dashboard\Admin Dashboard\run.bat" (
  start "SSMS Admin Dashboard" cmd /k "cd /d ""%ROOT%\Admin Dashboard\Admin Dashboard"" && call run.bat"
  exit /b 0
)
echo Admin Dashboard run.bat not found.
exit /b 1

:run_student_dashboard
echo Launching Student Dashboard...
if exist "%ROOT%\student dashboard\start-servers.bat" (
  start "SSMS Student Dashboard" cmd /k "cd /d ""%ROOT%\student dashboard"" && call start-servers.bat"
  exit /b 0
)
echo Student Dashboard launcher not found.
exit /b 1

:run_teacher_portal
echo Launching Teacher Portal...
if exist "%ROOT%\teacher portal\run.bat" (
  start "SSMS Teacher Portal" cmd /k "cd /d ""%ROOT%\teacher portal"" && call run.bat"
  exit /b 0
)
echo Teacher Portal run.bat not found.
exit /b 1

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
call :build_workspace "%ROOT%\Admin Dashboard\Admin Dashboard\frontend-react" "Admin Frontend"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%ROOT%\student dashboard\frontend" "Student Dashboard Frontend"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%ROOT%\teacher portal\client" "Teacher Portal Client"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%ROOT%\student portal\Std 1\Std 1" "Student Portal Std 1"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%ROOT%\student portal\Std 2\Std 2" "Student Portal Std 2"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%ROOT%\student portal\Std 3\Std 3" "Student Portal Std 3"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%ROOT%\student portal\Std 4\Std 4" "Student Portal Std 4"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%ROOT%\student portal\Std 5\Std 5" "Student Portal Std 5"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%ROOT%\student portal\Std 6\Std 6\Std 6" "Student Portal Std 6"
if errorlevel 1 exit /b %ERRORLEVEL%
call :build_workspace "%ROOT%\student portal\Std 7\Std 3" "Student Portal Std 7"
if errorlevel 1 exit /b %ERRORLEVEL%
echo.
echo All selected frontends built successfully.
exit /b 0

:help
echo.
echo Usage:
echo   RUN_PROJECT.bat
echo   RUN_PROJECT.bat help
echo   RUN_PROJECT.bat root-app
echo   RUN_PROJECT.bat admin
echo   RUN_PROJECT.bat student-dashboard
echo   RUN_PROJECT.bat teacher-portal
echo   RUN_PROJECT.bat std1 ^| std2 ^| std3 ^| std4 ^| std5 ^| std6 ^| std7
echo   RUN_PROJECT.bat build-admin
echo   RUN_PROJECT.bat build-student-dashboard
echo   RUN_PROJECT.bat build-teacher-client
echo   RUN_PROJECT.bat build-std1 ^| build-std2 ^| build-std3 ^| build-std4 ^| build-std5 ^| build-std6 ^| build-std7
echo   RUN_PROJECT.bat build-all
echo.
echo Notes:
echo   - Run commands open new Command Prompt windows.
echo   - Build commands run in the current window.
echo   - Student portals launch with Vite using npm.
echo.
if defined CLI_MODE exit /b 0
pause
goto :menu
