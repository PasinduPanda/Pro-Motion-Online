@echo off
echo Starting PhysioCare PMS...
echo.

echo Starting backend...
start "PhysioCare Backend" cmd /k "cd /d %~dp0backend && node src\index.js"
timeout /t 2 /nobreak > nul

echo Starting frontend...
start "PhysioCare Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo Opening browser...
start http://localhost:3000

echo.
echo PhysioCare is running!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause