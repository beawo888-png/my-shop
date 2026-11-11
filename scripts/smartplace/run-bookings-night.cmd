@echo off
rem Nightly 22:00 entry point: today's booking guests to the desktop Excel. Output goes to .smartplace\task.log
cd /d "%~dp0..\.."
if not exist .smartplace mkdir .smartplace
echo ===== %date% %time% [bookings-night] >> .smartplace\task.log
call npm run smartplace:bookings-night >> .smartplace\task.log 2>&1
