@echo off
title FoodFast - Test Drone Delivery
color 0A

echo.
echo ========================================
echo   Test Drone Delivery
echo ========================================
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr "192.168"') do (
    set IP=%%a
)
set IP=%IP: =%

echo IP cua ban: %IP%
echo.
echo Mo trang test delivery...
echo.

start http://localhost:8080/home/test-delivery.html

echo.
echo Trang da mo tren trinh duyet!
echo.
echo Tren dien thoai, truy cap:
echo   http://%IP%:8080/home/test-delivery.html
echo.
pause

