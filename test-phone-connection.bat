@echo off
title FoodFast - Test Connection From Phone
color 0A
echo.
echo ========================================
echo   FoodFast - Kiem tra ket noi tu dien thoai
echo ========================================
echo.

echo [1/4] Dang kiem tra server...
netstat -ano | findstr :8080 >nul
if %errorlevel% equ 0 (
    echo [OK] Server dang chay tren port 8080
) else (
    echo [ERROR] Server chua chay!
    echo.
    echo Vui long chay: start-server.bat
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Dang lay dia chi IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr "192.168"') do (
    set IP=%%a
)
set IP=%IP: =%
echo [OK] IP cua ban la: %IP%

echo.
echo [3/4] Kiem tra Firewall...
netsh advfirewall show allprofiles state | findstr "ON" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Windows Firewall dang BAT
    echo.
    echo De test tren dien thoai, ban can:
    echo   1. Tat Windows Firewall tam thoi
    echo   2. Hoac cho phep port 8080 trong Firewall
    echo.
    set /p choice="Ban co muon mo huong dan tat Firewall? (Y/N): "
    if /i "%choice%"=="Y" (
        echo.
        echo HUONG DAN TAT WINDOWS FIREWALL:
        echo 1. Nhan Win + R
        echo 2. Go: firewall.cpl
        echo 3. Chon "Turn Windows Defender Firewall on or off"
        echo 4. Chon "Turn off" cho ca Private va Public
        echo 5. Nhan OK
        echo.
    )
) else (
    echo [OK] Firewall da tat
)

echo.
echo [4/4] Thong tin ket noi:
echo ========================================
echo.
echo Tren DIEN THOAI, mo trinh duyet va nhap:
echo.
echo   MOCK GPS (KHUYEN NGHI):
echo   http://%IP%:8080/home/drone-simulator-mock.html
echo.
echo   REAL GPS:
echo   http://%IP%:8080/home/drone-simulator.html
echo.
echo   TEST CONNECTION:
echo   http://%IP%:8080/home/test-connection.html
echo.
echo ========================================
echo.
echo LUU Y:
echo - Dien thoai phai cung mang WiFi voi may tinh
echo - Neu van loi "Failed to fetch", hay:
echo   1. Tat Windows Firewall
echo   2. Tat Antivirus tam thoi
echo   3. Khoi dong lai server
echo.
echo API Server URL de dien vao form:
echo   http://%IP%:8080/home
echo.
echo ========================================
echo.

set /p open="Ban co muon mo Test Connection tren may tinh? (Y/N): "
if /i "%open%"=="Y" (
    start http://localhost:8080/home/test-connection.html
)

echo.
pause

