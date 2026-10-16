# Registers a Windows Task Scheduler job that posts Naver Smart Place news
# for both branches every morning at 09:00 (backup run at 09:40).
# Usage:  npm run smartplace:schedule      (remove: npm run smartplace:unschedule)
# Kept ASCII-only on purpose: Windows PowerShell 5 misreads UTF-8 files without BOM.

param([switch]$Remove)

$TaskName = "WangjingSmartplaceNews"

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed scheduled task: $TaskName"
  exit 0
}

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$runner = Join-Path $repo "scripts\smartplace\run-daily.cmd"

$action = New-ScheduledTaskAction -Execute $runner -WorkingDirectory $repo
# 09:40 is a safety net: a branch already posted today is skipped, so nothing is posted twice.
$triggers = @(
  (New-ScheduledTaskTrigger -Daily -At "09:00"),
  (New-ScheduledTaskTrigger -Daily -At "09:40")
)
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
  -MultipleInstances IgnoreNew
# Interactive: runs only while you are signed in to Windows, so the logged-in Chrome profile is usable.
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $triggers -Settings $settings `
  -Principal $principal -Description "Wangjing: post Naver Smart Place news for Pangyo and Moran" -Force | Out-Null

Write-Host "Registered scheduled task: $TaskName (daily 09:00, backup 09:40)"
Write-Host "Run it now to test:  Start-ScheduledTask -TaskName $TaskName"
Write-Host "Log file: $repo\.smartplace\task.log"
