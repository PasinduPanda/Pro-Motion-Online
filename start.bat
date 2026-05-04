@echo off
echo Starting Pro-Motion PMS...

:: Kill existing processes
taskkill /F /IM node.exe /T 2>nul

echo Starting Backend...
start "Pro-Motion Backend" cmd /k "cd /d %~dp0backend && node src\index.js"

echo Starting Frontend...
start "Pro-Motion Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Waiting for servers to start...
timeout /t 5 /nobreak >nul

start http://localhost:3000

echo Pro-Motion is running!
pause