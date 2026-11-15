# Registers a Windows Task Scheduler job that saves the day's Naver booking guests
# (both branches) to the desktop Excel files every night at 22:00.
# Usage:  npm run smartplace:bookings-schedule      (remove: npm run smartplace:bookings-unschedule)
# Kept ASCII-only on purpose: Windows PowerShell 5 misreads UTF-8 files without BOM.

param([switch]$Remove)

$TaskName = "WangjingBookingsNightly"

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed scheduled task: $TaskName"
  exit 0
}

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$runner = Join-Path $repo "scripts\smartplace\run-bookings-night.cmd"

$action = New-ScheduledTaskAction -Execute $runner -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Daily -At "22:00"
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 4) `
  -MultipleInstances IgnoreNew
# Interactive: runs only while you are signed in to Windows, so the Edge windows are usable.
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
  -Principal $principal -Description "Wangjing: save today's Naver booking guests to desktop Excel (Pangyo, Moran)" -Force | Out-Null

Write-Host "Registered scheduled task: $TaskName (daily 22:00)"
Write-Host "Log file: $repo\.smartplace\task.log"
