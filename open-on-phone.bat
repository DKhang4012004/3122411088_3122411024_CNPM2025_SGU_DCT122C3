@echo off
title FoodFast - Mo trang tren dien thoai
color 0A

echo.
echo ========================================
echo   FoodFast - Huong dan test tren DT
echo ========================================
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr "192.168"') do (
    set IP=%%a
)
set IP=%IP: =%

echo IP cua ban: %IP%
echo.
echo ========================================
echo.
echo Tren DIEN THOAI, mo trinh duyet va nhap:
echo.
echo   TRANG CHU:
echo   http://%IP%:8080/home
echo.
echo   HOAC TRUC TIEP MOCK GPS:
echo   http://%IP%:8080/home/drone-simulator-mock.html
echo.
echo ========================================
echo.
echo LUU Y:
echo - Firewall da tat
echo - Cung mang WiFi
echo - Dung URL co chu "mock"
echo.

set /p open="Mo trang tren may tinh? (Y/N): "
if /i "%open%"=="Y" (
    start http://localhost:8080/home
)

echo.
pause

