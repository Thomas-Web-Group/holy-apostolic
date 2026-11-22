$ErrorActionPreference = 'Stop'
$appDirectory = $PSScriptRoot
$appAddress = 'http://127.0.0.1:4317'
try {
  $status = Invoke-RestMethod -Uri "$appAddress/__app" -TimeoutSec 2
  if ($status.app -eq 'the-orthodox-way') { Start-Process $appAddress; exit 0 }
} catch { }
try {
  $nodeCommand = (Get-Command node.exe -ErrorAction Stop).Source
} catch {
  Write-Host 'Node.js 20 or newer is needed. Install Node.js, then run Start.cmd again.'
  exit 1
}
$runtimeDirectory = Join-Path $appDirectory '.runtime'
New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null
$serverFile = Join-Path $appDirectory 'server.cjs'
$appProcess = Start-Process -FilePath $nodeCommand -ArgumentList @(('"' + $serverFile + '"'), '--open') -WorkingDirectory $appDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDirectory 'server.log') -RedirectStandardError (Join-Path $runtimeDirectory 'server-error.log')
for ($attempt = 0; $attempt -lt 20; $attempt++) {
  Start-Sleep -Milliseconds 300
  try {
    $status = Invoke-RestMethod -Uri "$appAddress/__app" -TimeoutSec 1
    if ($status.app -eq 'the-orthodox-way') { Write-Host "Holy Apostolic: $appAddress"; exit 0 }
  } catch { }
  if ($appProcess.HasExited) { break }
}
Write-Host 'The app did not start. Check .runtime\server-error.log. Another app may be using port 4317.'
exit 1
