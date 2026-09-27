$ROOT = "d:\DaVinci\Web Development\integrated-blockchain"
$PGSQL_BIN = "$ROOT\pgsql\bin"
$PGSQL_DATA = "$ROOT\pgsql\data"

Write-Host "=================================================================="
Write-Host " Blockchain Anggaran - Backend & DB Startup"
Write-Host "=================================================================="

# --- 1. Start PostgreSQL on port 2027 ---
Write-Host "`n[1/2] Memulai PostgreSQL pada port 2027..."
$pgStatus = & "$PGSQL_BIN\pg_ctl.exe" status -D $PGSQL_DATA 2>&1
if ($pgStatus -like "*server is running*") {
    Write-Host "      PostgreSQL sudah berjalan."
} else {
    if (Test-Path "$PGSQL_DATA\postmaster.pid") {
        Remove-Item "$PGSQL_DATA\postmaster.pid" -Force
    }
    & "$PGSQL_BIN\pg_ctl.exe" start -D $PGSQL_DATA -o "-p 2027" -l "pgsql_log.txt"
    Start-Sleep 4
    $test = & "$PGSQL_BIN\psql.exe" -U postgres -h 127.0.0.1 -p 2027 -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      PostgreSQL berhasil dimulai." -ForegroundColor Green
    } else {
        Write-Host "      GAGAL memulai PostgreSQL! Cek log: $ROOT\pgsql_log.txt" -ForegroundColor Red
        exit 1
    }
}

# --- 2. Start Proxy API Server on port 2028 ---
Write-Host "`n[2/2] Memulai Proxy API Server pada port 2028..."
$proxyJob = Start-Process -FilePath "node" -ArgumentList "proxy\proxy.js" -WorkingDirectory $ROOT -WindowStyle Minimized -PassThru
Write-Host "      Proxy server dimulai (PID: $($proxyJob.Id))" -ForegroundColor Green

Write-Host "`n=================================================================="
Write-Host " Backend & Database siap."
Write-Host "  Proxy DB API          -> http://localhost:2028"
Write-Host "  Database PostgreSQL   -> Port 2027"
Write-Host "=================================================================="

Write-Host "`nMenjaga agar DB & Proxy tetap berjalan. Tekan Ctrl+C untuk menghentikan."
while ($true) {
    Start-Sleep 10
}
