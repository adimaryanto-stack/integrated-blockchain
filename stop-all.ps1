$ROOT = if ($PSScriptRoot) { $PSScriptRoot } else { "d:\DaVinci\Web Development\integrated-blockchain" }
$PGSQL_BIN = "$ROOT\pgsql\bin"
$PGSQL_DATA = "$ROOT\pgsql\data"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " Menghentikan Seluruh 10 Layanan Integrated Blockchain..." -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Hentikan aplikasi pada port 2019-2026, 2028
$targetPorts = @(2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2028)
foreach ($p in $targetPorts) {
    $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
    foreach ($c in $conns) {
        if ($c.OwningProcess -and $c.OwningProcess -ne 0) {
            Write-Host "  Menghentikan proses pada Port $p (PID: $($c.OwningProcess))..." -ForegroundColor Yellow
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

# 2. Hentikan PostgreSQL lokal
if (Test-Path "$PGSQL_BIN\pg_ctl.exe") {
    $pgStatus = & "$PGSQL_BIN\pg_ctl.exe" status -D $PGSQL_DATA 2>&1
    if ($pgStatus -like "*server is running*") {
        Write-Host "  Menghentikan Database PostgreSQL (Port 2027)..." -ForegroundColor Yellow
        & "$PGSQL_BIN\pg_ctl.exe" stop -D $PGSQL_DATA -m fast 2>&1 | Out-Null
    }
}

Start-Sleep 1

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host " [SELESAI] Seluruh server dan database telah dimatikan dengan aman." -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
