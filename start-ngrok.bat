@echo off
echo Starting ngrok tunnel on port 8080...
echo.
echo Press Ctrl+C to stop ngrok
echo.
start /B ngrok http 8080 --log=stdout
timeout /t 5
echo.
echo Ngrok is running!
echo Web interface: http://localhost:4040
echo.
pause

