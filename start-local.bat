@echo off
title Turkiye 3D Afet Atlasi - Yerel Sunucu
echo ========================================================
echo   Turkiye 3D Afet ve Toplanma Atlasi
echo   Alan Adi: https://afet.live
echo   Yerel Adres: http://localhost:5173
echo ========================================================
echo.
cd /d "%~dp0"
echo Tarayicida aciliyor...
start http://localhost:5173
npm run dev
pause
