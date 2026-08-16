$ROOT = if ($PSScriptRoot) { $PSScriptRoot } else { "d:\DaVinci\Web Development\integrated-blockchain" }
$PGSQL_BIN = "$ROOT\pgsql\bin"
$PGSQL_DATA = "$ROOT\pgsql\data"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " Blockchain Anggaran - Startup Script & 8-Port Health Verifier" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# --- 0. Clean up lingering node / postgres processes on ports 2020-2027 if any ---
Write-Host "`n[0/4] Membersihkan port 2020-2027..." -ForegroundColor Yellow
$targetPorts = @(2020, 2021, 2022, 2023, 2024, 2026, 2027)
foreach ($p in $targetPorts) {
    $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
    foreach ($c in $conns) {
        if ($c.OwningProcess -and $c.OwningProcess -ne 0) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep 1

# --- 1. Start PostgreSQL on port 2025 ---
Write-Host "`n[1/4] Memulai PostgreSQL pada port 2025..." -ForegroundColor Yellow
$pgStatus = & "$PGSQL_BIN\pg_ctl.exe" status -D $PGSQL_DATA 2>&1
if ($pgStatus -like "*server is running*") {
    Write-Host "      PostgreSQL sudah berjalan." -ForegroundColor Green
} else {
    if (Test-Path "$PGSQL_DATA\postmaster.pid") {
        Remove-Item "$PGSQL_DATA\postmaster.pid" -Force
    }
    & "$PGSQL_BIN\pg_ctl.exe" start -D $PGSQL_DATA -o "-p 2025" -l "$ROOT\pgsql_log.txt"
    Start-Sleep 3
    $test = & "$PGSQL_BIN\psql.exe" -U postgres -h 127.0.0.1 -p 2025 -d postgres -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      PostgreSQL berhasil dimulai di port 2025." -ForegroundColor Green
    } else {
        Write-Host "      GAGAL memulai PostgreSQL! Cek log: $ROOT\pgsql_log.txt" -ForegroundColor Red
        exit 1
    }
}

# --- 2. Start Proxy API Server on port 2026 ---
Write-Host "`n[2/4] Memulai Proxy API Server pada port 2026..." -ForegroundColor Yellow
$proxyJob = Start-Process -FilePath "node" -ArgumentList "proxy.js" -WorkingDirectory "$ROOT\proxy" -WindowStyle Minimized -PassThru
Write-Host "      Proxy server dimulai (PID: $($proxyJob.Id))" -ForegroundColor Green

Start-Sleep 2

# --- 3. Start All 6 Dashboard Applications ---
Write-Host "`n[3/4] Memulai semua 6 dashboard..." -ForegroundColor Yellow

$apps = @(
    @{ name = "Transparansi Publik";     port = 2020; path = "$ROOT\apps\transparansi-anggaran\apps\web-next"; cmd = "/c npm run dev" },
    @{ name = "Dashboard Kementerian";   port = 2021; path = "$ROOT\apps\dashboard-kementerian";              cmd = "/c npx next dev -p 2021" },
    @{ name = "Dashboard Bank";          port = 2022; path = "$ROOT\apps\dashboard-bank";                     cmd = "/c npx next dev -p 2022" },
    @{ name = "Dashboard Auditor";       port = 2023; path = "$ROOT\apps\dashboard-auditor";                  cmd = "/c npm run dev" },
    @{ name = "Institusi Pendidikan";    port = 2024; path = "$ROOT\apps\dashboard-institusi-pendidikan";     cmd = "/c npx next dev -p 2024" },
    @{ name = "Dashboard APBD Lampung";  port = 2027; path = "$ROOT\apps\dashboard-apbd";                     cmd = "/c npm run dev" }
)

foreach ($app in $apps) {
    Write-Host "      Memulai $($app.name) pada port $($app.port)..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "$($app.cmd)" -WorkingDirectory $app.path -WindowStyle Minimized
    Start-Sleep 1
}

# --- 4. Verifikasi Kesehatan Seluruh Port (Health Check Loop) ---
Write-Host "`n[4/4] Memverifikasi status kesehatan seluruh 8 port..." -ForegroundColor Yellow
$allPortsList = @(
    @{ name = "Transparansi Publik";     port = 2020; url = "http://localhost:2020" },
    @{ name = "Dashboard Kementerian";   port = 2021; url = "http://localhost:2021/dashboard" },
    @{ name = "Dashboard Bank";          port = 2022; url = "http://localhost:2022/dashboard" },
    @{ name = "Dashboard Auditor";       port = 2023; url = "http://localhost:2023/dashboard" },
    @{ name = "Institusi Pendidikan";    port = 2024; url = "http://localhost:2024/dashboard" },
    @{ name = "Database PostgreSQL";     port = 2025; url = "postgresql://localhost:2025" },
    @{ name = "Proxy DB API Server";     port = 2026; url = "http://localhost:2026" },
    @{ name = "Dashboard APBD Lampung";  port = 2027; url = "http://localhost:2027/dashboard" }
)

$maxWaitSeconds = 45
$elapsed = 0

while ($elapsed -lt $maxWaitSeconds) {
    $offlineCount = 0
    foreach ($item in $allPortsList) {
        $conn = Get-NetTCPConnection -LocalPort $item.port -State Listen -ErrorAction SilentlyContinue
        if (-not $conn) {
            $offlineCount++
        }
    }
    if ($offlineCount -eq 0) { break }
    Start-Sleep 2
    $elapsed += 2
    Write-Host "      Menunggu server siap... ($elapsed / $maxWaitSeconds detik)" -ForegroundColor Gray
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host " STATUS SELURUH 8 SERVER DAN PORT:" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

foreach ($item in $allPortsList) {
    $conn = Get-NetTCPConnection -LocalPort $item.port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $pidNum = $conn.OwningProcess[0]
        Write-Host ("  {0,-26} (Port {1}) : ONLINE [PID {2}] -> {3}" -f $item.name, $item.port, $pidNum, $item.url) -ForegroundColor Green
    } else {
        Write-Host ("  {0,-26} (Port {1}) : OFFLINE" -f $item.name, $item.port) -ForegroundColor Red
    }
}

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "`nMenjaga agar semua server tetap berjalan. Tekan Ctrl+C di terminal untuk menghentikan." -ForegroundColor Yellow

while ($true) {
    Start-Sleep 10
}
