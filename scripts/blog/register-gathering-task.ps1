# Registers a Windows Task Scheduler job that posts the evening gathering articles
# (year-end party, company dinner, wedding invitation dinner, family gathering...) to the
# Pangyo and Moran Naver blogs: 1st post 18:00, 2nd post 18:30, backup run 19:10.
# Usage:  npm run moim:schedule      (remove: npm run moim:unschedule)
# Kept ASCII-only on purpose: Windows PowerShell 5 misreads UTF-8 files without BOM.

param([switch]$Remove)

$TaskName = "WangjingNaverBlogGathering"

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed scheduled task: $TaskName"
  exit 0
}

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$runner = Join-Path $repo "scripts\blog\run-gathering.cmd"

$action = New-ScheduledTaskAction -Execute $runner -WorkingDirectory $repo
# Each run posts only what is due and not yet posted today, so nothing is posted twice.
$triggers = @(
  (New-ScheduledTaskTrigger -Daily -At "18:00"),
  (New-ScheduledTaskTrigger -Daily -At "18:30"),
  (New-ScheduledTaskTrigger -Daily -At "19:10")
)
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
  -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $triggers -Settings $settings `
  -Principal $principal -Description "Wangjing: evening gathering posts (2 per branch) to Pangyo and Moran Naver blogs" -Force | Out-Null

Write-Host "Registered scheduled task: $TaskName (daily 18:00, 18:30, backup 19:10)"
Write-Host "Run it now to test:  Start-ScheduledTask -TaskName $TaskName"
Write-Host "Log file: $repo\.smartplace\blog-moim-task.log"
