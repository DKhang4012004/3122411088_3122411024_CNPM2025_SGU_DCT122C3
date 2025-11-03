@echo off
title FoodFast Drone Server Launcher
color 0A
echo ========================================
echo   FOODFAST DRONE SERVER - QUICK START
echo ========================================
echo.

echo [1/4] Checking if server is running...
netstat -ano | findstr :8080 >nul
if %errorlevel% equ 0 (
    echo.
    color 0C
    echo ========================================
    echo   WARNING: Port 8080 is already in use!
    echo ========================================
    echo.
    echo Please stop the old server first (Ctrl+C in server window)
    echo.
    pause
    exit
) else (
    echo [OK] Port 8080 is free
)
echo.

echo [2/4] Getting your IP address...
echo Detecting network interfaces...
set IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set IP=%%b
        goto :found_ip
    )
)
:found_ip
if "%IP%"=="" (
    echo [WARNING] Could not detect IP automatically
    set IP=YOUR_IP_HERE
) else (
    echo [OK] Found IP address
)
echo.
echo ========================================
echo   YOUR COMPUTER IP: %IP%
echo ========================================
echo.

echo [3/4] Starting Spring Boot server...
echo Please wait... This may take 30-60 seconds
echo.
start cmd /k ".\mvnw.cmd spring-boot:run"
echo.

echo [4/4] Waiting for server to start (30 seconds)...
echo.
echo Please wait while Spring Boot initializes...
timeout /t 5 /nobreak >nul
echo [....] 5 seconds...
timeout /t 5 /nobreak >nul
echo [....] 10 seconds...
timeout /t 5 /nobreak >nul
echo [....] 15 seconds...
timeout /t 5 /nobreak >nul
echo [....] 20 seconds...
timeout /t 5 /nobreak >nul
echo [....] 25 seconds...
timeout /t 5 /nobreak >nul
echo [OK] 30 seconds - Server should be ready!
echo.

color 0A
cls
echo.
echo ========================================
echo   SERVER READY! THONG TIN QUAN TRONG
echo ========================================
echo.
echo [1] TEST TREN MAY TINH NAY (LOCALHOST):
echo     http://localhost:8080/drone-simulator-mock.html
echo.
echo [2] MO TREN DIEN THOAI (PHONE):
echo.
echo     *** COPY URL NAY VAO DIEN THOAI: ***
echo.
echo     http://%IP%:8080/drone-simulator-mock.html
echo.
echo     Hoac dung GPS that:
echo     http://%IP%:8080/drone-simulator.html
echo.
echo [3] KIEM TRA API:
echo     http://localhost:8080/drones
echo.
echo ========================================
echo   LUU Y QUAN TRONG:
echo ========================================
echo   - Dien thoai va may tinh PHAI CUNG WIFI
echo   - Tat Firewall neu khong ket noi duoc
echo   - Server dang chay o cua so CMD khac
echo ========================================
echo.
echo Nhan phim bat ky de mo trinh duyet tren may tinh nay...
echo (Hoac giu cua so nay mo va copy URL tren vao dien thoai)
echo.
pause >nul
start http://localhost:8080/drone-simulator-mock.html
echo.
echo Browser da mo! Cua so nay se KHONG DONG de ban xem thong tin.
echo.
echo GIU CUA SO NAY MO de xem lai URL!
echo Hoac nhan Ctrl+C de dong.
echo.
pause
