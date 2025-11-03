@echo off
title Allow Port 8080 in Firewall
color 0C

echo ========================================
echo   FoodFast - Cau hinh Firewall
echo ========================================
echo.
echo Script nay se them rule cho phep port 8080
echo trong Windows Firewall.
echo.
echo Luu y: Can quyen Administrator!
echo.
pause

echo.
echo Dang them Firewall rule...
echo.

REM Xoa rule cu neu co
netsh advfirewall firewall delete rule name="FoodFast Server Port 8080" >nul 2>&1

REM Them rule moi
netsh advfirewall firewall add rule name="FoodFast Server Port 8080" dir=in action=allow protocol=TCP localport=8080

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Da them Firewall rule thanh cong!
    echo.
    echo Port 8080 da duoc cho phep trong Windows Firewall.
    echo Ban co the test tren dien thoai bay gio.
    echo.
) else (
    echo.
    echo [ERROR] Khong the them Firewall rule!
    echo.
    echo Nguyen nhan:
    echo - Can chay voi quyen Administrator
    echo - Hoac Windows Firewall chua bat
    echo.
    echo Giai phap:
    echo 1. Chuot phai vao file nay -^> "Run as administrator"
    echo 2. Hoac tat Windows Firewall tam thoi
    echo.
)

echo.
echo Nhan phim bat ky de dong...
pause >nul

