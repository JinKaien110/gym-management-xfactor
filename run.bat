@echo off

echo Starting Backend...
start cmd /k "cd /d %~dp0backend && npm run dev"

echo Starting Frontend...
start cmd /k "cd /d %~dp0frontend && npm run dev"

pause
