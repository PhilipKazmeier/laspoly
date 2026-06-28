# LasPoly launcher - one file to download. Fetches the game jar, Java 21, and OpenJFX if needed.
$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot
$Jar = Join-Path $Root "LasPoly.jar"
$Origin = if ($env:LASPOLY_ORIGIN) { $env:LASPOLY_ORIGIN } else { "https://laspoly.brianwirth.de" }
$AuthUser = if ($env:LASPOLY_AUTH_USER) { $env:LASPOLY_AUTH_USER } else { "laspoly" }
$AuthPass = if ($env:LASPOLY_AUTH_PASS) { $env:LASPOLY_AUTH_PASS } else { "sbpp" }
$JarUrl = "$Origin/download/LasPoly.jar"
$JavaVersion = if ($env:LASPOLY_JAVA_VERSION) { $env:LASPOLY_JAVA_VERSION } else { "21" }
$JfxVersion = if ($env:JFX_VERSION) { $env:JFX_VERSION } else { "21.0.2" }
$CacheRoot = Join-Path $env:LOCALAPPDATA "laspoly"
$JreDir = Join-Path $CacheRoot "temurin-jre-$JavaVersion"
$JreExe = Join-Path $JreDir "bin\java.exe"
$JfxDir = Join-Path $CacheRoot "javafx-sdk-$JfxVersion"
$JfxLib = Join-Path $JfxDir "lib"
$JfxBin = Join-Path $JfxDir "bin"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host $Message -ForegroundColor Cyan
}

function Fail([string]$Message) {
  Write-Host ""
  Write-Host "FAILED: $Message" -ForegroundColor Red
  Write-Host "Keep using run.bat to start LasPoly (do not double-click the .jar file)." -ForegroundColor Yellow
  exit 1
}

function Find-ChildDir([string]$Parent, [string[]]$Patterns) {
  foreach ($pattern in $Patterns) {
    $found = Get-ChildItem -Path $Parent -Directory -Filter $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { return $found.FullName }
  }
  return $null
}

function Download-File {
  param(
    [string]$Label,
    [string]$Url,
    [string]$OutFile
  )

  Write-Step $Label
  $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
  $useAuth = $Url.StartsWith($Origin)
  if ($curl) {
    if ($useAuth) {
      & curl.exe -fL --progress-bar -u "${AuthUser}:${AuthPass}" -o $OutFile $Url
    } else {
      & curl.exe -fL --progress-bar -o $OutFile $Url
    }
    if ($LASTEXITCODE -ne 0) {
      Fail "Download failed: $Url"
    }
  } else {
    Write-Host "  (curl.exe not found - using slower fallback)"
    $ProgressPreference = 'SilentlyContinue'
    if ($useAuth) {
      $securePass = ConvertTo-SecureString $AuthPass -AsPlainText -Force
      $cred = New-Object System.Management.Automation.PSCredential($AuthUser, $securePass)
      Invoke-WebRequest -Uri $Url -OutFile $OutFile -Credential $cred
    } else {
      Invoke-WebRequest -Uri $Url -OutFile $OutFile
    }
    $ProgressPreference = 'Continue'
  }
  if (-not (Test-Path $OutFile)) {
    Fail "Download did not create $OutFile"
  }
  Write-Host "  done." -ForegroundColor DarkGreen
}

function Expand-Zip([string]$Zip, [string]$Dest) {
  Write-Host "  extracting ..."
  New-Item -ItemType Directory -Force -Path $Dest | Out-Null
  $tar = Get-Command tar.exe -ErrorAction SilentlyContinue
  if ($tar) {
    & tar.exe -xf $Zip -C $Dest
    if ($LASTEXITCODE -ne 0) {
      Fail "Could not extract $Zip"
    }
  } else {
    Expand-Archive -Path $Zip -DestinationPath $Dest -Force
  }
}

function Move-ToDir([string]$Source, [string]$Target) {
  if ($Source -eq $Target) { return }
  if (Test-Path $Target) { Remove-Item -Recurse -Force $Target }
  Move-Item $Source $Target
}

function Get-JavaMajor([string]$JavaPath) {
  # java -version writes to stderr; PowerShell 5.1 treats that as a terminating error with Stop.
  $line = cmd /c "`"$JavaPath`" -version 2>&1" | Select-Object -First 1
  $text = "$line"
  if ($text -match 'version "?(\d+)') { return [int]$Matches[1] }
  return 0
}

function Test-JavaCandidate([string]$JavaPath) {
  if (-not (Test-Path $JavaPath)) { return $false }
  return (Get-JavaMajor $JavaPath) -ge [int]$JavaVersion
}

function Ensure-Java {
  $candidates = @()
  $cmd = Get-Command java -ErrorAction SilentlyContinue
  if ($cmd) { $candidates += $cmd.Source }
  if (Test-Path $JreExe) { $candidates += $JreExe }

  foreach ($candidate in $candidates) {
    if (Test-JavaCandidate $candidate) {
      return $candidate
    }
  }

  New-Item -ItemType Directory -Force -Path $CacheRoot | Out-Null
  $zip = Join-Path $env:TEMP "temurin-$JavaVersion.zip"
  Download-File `
    -Label "[2/3] Java $JavaVersion runtime (~50 MB, one-time)" `
    -Url "https://api.adoptium.net/v3/binary/latest/$JavaVersion/ga/windows/x64/jre/hotspot/normal/eclipse?project=jdk" `
    -OutFile $zip
  if (Test-Path $JreDir) { Remove-Item -Recurse -Force $JreDir }
  $extractRoot = Join-Path $env:TEMP "temurin-extract-$JavaVersion"
  if (Test-Path $extractRoot) { Remove-Item -Recurse -Force $extractRoot }
  Expand-Zip $zip $extractRoot
  Remove-Item $zip -Force
  $extracted = Find-ChildDir $extractRoot @('jdk-*', 'jre-*')
  if (-not $extracted) {
    Fail "Java archive extracted but runtime folder was not found."
  }
  Move-ToDir $extracted $JreDir
  Remove-Item -Recurse -Force $extractRoot -ErrorAction SilentlyContinue
  if (-not (Test-Path $JreExe)) {
    Fail "java.exe missing after Java setup ($JreExe)."
  }
  return $JreExe
}

function Ensure-JavaFx {
  if (Test-Path $JfxLib) { return }

  New-Item -ItemType Directory -Force -Path $CacheRoot | Out-Null
  $zip = Join-Path $env:TEMP "openjfx-$JfxVersion.zip"
  Download-File `
    -Label "[3/3] JavaFX graphics (~85 MB, one-time)" `
    -Url "https://download2.gluonhq.com/openjfx/$JfxVersion/openjfx-${JfxVersion}_windows-x64_bin-sdk.zip" `
    -OutFile $zip
  if (Test-Path $JfxDir) { Remove-Item -Recurse -Force $JfxDir }
  $extractRoot = Join-Path $env:TEMP "openjfx-extract-$JfxVersion"
  if (Test-Path $extractRoot) { Remove-Item -Recurse -Force $extractRoot }
  Expand-Zip $zip $extractRoot
  Remove-Item $zip -Force
  $extracted = Find-ChildDir $extractRoot @("javafx-sdk-$JfxVersion", 'javafx-sdk-*')
  if (-not $extracted) {
    Fail "JavaFX archive extracted but sdk folder was not found."
  }
  Move-ToDir $extracted $JfxDir
  Remove-Item -Recurse -Force $extractRoot -ErrorAction SilentlyContinue
  if (-not (Test-Path $JfxLib)) {
    Fail "JavaFX lib folder missing after setup ($JfxLib)."
  }
}

try {
  $needsJar = -not (Test-Path $Jar)
  $needsJava = $true
  $cmd = Get-Command java -ErrorAction SilentlyContinue
  if ($cmd -and (Test-JavaCandidate $cmd.Source)) {
    $needsJava = $false
  } elseif (Test-JavaCandidate $JreExe) {
    $needsJava = $false
  }
  $needsJfx = -not (Test-Path $JfxLib)

  if ($needsJar -or $needsJava -or $needsJfx) {
    Write-Host "LasPoly first-time setup"
    Write-Host "  Downloads once, then cached locally. Typical total ~200 MB."
    Write-Host "  Always start the game with run.bat (not the .jar file)." -ForegroundColor DarkGray
    if (-not $needsJar) { Write-Host "  LasPoly.jar - already present" -ForegroundColor DarkGray }
    if (-not $needsJava) { Write-Host "  Java $JavaVersion - already present" -ForegroundColor DarkGray }
    if (-not $needsJfx) { Write-Host "  JavaFX - already present" -ForegroundColor DarkGray }
  }

  Write-Step "[1/3] LasPoly game"
  $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
  if ($curl -and (Test-Path $Jar)) {
    $jarBefore = (Get-Item $Jar).Length
    & curl.exe -fL --progress-bar -u "${AuthUser}:${AuthPass}" -z $Jar -o $Jar $JarUrl
    if ($LASTEXITCODE -ne 0) {
      Fail "Could not update LasPoly.jar from $JarUrl"
    }
    $jarAfter = (Get-Item $Jar).Length
    if ($jarBefore -ne $jarAfter) {
      Write-Host "  updated to latest version." -ForegroundColor DarkGreen
    } else {
      Write-Host "  up to date." -ForegroundColor DarkGray
    }
  } elseif ($needsJar) {
    Download-File -Label "[1/3] LasPoly game (~80 MB)" -Url $JarUrl -OutFile $Jar
  }
  if (-not (Test-Path $Jar)) {
    Fail "LasPoly.jar not found in $Root"
  }

  $Java = Ensure-Java
  Ensure-JavaFx
  $env:PATH = "$JfxBin;$env:PATH"

  Write-Step "Starting LasPoly ..."
  Write-Host "  Game window should open in a few seconds." -ForegroundColor DarkGray
  Write-Host "  Close this window only after you quit the game." -ForegroundColor DarkGray

  $JfxModules = 'javafx.controls,javafx.fxml,javafx.graphics,javafx.media,javafx.web'

  $savedEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & $Java `
      --module-path $JfxLib `
      --add-modules $JfxModules `
      -cp $Jar `
      de.hhn.seb.labsw.laspoly.main.Main
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $savedEap
  }

  if ($exitCode -ne 0) {
    Fail "LasPoly exited with error code $exitCode."
  }
}
catch {
  Fail $_.Exception.Message
}
