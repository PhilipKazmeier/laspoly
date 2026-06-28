@echo off
cd /d "%~dp0"
set "ORIGIN=https://laspoly.brianwirth.de"
if defined LASPOLY_ORIGIN set "ORIGIN=%LASPOLY_ORIGIN%"
if not defined LASPOLY_AUTH_USER set "LASPOLY_AUTH_USER=laspoly"
if not defined LASPOLY_AUTH_PASS set "LASPOLY_AUTH_PASS=sbpp"

REM Self-update this launcher when the server has a newer run.bat.
if not defined LASPOLY_NO_UPDATE (
  curl.exe -fsSL -u "%LASPOLY_AUTH_USER%:%LASPOLY_AUTH_PASS%" -o "%~dp0run.bat.remote" "%ORIGIN%/download/run.bat" 2>nul
  if exist "%~dp0run.bat.remote" (
    fc /b "%~f0" "%~dp0run.bat.remote" >nul 2>&1
    if errorlevel 1 (
      move /y "%~dp0run.bat.remote" "%~dp0run.bat.new" >nul
      echo Updating run.bat launcher...
      powershell -NoProfile -Command "Start-Sleep -Seconds 1; Move-Item -Force '%~dp0run.bat.new' '%~dp0run.bat'; Start-Process -FilePath '%~dp0run.bat' -WorkingDirectory '%~dp0'"
      exit /b 0
    )
    del "%~dp0run.bat.remote" 2>nul
  )
)

REM Always pull the latest PowerShell launcher (small file, keeps run.bat a one-click download).
curl.exe -fsSL -u "%LASPOLY_AUTH_USER%:%LASPOLY_AUTH_PASS%" -o "%~dp0run.ps1" "%ORIGIN%/download/run.ps1"
if errorlevel 1 (
  echo Could not download run.ps1 from %ORIGIN%
  echo Check your internet connection and try again.
  pause
  exit /b 1
)

echo.
echo LasPoly launcher - use this file every time. Do not open LasPoly.jar directly.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1"
set EXITCODE=%ERRORLEVEL%
if not "%EXITCODE%"=="0" (
  echo.
  echo LasPoly failed ^(exit code %EXITCODE%^). Press any key to close.
  pause >nul
  exit /b %EXITCODE%
)
