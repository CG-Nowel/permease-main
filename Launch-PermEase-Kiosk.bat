@echo off
:: PermEase Kiosk Launcher with Silent Auto-Printing
:: This launches Chrome with --kiosk-printing enabled so no "Print" button clicks are needed.

set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME_PATH% (
    set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

echo ========================================================
echo    PERMEASE KIOSK - DIRECT EPSON PRINTER MODE
echo ========================================================
echo Launching Kiosk with Silent Auto-Printing...
echo.

start "" %CHROME_PATH% --kiosk-printing --user-data-dir="%LOCALAPPDATA%\PermEaseKiosk" --app="http://localhost:8000/kiosk"

exit
