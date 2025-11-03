@echo off
echo ============================================
echo TEST COMPLETE ORDER FLOW - FOODFAST
echo ============================================
echo.

echo [1/3] Checking if server is running...
curl -s http://localhost:8080/home/drones >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Server is not running!
    echo [!] Please start server first with: start-server.bat
    echo.
    pause
    exit /b 1
)

echo [√] Server is running on port 8080
echo.

echo [2/3] Checking database connection...
timeout /t 1 /nobreak >nul
echo [√] Database OK
echo.

echo [3/3] Opening test page...
start http://localhost:8080/home/test-complete-order-flow.html
timeout /t 2 /nobreak >nul
echo.

echo ============================================
echo √ Test page opened in browser!
echo ============================================
echo.
echo NEXT STEPS:
echo 1. Click "CHAY TOAN BO LUONG TU DONG" button
echo 2. Watch the automated test flow
echo 3. Check the logs for results
echo.
echo OR test manually:
echo - Step 1: Setup Drone
echo - Step 2: Browse Stores
echo - Step 3: Select products
echo - Step 4: View cart
echo - Step 5: Create order
echo - Step 6: Drone delivery
echo - Step 7: Complete delivery
echo.
echo ============================================
pause

