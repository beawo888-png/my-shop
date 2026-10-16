@echo off
rem Task Scheduler entry point. Output goes to .smartplace\task.log
cd /d "%~dp0..\.."
if not exist .smartplace mkdir .smartplace
echo ===== %date% %time% >> .smartplace\task.log
call npm run smartplace:post >> .smartplace\task.log 2>&1
