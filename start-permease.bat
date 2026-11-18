@echo off
title PERMEASE Server
rem ============================================================
rem  PERMEASE server launcher (this laptop is server AND kiosk)
rem  Put this file in the project root (same folder as "artisan")
rem  and double-click it. It starts the server, then the kiosk.
rem  Production mode: no Vite dev server, uses public\build.
rem ============================================================

rem ---- SETTINGS (edit if needed) ------------------------------
set "PORT=8010"
set "XAMPP=C:\xampp"
rem -------------------------------------------------------------

cd /d "%~dp0"

if not exist artisan (
  echo [ERROR] artisan not found. Put this file in the project root folder.
  pause & exit /b 1
)

rem ---- 1. Open firewall port (runs once, asks for admin) ------
set "RULE=PermEase Port %PORT%"
netsh advfirewall firewall show rule name="%RULE%" >nul 2>&1
if not errorlevel 1 goto fwdone
net session >nul 2>&1
if errorlevel 1 (
  echo [1/6] Asking for administrator permission to open port %PORT%...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
echo [1/6] Opening firewall port %PORT%...
netsh advfirewall firewall add rule name="%RULE%" dir=in action=allow protocol=TCP localport=%PORT% profile=any >nul
rem  Allow ping too, handy for testing from the kiosk PC
netsh advfirewall firewall add rule name="PermEase Ping" dir=in action=allow protocol=icmpv4:8,any profile=any >nul
powershell -NoProfile -Command "$i=(Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -ne $null} | Select-Object -First 1).InterfaceIndex; if ($i) { Set-NetConnectionProfile -InterfaceIndex $i -NetworkCategory Private }" >nul 2>&1
:fwdone

rem ---- 2. Keep the laptop awake while plugged in --------------
powercfg /change standby-timeout-ac 0 >nul 2>&1
powercfg /change hibernate-timeout-ac 0 >nul 2>&1

rem ---- 3. Start MySQL (XAMPP) if it is not running ------------
tasklist /fi "imagename eq mysqld.exe" | find /i "mysqld.exe" >nul
if errorlevel 1 (
  if exist "%XAMPP%\mysql\bin\mysqld.exe" (
    echo [2/6] Starting MySQL...
    start "XAMPP MySQL" /min "%XAMPP%\mysql\bin\mysqld.exe" --defaults-file="%XAMPP%\mysql\bin\my.ini" --standalone
    timeout /t 6 >nul
  ) else (
    echo [WARN] MySQL is not running and %XAMPP% was not found. Start it manually.
  )
) else (
  echo [2/6] MySQL already running.
)

rem ---- 4. Install dependencies only if missing ----------------
if not exist vendor\autoload.php (
  echo [3/6] Installing PHP packages...
  call composer install --no-interaction
)
if not exist node_modules (
  echo [3/6] Installing Node packages...
  call npm install
)
if not exist .env (
  copy .env.example .env >nul
  php artisan key:generate
)

rem ---- 5. Build frontend if needed, clear caches --------------
rem  A stale public\hot file makes Laravel load assets from a dead
rem  Vite dev server (blank page on the kiosk), so always remove it.
if exist public\hot del /q public\hot
if not exist public\build\manifest.json (
  echo [4/6] Building frontend assets...
  call npm run build
)
echo [5/6] Running migrations and clearing caches...
php artisan migrate --force
php artisan config:clear >nul
php artisan view:clear >nul

rem ---- 6. Find the real network IP ----------------------------
set "LANIP="
for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "(Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up'} | Select-Object -First 1).IPv4Address.IPAddress"`) do set "LANIP=%%a"
if not defined LANIP (
  for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do if not defined LANIP set "LANIP=%%a"
  set "LANIP=%LANIP: =%"
)

if not defined LANIP (
  echo [WARN] Could not detect the network IP. Connect to Wi-Fi and run again.
  set "LANIP=NOT-CONNECTED"
)
set "OTHERURL=http://%LANIP%:%PORT%"
title PERMEASE Server - %OTHERURL%
> "%~dp0connect-address.txt" echo Other devices on the same Wi-Fi open: %OTHERURL%
echo %OTHERURL%| clip
rem  Popup stays on top of the kiosk window so the address is always visible
start "" powershell -NoProfile -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.Form -Property @{TopMost=$true}; [System.Windows.Forms.MessageBox]::Show($f, 'Other devices on the same Wi-Fi open this address:' + [Environment]::NewLine + [Environment]::NewLine + '%OTHERURL%' + [Environment]::NewLine + [Environment]::NewLine + '(Copied to clipboard. Also saved in connect-address.txt)', 'PERMEASE - Connect address', 'OK', 'Information') | Out-Null"

echo.
echo ============================================================
echo  PERMEASE server is running
echo    This laptop : http://127.0.0.1:%PORT%
echo    Other devices : %OTHERURL%
echo.
echo  Other devices on the same Wi-Fi open the address above.
echo  Keep this window open. Ctrl+C stops the server.
echo ============================================================
echo.

echo [6/6] Starting Laravel server...
if exist "%~dp0Launch-PermEase-Kiosk.bat" (start "" "%~dp0Launch-PermEase-Kiosk.bat" %PORT%) else start "" cmd /c "timeout /t 3 >nul & start http://127.0.0.1:%PORT%"
php artisan serve --host=0.0.0.0 --port=%PORT%

pause