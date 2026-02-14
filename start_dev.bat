@echo off
echo Starting ZhongYiMedic Development Environment...

:: Start Backend
echo Starting Backend Service...
start "Backend API (Port 8000)" cmd /k "python web/app.py"

:: Start Frontend
echo Starting Web Frontend...
cd web/frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)
start "Web Frontend (Port 5173)" cmd /k "npm run dev"

echo.
echo ===================================================
echo  Development Environment Started!
echo ===================================================
echo  Backend API: http://localhost:8000/docs
echo  Web App:     http://localhost:5173
echo.
echo  Press any key to exit this launcher (servers will keep running)...
pause
