@echo off
REM Test Profile Management - Clear cache and reload
echo ========================================
echo   Test Profile Management
echo ========================================
echo.

echo [1] Clearing browser cache...
echo Please manually clear browser cache:
echo - Chrome: Ctrl + Shift + Delete
echo - Or use Incognito mode (Ctrl + Shift + N)
echo.

echo [2] Testing steps:
echo.
echo Step 1: Login with any account
echo   - CUSTOMER: customer/password
echo   - STORE_OWNER: owner/password  
echo   - ADMIN: admin/password
echo.

echo Step 2: Check dropdown menu
echo   Expected to see:
echo   - User's full name (header)
echo   - Email address
echo   - Role badges (colored)
echo   - "Tai khoan" link
echo   - "Don hang cua toi" link
echo   - "Dang xuat" link
echo.

echo Step 3: Click "Tai khoan"
echo   Expected: Go to profile.html page
echo.

echo Step 4: Test profile features
echo   - View/Edit personal info
echo   - Change password
echo   - Check security info
echo.

echo ========================================
echo Opening browser...
echo ========================================
timeout /t 2 >nul

start http://localhost:8080/home/

echo.
echo If dropdown still shows old menu:
echo 1. Clear browser cache completely
echo 2. Hard reload: Ctrl + Shift + R
echo 3. Or use Incognito mode
echo.
pause
