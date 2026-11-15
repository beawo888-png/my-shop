# Registers a Windows Task Scheduler job that checks yesterday's LiveAd campaigns
# every morning at 08:20 and sends a KakaoTalk memo when they look weak or stopped.
# Usage:  npm run ads:watch-schedule      (remove: npm run ads:watch-unschedule)
# Kept ASCII-only on purpose: Windows PowerShell 5 misreads UTF-8 files without BOM.

param([switch]$Remove)

$TaskName = "WangjingLiveAdWatch"

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed scheduled task: $TaskName"
  exit 0
}

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$runner = Join-Path $repo "scripts\searchad\run-watch.cmd"

$action = New-ScheduledTaskAction -Execute $runner -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Daily -At "08:20"
# StartWhenAvailable: if the PC was off at 08:20, it runs as soon as the PC is back on.
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
  -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
  -Principal $principal -Description "Wangjing: daily LiveAd watch with KakaoTalk alert" -Force | Out-Null

Write-Host "Registered scheduled task: $TaskName (daily 08:20)"
Write-Host "Run it now to test:  Start-ScheduledTask -TaskName $TaskName"
Write-Host "Log file: $repo\.smartplace\livead-watch.log"
