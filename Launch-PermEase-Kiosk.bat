@echo off
title PERMEASE Kiosk Launcher
rem ============================================================
rem  PERMEASE kiosk launcher (same laptop as the server)
rem  Opens Chrome with --kiosk-printing so labels print straight
rem  to the Windows default printer (Y41BT Label) with no dialog.
rem ============================================================

rem ---- SETTINGS (edit if needed) ------------------------------
rem  SERVER_IP = 127.0.0.1 because the server runs on this same laptop.
rem  (Only change it if the server is on a different PC.)
set "SERVER_IP=127.0.0.1"
set "PORT=8010"
if not "%~1"=="" set "PORT=%~1"
set "PROFILE=%LOCALAPPDATA%\PermEaseKiosk"
rem -------------------------------------------------------------

set "URL=http://%SERVER_IP%:%PORT%/kiosk"

set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_PATH%" set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_PATH%" (
  echo [ERROR] Google Chrome was not found.
  pause & exit /b 1
)

echo ========================================================
echo    PERMEASE KIOSK - SILENT PRINTING MODE
echo ========================================================
echo Server: %URL%
echo.

rem ---- 1. Wait until the laptop server answers ----------------
set "TRIES=0"
:waitserver
powershell -NoProfile -Command "try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('%SERVER_IP%', %PORT%); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto serverok
set /a TRIES+=1
if %TRIES% GEQ 15 (
  echo [ERROR] Cannot reach %SERVER_IP%:%PORT%
  echo  - Is start-permease.bat running (is MySQL started)?
  echo  - Is something else already using port %PORT%?
  pause & exit /b 1
)
echo Waiting for server... (%TRIES%/15)
timeout /t 3 >nul
goto waitserver
:serverok

rem ---- 2. Close any old kiosk window (only the kiosk profile) -
rem  If a kiosk Chrome is already open, a new launch would ignore
rem  --kiosk-printing. This closes only Chrome using PermEaseKiosk,
rem  not your normal Chrome windows.
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -like '*PermEaseKiosk*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
timeout /t 2 >nul

rem ---- 3. Launch the kiosk ------------------------------------
echo Launching kiosk...
start "" "%CHROME_PATH%" --kiosk-printing --user-data-dir="%PROFILE%" --app="%URL%"

exit