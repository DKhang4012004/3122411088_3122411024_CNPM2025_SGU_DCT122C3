@echo off
echo ============================================
echo  Fix Drone Model Column Length
echo ============================================
echo.
echo This script will fix the drone model column length issue
echo by running a SQL update on the database.
echo.
echo Make sure MySQL is running before proceeding!
echo.
pause

echo Running SQL fix...
mysql -u root -proot drone_delivery < fix-drone-model-column.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo  SUCCESS! Database updated successfully.
    echo ============================================
    echo.
    echo The drone model column has been updated to VARCHAR(200).
    echo You can now restart your application.
) else (
    echo.
    echo ============================================
    echo  ERROR! Failed to update database.
    echo ============================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. Database credentials are correct (root/root)
    echo 3. The database 'drone_delivery' exists
)

echo.
pause

