@echo off
title AKQuiz Show - Server & WebApp
cd /d "%~dp0"
echo ===================================================
echo     AKQuiz Show - Avvio Servizi Real-Time
echo ===================================================
echo.
echo Avvio del backend Python FastAPI / WebSockets...
start "AKQuiz Backend" cmd /k ".\venv\Scripts\python.exe backend\server.py"

timeout /t 2 /nobreak >nul

echo Apertura dell'interfaccia nel browser predefinito...
start http://localhost:8000

echo.
echo ===================================================
echo   Il server e' attivo!
echo   - Schermo PC:  http://localhost:8000
echo   - Per gli smartphone sulla rete Wi-Fi:
echo     Apri l'app sul PC e inquadra i QR Code a schermo!
echo ===================================================
pause
