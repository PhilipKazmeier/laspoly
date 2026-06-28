# Native Windows LasPoly client - second player alongside WSL client.
param([int]$ServerIndex = 1)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Jar = Join-Path $Root "dist\LasPoly.jar"
$JfxVersion = if ($env:JFX_VERSION) { $env:JFX_VERSION } else { "21.0.2" }
$Jre = Join-Path $Root ".tools\win-jre\bin\java.exe"
$JfxBin = Join-Path $Root ".tools\win-javafx\javafx-sdk-$JfxVersion\bin"
$JfxLib = Join-Path $Root ".tools\win-javafx\javafx-sdk-$JfxVersion\lib"

if (-not (Test-Path $Jar)) {
  Write-Error "Missing $Jar - run ./gradlew jar in WSL first."
}
if (-not (Test-Path $Jre)) {
  Write-Error "Missing Windows JRE - run ./scripts/setup-windows-client.sh in WSL first."
}
if (-not (Test-Path $JfxLib)) {
  Write-Error "Missing Windows JavaFX - run ./scripts/setup-windows-client.sh in WSL first."
}

$env:PATH = "$JfxBin;$env:PATH"

Write-Host "LasPoly Windows client, server index $ServerIndex on localhost:8090"
& $Jre `
  --module-path $JfxLib `
  --add-modules javafx.controls,javafx.fxml,javafx.graphics,javafx.media `
  -cp $Jar `
  de.hhn.seb.labsw.laspoly.main.Main `
  $ServerIndex
