@echo off
echo Starting Process Scheduler...
echo.
echo Starting XAMPP MySQL...
start "" "C:\xampp\xampp-control.exe"
timeout /t 3

echo Starting Backend Server...
cd backend
start cmd /k "node server.js"
timeout /t 2

echo Opening Browser...
start "" "frontend\login.html"

echo.
echo Project is running!
pause