@echo off
cd /d "%~dp0"
echo Starting Point Map Local Server...
powershell -NoProfile -ExecutionPolicy Bypass -File run-server.ps1
pause
