@echo off
setlocal
title Finans Takip - Kaldir
set "HEDEF=%LOCALAPPDATA%\Finans Takip"
echo Finans Takip programi kaldirilacak. Verileriniz (Belgelerim\Finans Takip) SILINMEZ.
pause
taskkill /IM "Finans Takip.exe" /F >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "foreach($y in @([Environment]::GetFolderPath('Desktop'),[Environment]::GetFolderPath('Programs'))){ Remove-Item -LiteralPath (Join-Path $y 'Finans Takip.lnk') -ErrorAction SilentlyContinue }"
cd /d "%TEMP%"
if exist "%HEDEF%" rmdir /S /Q "%HEDEF%"
echo Program kaldirildi.
pause
