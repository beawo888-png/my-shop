@echo off
rem Task Scheduler entry point for the evening gathering blog posts. Output goes to .smartplace\blog-moim-task.log
cd /d "%~dp0..\.."
if not exist .smartplace mkdir .smartplace
echo ===== %date% %time% >> .smartplace\blog-moim-task.log
call npm run moim:post >> .smartplace\blog-moim-task.log 2>&1
