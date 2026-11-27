@echo off
setlocal
title Finans Takip - Kurulum
set "KAYNAK=%~dp0"
set "HEDEF=%LOCALAPPDATA%\Finans Takip"

if not exist "%KAYNAK%Finans Takip.exe" (
  echo HATA: "Finans Takip.exe" bu klasorde bulunamadi.
  echo Zip dosyasina sag tiklayip "Tumunu ayikla" dedikten sonra, cikan klasorun icindeki Kur.bat dosyasini calistirin.
  pause
  exit /b 1
)

echo Finans Takip kuruluyor...
echo Hedef klasor: %HEDEF%
taskkill /IM "Finans Takip.exe" /F >nul 2>&1
if exist "%HEDEF%" rmdir /S /Q "%HEDEF%"
mkdir "%HEDEF%"
xcopy "%KAYNAK%*" "%HEDEF%\" /E /I /Y /Q >nul
if errorlevel 1 (
  echo HATA: Dosyalar kopyalanamadi.
  pause
  exit /b 1
)

echo Windows indirme engeli kaldiriliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%HEDEF%' -Recurse | Unblock-File"

echo Kisayollar olusturuluyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$w=New-Object -ComObject WScript.Shell; foreach($y in @([Environment]::GetFolderPath('Desktop'),[Environment]::GetFolderPath('Programs'))){ $k=$w.CreateShortcut((Join-Path $y 'Finans Takip.lnk')); $k.TargetPath='%HEDEF%\Finans Takip.exe'; $k.WorkingDirectory='%HEDEF%'; $k.IconLocation='%HEDEF%\Finans Takip.exe,0'; $k.Save() }"

echo.
echo Kurulum tamamlandi.
echo Masaustundeki "Finans Takip" simgesiyle programi acabilirsiniz.
echo Verileriniz Belgelerim\Finans Takip klasorunde saklanir.
echo.
start "" "%HEDEF%\Finans Takip.exe"
pause
