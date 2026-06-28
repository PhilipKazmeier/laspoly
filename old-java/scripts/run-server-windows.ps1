# LasPoly backend on Windows — clients use localhost:8090 (same host as WSL can't reach WSL server).
param([int]$Port = 8090)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Jar = Join-Path $Root "dist\LasPoly-server.jar"
$Jre = Join-Path $Root ".tools\win-jre\bin\java.exe"
$BaseUri = "http://0.0.0.0:${Port}/laspoly/"

if (-not (Test-Path $Jar)) {
  Write-Error "Missing $Jar - run ./gradlew serverJar in WSL first."
}
if (-not (Test-Path $Jre)) {
  Write-Error "Missing Windows JRE - run ./scripts/setup-windows-client.sh in WSL first."
}

Write-Host "LasPoly server on http://localhost:${Port}/laspoly/"
& $Jre "-Djava.awt.headless=true" -jar $Jar $BaseUri
