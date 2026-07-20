$ROOT = "d:\DaVinci\Web Development\integrated-blockchain"
$PGSQL_BIN = "$ROOT\pgsql\bin"
$PGSQL_DATA = "$ROOT\pgsql\data"

Write-Host "=================================================================="
Write-Host " Blockchain Anggaran - Startup Script"
Write-Host "=================================================================="

# --- 1. Start PostgreSQL on port 2025 ---
Write-Host "`n[1/3] Memulai PostgreSQL pada port 2025..."
$pgStatus = & "$PGSQL_BIN\pg_ctl.exe" status -D $PGSQL_DATA 2>&1
if ($pgStatus -like "*server is running*") {
    Write-Host "      PostgreSQL sudah berjalan."
} else {
    & "$PGSQL_BIN\pg_ctl.exe" start -D $PGSQL_DATA -o "-p 2025 -k `"`"" -l "$ROOT\pgsql_log.txt"
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

# --- 3. Start All Dashboard Applications ---
Write-Host "`n[3/3] Memulai semua dashboard..."

$apps = @(
    @{ name = "Transparansi Publik";     port = 2020; path = "$ROOT\apps\transparansi-anggaran\apps\web-next" },
    @{ name = "Dashboard Kementerian";   port = 2021; path = "$ROOT\apps\dashboard-kementerian" },
    @{ name = "Dashboard Bank";          port = 2022; path = "$ROOT\apps\dashboard-bank" },
    @{ name = "Dashboard Auditor";       port = 2023; path = "$ROOT\apps\dashboard-auditor" },
    @{ name = "Institusi Pendidikan";    port = 2024; path = "$ROOT\apps\dashboard-institusi-pendidikan" }
)

foreach ($app in $apps) {
    Write-Host "      Memulai $($app.name) pada port $($app.port)..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev -- --port $($app.port)" -WorkingDirectory $app.path -WindowStyle Minimized
    Start-Sleep 1
}

Write-Host "`n=================================================================="
Write-Host " Semua server sedang dimulai. Tunggu sekitar 30 detik..."
Write-Host "=================================================================="
Write-Host ""
Write-Host " Link Dashboard:"
Write-Host "  Transparansi Publik   -> http://localhost:2020"
Write-Host "  Dashboard Kementerian -> http://localhost:2021"
Write-Host "  Dashboard Bank        -> http://localhost:2022"
Write-Host "  Dashboard Auditor     -> http://localhost:2023"
Write-Host "  Institusi Pendidikan  -> http://localhost:2024"
Write-Host "  Proxy DB API          -> http://localhost:2026"
Write-Host ""
Write-Host " Database PostgreSQL berjalan pada port 2025"
Write-Host "=================================================================="
