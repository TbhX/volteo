@echo off
cd /d "%~dp0"
echo VOLTEO - Ouvrez http://localhost:8080 dans votre navigateur.
echo Laissez cette fenetre ouverte. Ctrl+C pour arreter.
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 server\app.py --serve
) else (
  python server\app.py --serve
)
pause
