# Start LasPoly server on Windows (background). Prints PID to stdout.
# JAR must already be at %TEMP%\LasPoly-server.jar (local.sh copies it from WSL).
param([int]$Port = 8090)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Jre = Join-Path $Root ".tools\win-jre\bin\java.exe"
$Jar = Join-Path $env:TEMP "LasPoly-server.jar"
$BaseUri = "http://0.0.0.0:${Port}/laspoly/"

if (-not (Test-Path $Jar)) { Write-Error "Missing $Jar — run ./scripts/local.sh win-server first." }
if (-not (Test-Path $Jre)) { Write-Error "Missing $Jre — run ./scripts/setup-windows-client.sh in WSL." }

$proc = Start-Process -FilePath $Jre `
  -ArgumentList @("-Djava.awt.headless=true", "-jar", $Jar, $BaseUri) `
  -WindowStyle Hidden `
  -PassThru
Write-Output $proc.Id
