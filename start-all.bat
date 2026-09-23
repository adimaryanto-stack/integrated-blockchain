@echo off
title Integrated Blockchain - Platform Transparansi Anggaran
cd /d "%~dp0"

echo ==================================================================
echo  Integrated Blockchain - Platform Transparansi Anggaran
echo  Peluncur Otomatis Windows (1-Klik untuk Pemula)
echo ==================================================================
echo.
echo Sedang memeriksa prasyarat sistem...
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terinstall di komputer Anda!
    echo.
    echo Silakan unduh dan install Node.js versi LTS terlebih dahulu dari:
    echo   https://nodejs.org/
    echo.
    echo Setelah selesai menginstall Node.js, silakan klik 2x kembali file ini.
    echo.
    pause
    exit /b 1
)

echo Node.js terdeteksi.
echo Memulai seluruh 8 server dan database... Mohon tunggu sebentar...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-all.ps1"

if %errorlevel% neq 0 (
    echo.
    echo Jendela ditahan agar Anda dapat membaca pesan di atas.
    pause
)
