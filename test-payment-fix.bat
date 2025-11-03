@echo off
REM Quick Test Payment Flow
REM Run this after starting server

echo ============================================
echo   PAYMENT FIX - QUICK TEST
echo ============================================
echo.

echo [1/3] Checking if server is running...
curl -s http://localhost:8080/home/ >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Server is not running!
    echo Please run: start-server.bat
    pause
    exit /b 1
)
echo [OK] Server is running

echo.
echo [2/3] Testing Payment Init Endpoint...
echo POST /api/v1/payments/init
echo.

REM Note: Need valid token and orderId for real test
echo To test manually:
echo 1. Open browser: http://localhost:8080/home/
echo 2. Login with test account
echo 3. Add products to cart
echo 4. Click "Thanh toan" button
echo 5. Should redirect to VNPay
echo.

echo [3/3] Opening browser for manual test...
start http://localhost:8080/home/

echo.
echo ============================================
echo   QUICK MANUAL TEST STEPS:
echo ============================================
echo.
echo 1. Login (username: testuser, password: 123456)
echo 2. Go to Stores page
echo 3. Add 2-3 products to cart
echo 4. Go to Cart page
echo 5. Click "Thanh toan" (Checkout)
echo 6. Confirm order
echo.
echo EXPECTED RESULT:
echo - Message: "Tao don hang thanh cong!"
echo - Redirect to VNPay page
echo - URL: https://sandbox.vnpayment.vn/...
echo.
echo If it works, the payment fix is successful!
echo.
echo ============================================
pause

