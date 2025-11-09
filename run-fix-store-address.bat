@echo off
echo ========================================
echo Fix Store Address Coordinates
echo ========================================
echo.

REM Change these if your MySQL setup is different
set MYSQL_USER=root
set MYSQL_PASS=khang1412004
set MYSQL_DB=foodfast
set MYSQL_HOST=localhost
set MYSQL_PORT=3306

echo Running SQL script...
mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% -p%MYSQL_PASS% %MYSQL_DB% < fix-store-address-coordinates.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Store addresses updated
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR! Please check the error message
    echo ========================================
)

pause
