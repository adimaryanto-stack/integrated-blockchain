$ROOT = "d:\DaVinci\Web Development\integrated-blockchain"
$PGSQL_BIN = "$ROOT\pgsql\bin"
$PGSQL_DATA = "$ROOT\pgsql\data"

Write-Host "=================================================================="
Write-Host " Blockchain Anggaran - Startup Script (Dashboard Kementerian)"
Write-Host "=================================================================="

# --- 1. Start PostgreSQL on port 2025 ---
Write-Host "`n[1/3] Memulai PostgreSQL pada port 2025..."
$pgStatus = & "$PGSQL_BIN\pg_ctl.exe" status -D $PGSQL_DATA 2>&1
if ($pgStatus -like "*server is running*") {
    Write-Host "      PostgreSQL sudah berjalan."
} else {
    & "$PGSQL_BIN\pg_ctl.exe" start -D $PGSQL_DATA -o "-p 2025" -l "pgsql_log.txt"
    Start-Sleep 4
    $test = & "$PGSQL_BIN\psql.exe" -U postgres -h 127.0.0.1 -p 2025 -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      PostgreSQL berhasil dimulai." -ForegroundColor Green
    } else {
        Write-Host "      GAGAL memulai PostgreSQL! Cek log: $ROOT\pgsql_log.txt" -ForegroundColor Red
        exit 1
    }
}

# --- 2. Start Proxy API Server on port 2026 ---
Write-Host "`n[2/3] Memulai Proxy API Server pada port 2026..."
$proxyJob = Start-Process -FilePath "node" -ArgumentList "proxy\proxy.js" -WorkingDirectory $ROOT -WindowStyle Minimized -PassThru
Write-Host "      Proxy server dimulai (PID: $($proxyJob.Id))" -ForegroundColor Green

Start-Sleep 2

# --- 3. Start Dashboard Kementerian (Port 2021) ---
Write-Host "`n[3/3] Memulai Dashboard Kementerian pada port 2021..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev -- --port 2021" -WorkingDirectory "$ROOT\apps\dashboard-kementerian" -WindowStyle Minimized

Write-Host "`n=================================================================="
Write-Host " Server sedang dimulai. Tunggu sekitar 10-15 detik..."
Write-Host "=================================================================="
Write-Host ""
Write-Host " Link Dashboard Kementerian -> http://localhost:2021"
Write-Host " Proxy DB API               -> http://localhost:2026"
Write-Host " Database PostgreSQL berjalan pada port 2025"
Write-Host "=================================================================="

Write-Host "`nMenjaga agar server tetap berjalan. Tekan Ctrl+C untuk menghentikan."
while ($true) {
    Start-Sleep 10
}
