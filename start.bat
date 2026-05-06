@echo off
echo PRO-Motion Starting...

cd /d "%~dp0backend"
npm install multer --save
npx prisma db push
node prisma/seed.js
start "Backend" cmd /k "node src\index.js"

cd /d "%~dp0frontend"
start "Frontend" cmd /k "npm run dev"

timeout /t 5 /nobreak
start http://localhost:3000

echo.
echo ====================
echo READY!
echo ====================
echo Go to: http://localhost:3000
echo Login: admin@physiocare.com
echo Pass: admin123
echo ====================
pause