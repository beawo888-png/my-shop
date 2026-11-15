@echo off
rem Task Scheduler entry point for the LiveAd watch. Output goes to .smartplace\livead-watch.log
cd /d "%~dp0..\.."
if not exist .smartplace mkdir .smartplace
echo ===== %date% %time% >> .smartplace\livead-watch.log
call npm run ads:watch >> .smartplace\livead-watch.log 2>&1
