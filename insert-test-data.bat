@echo off
echo ============================================
echo INSERT TEST DATA FOR ORDER FLOW
echo ============================================
echo.

echo This will insert test data:
echo - 2 test users (customer1, store_owner1)
echo - 3 stores (Com Tam, Pho, Bun Bo)
echo - 12 products
echo - 1 customer address
echo.
echo Password for test users: password123
echo.
set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo [1/2] Connecting to MySQL...
mysql -u root -proot drone_delivery < insert-test-data.sql

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo √ Test data inserted successfully!
    echo ============================================
    echo.
    echo You can now test with:
    echo - Username: customer1
    echo - Password: password123
    echo.
    echo Or run: test-order-flow.bat
    echo.
) else (
    echo.
    echo [!] Error inserting data
    echo [!] Please check:
    echo - MySQL is running
    echo - Database 'drone_delivery' exists
    echo - Username/password is correct (root/root)
    echo.
)

pause

