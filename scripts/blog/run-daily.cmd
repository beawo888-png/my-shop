@echo off
rem Task Scheduler entry point for the daily Naver blog post. Output goes to .smartplace\blog-task.log
cd /d "%~dp0..\.."
if not exist .smartplace mkdir .smartplace
echo ===== %date% %time% >> .smartplace\blog-task.log
call npm run blog:post >> .smartplace\blog-task.log 2>&1
