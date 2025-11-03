@echo off
echo ========================================
echo  NGROK RESTART HELPER
echo ========================================
echo.

echo Step 1: Killing existing ngrok processes...
taskkill /F /IM ngrok.exe 2>nul
if %errorlevel% equ 0 (
    echo [OK] Stopped existing ngrok
    timeout /t 2 >nul
) else (
    echo [INFO] No ngrok process found
)

echo.
echo Step 2: Starting ngrok on port 8080...
echo.
echo *** KEEP THIS WINDOW OPEN ***
echo.
start "ngrok" ngrok http 8080

echo.
echo Waiting for ngrok to start...
timeout /t 5 >nul

echo.
echo Step 3: Opening ngrok dashboard...
start http://localhost:4040

echo.
echo ========================================
echo  NEXT STEPS:
echo ========================================
echo 1. Check ngrok dashboard at http://localhost:4040
echo 2. Copy the HTTPS URL (e.g., https://xxx.ngrok-free.app)
echo 3. Call: POST http://localhost:8080/home/api/v1/ngrok/refresh
echo 4. Try payment init again
echo ========================================
echo.
pause

