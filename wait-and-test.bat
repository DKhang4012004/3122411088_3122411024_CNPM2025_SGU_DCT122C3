@echo off
title Test Server Ready
color 0B
echo ========================================
echo   WAITING FOR SERVER TO START...
echo ========================================
echo.

:wait_loop
echo Checking server...
curl -s http://localhost:8080/home/drones >nul 2>&1
if %errorlevel% neq 0 (
    echo Server not ready yet, waiting 3 seconds...
    timeout /t 3 /nobreak >nul
    goto wait_loop
)

echo.
echo ========================================
echo   SERVER IS READY!
echo ========================================
echo.

echo Testing HTML file access...
curl -I http://localhost:8080/home/test-drone-delivery-flow.html

echo.
echo.
echo Opening test page in browser...
start http://localhost:8080/home/test-drone-delivery-flow.html

echo.
echo ========================================
echo   ALTERNATIVE URLS TO TRY:
echo ========================================
echo.
echo 1. http://localhost:8080/home/test-drone-delivery-flow.html
echo 2. http://localhost:8080/home/drone-simulator-mock.html
echo 3. http://localhost:8080/home/test-delivery.html
echo 4. http://localhost:8080/home/drones (API test)
echo.

pause

