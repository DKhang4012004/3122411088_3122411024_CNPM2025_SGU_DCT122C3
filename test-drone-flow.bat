@echo off
title Test Drone Delivery Flow
color 0A
echo ========================================
echo   TEST DRONE DELIVERY: A to B
echo ========================================
echo.

echo Opening test page in browser...
echo.
echo URL: http://localhost:8080/test-drone-delivery-flow.html
echo.

start http://localhost:8080/test-drone-delivery-flow.html

echo.
echo ========================================
echo   INSTRUCTIONS:
echo ========================================
echo.
echo 1. Wait for page to load
echo 2. Click "CHAY TU DONG TOAN BO"
echo 3. Watch the drone fly from A to B!
echo.
echo Alternative: Use manual controls
echo   - Step 1: Register Drone
echo   - Step 2: Start Flight (IN_FLIGHT)
echo   - Step 3: Move to Point B (Auto)
echo   - Step 4: Complete Delivery (AVAILABLE)
echo.
echo ========================================
echo   MONITORING:
echo ========================================
echo.
echo View all drones:
echo   http://localhost:8080/home/drones
echo.
echo View specific drone:
echo   http://localhost:8080/home/drones/DRONE001
echo.
echo ========================================
echo.

pause

