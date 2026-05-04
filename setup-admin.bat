@echo off
echo Creating admin user...

curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Admin\",\"email\":\"admin@pro-motion.com\",\"password\":\"admin123\",\"role\":\"admin\"}" 2>nul

echo Done!
pause