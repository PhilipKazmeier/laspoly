# Stop Windows LasPoly server started by start-win-server.ps1
param([int]$Pid = 0)

$ErrorActionPreference = "SilentlyContinue"
if ($Pid -gt 0) {
  Stop-Process -Id $Pid -Force
  exit 0
}
Get-CimInstance Win32_Process -Filter "Name='java.exe'" |
  Where-Object { $_.CommandLine -like '*LasPoly-server.jar*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
