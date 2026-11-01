# Registers a Windows Task Scheduler job that posts the daily menu article
# to the Pangyo and Moran Naver blogs (category: menu recommendation) at 10:00 (backup run at 10:40).
# Usage:  npm run blog:schedule      (remove: npm run blog:unschedule)
# Kept ASCII-only on purpose: Windows PowerShell 5 misreads UTF-8 files without BOM.

param([switch]$Remove)

$TaskName = "WangjingNaverBlogMenu"

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed scheduled task: $TaskName"
  exit 0
}

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$runner = Join-Path $repo "scripts\blog\run-daily.cmd"

$action = New-ScheduledTaskAction -Execute $runner -WorkingDirectory $repo
# 10:40 is a safety net: a branch already posted today is skipped, so nothing is posted twice.
$triggers = @(
  (New-ScheduledTaskTrigger -Daily -At "10:00"),
  (New-ScheduledTaskTrigger -Daily -At "10:40")
)
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
  -MultipleInstances IgnoreNew
# Interactive: runs only while you are signed in to Windows, so the logged-in browser profile is usable.
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $triggers -Settings $settings `
  -Principal $principal -Description "Wangjing: daily menu post to Pangyo and Moran Naver blogs" -Force | Out-Null

Write-Host "Registered scheduled task: $TaskName (daily 10:00, backup 10:40)"
Write-Host "Run it now to test:  Start-ScheduledTask -TaskName $TaskName"
Write-Host "Log file: $repo\.smartplace\blog-task.log"
