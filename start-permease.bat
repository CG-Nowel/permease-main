@echo off
title PERMEASE Launcher
rem ============================================================
rem  PERMEASE one-click launcher (development mode: npm run dev)
rem  Put this file in the project root (same folder as "artisan")
rem  and double-click it.
rem  Requires PHP, Composer and Node.js in PATH, and a database
rem  server already running (see .env).
rem  Also replace vite.config.js with the updated one so phones
rem  can load the page assets from the Vite dev server.
rem ============================================================

rem ---- SETTINGS (edit if needed) ------------------------------
set "PORT=8000"
set "VITE_PORT=5173"
rem -------------------------------------------------------------

cd /d "%~dp0"

if not exist artisan (
  echo [ERROR] artisan not found. Put this file in the project root folder.
  pause & exit /b 1
)

rem ---- 1. Open firewall ports for phones/other PCs ------------
rem  Runs once. If the rule is missing, Windows asks for admin
rem  permission, adds the rule, and sets Wi-Fi to Private.
set "RULE=PermEase Ports %PORT% and %VITE_PORT%"
netsh advfirewall firewall show rule name="%RULE%" >nul 2>&1
if not errorlevel 1 goto fwdone
net session >nul 2>&1
if errorlevel 1 (
  echo [1/5] Asking for administrator permission to open ports...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
echo [1/5] Opening firewall ports %PORT% and %VITE_PORT%...
netsh advfirewall firewall add rule name="%RULE%" dir=in action=allow protocol=TCP localport=%PORT%,%VITE_PORT% profile=any >nul
powershell -NoProfile -Command "$i=(Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -ne $null} | Select-Object -First 1).InterfaceIndex; if ($i) { Set-NetConnectionProfile -InterfaceIndex $i -NetworkCategory Private }" >nul 2>&1
:fwdone

rem ---- 2. Install dependencies only if missing ----------------
if not exist vendor\autoload.php (
  echo [2/5] Installing PHP packages...
  call composer install --no-interaction
)
if not exist node_modules (
  echo [2/5] Installing Node packages...
  call npm install
)
if not exist .env (
  copy .env.example .env >nul
  php artisan key:generate
)

rem ---- 3. Database migrations ---------------------------------
echo [3/5] Running migrations...
php artisan migrate --force
php artisan config:clear >nul
php artisan view:clear >nul

rem ---- 4. Find the real network IP ----------------------------
rem  Uses the adapter that has the default gateway (Wi-Fi or
rem  Ethernet), so virtual adapters (VirtualBox, WSL, VPN) are skipped.
set "LANIP="
for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "(Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up'} | Select-Object -First 1).IPv4Address.IPAddress"`) do set "LANIP=%%a"
if not defined LANIP (
  for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do if not defined LANIP set "LANIP=%%a"
  set "LANIP=%LANIP: =%"
)

rem ---- 5. Start Vite dev server, then Laravel -----------------
rem  Remove a stale hot file left by a previous run or a build.
if exist public\hot del /q public\hot
echo [4/5] Starting Vite dev server (npm run dev)...
start "PERMEASE Vite (npm run dev)" cmd /k "set VITE_DEV_HOST=%LANIP%&& npm run dev"
timeout /t 4 >nul

echo.
echo ============================================================
echo  PERMEASE is running (dev mode)
echo    This laptop : http://127.0.0.1:%PORT%
echo    PHONE / other devices (same Wi-Fi): http://%LANIP%:%PORT%
echo.
echo  On the phone type exactly the address above, using http
echo  and not https. Keep BOTH windows open. Ctrl+C stops Laravel.
echo ============================================================
echo.

echo [5/5] Starting Laravel server...
start "" cmd /c "timeout /t 3 >nul & start http://127.0.0.1:%PORT%"
php artisan serve --host=0.0.0.0 --port=%PORT%

pause