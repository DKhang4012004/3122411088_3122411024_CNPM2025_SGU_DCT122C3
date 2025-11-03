@echo off
title Turn OFF Windows Firewall (Public Network)
color 0E

echo ========================================
echo   TAT FIREWALL CHO PUBLIC NETWORK
echo ========================================
echo.
echo Dang tat Firewall cho Public network...
echo.

REM Turn off Public network firewall
netsh advfirewall set publicprofile state off

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Da tat Firewall cho Public network!
    echo.

    REM Also turn off Private network to be sure
    netsh advfirewall set privateprofile state off

    if %errorlevel% equ 0 (
        echo [SUCCESS] Da tat Firewall cho Private network!
    )

    echo.
    echo ========================================
    echo   CA 2 NETWORK DA TAT FIREWALL
    echo ========================================
    echo.
    echo Bay gio ban co the test tren dien thoai!
    echo.
    echo Tren dien thoai, truy cap:
    echo   http://192.168.1.86:8080/home/drone-simulator-mock.html
    echo.
    echo LUU Y: Phai dung URL co chu "MOCK" nhe!
    echo.
) else (
    echo.
    echo [ERROR] Khong the tat Firewall!
    echo Can chay voi quyen Administrator.
    echo.
    echo Chuot phai vao file nay -^> "Run as administrator"
    echo.
)

echo.
pause

