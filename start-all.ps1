$ROOT = if ($PSScriptRoot) { $PSScriptRoot } else { "d:\DaVinci\Web Development\integrated-blockchain" }
Set-Location -Path $ROOT

$PGSQL_BIN = "$ROOT\pgsql\bin"
$PGSQL_DATA = "$ROOT\pgsql\data"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " Integrated Blockchain - Peluncur Otomatis & Verifikator 10 Port" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# --- 0. Prasyarat: Cek Node.js & npm ---
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
$npmCheck = Get-Command npm -ErrorAction SilentlyContinue
if (-not $nodeCheck -or -not $npmCheck) {
    Write-Host "`n[ERROR] Node.js belum terpasang di komputer Anda!" -ForegroundColor Red
    Write-Host "Silakan unduh dan pasang Node.js (versi LTS) dari: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Setelah instalasi selesai, buka kembali file ini.`n" -ForegroundColor Yellow
    Read-Host "Tekan Enter untuk keluar..."
    exit 1
}

# --- 1. Membersihkan port 2019-2028 bila ada sisa proses lama ---
Write-Host "`n[1/6] Memeriksa dan membersihkan port 2019-2028..." -ForegroundColor Yellow
$targetPorts = @(2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028)
foreach ($p in $targetPorts) {
    $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
    foreach ($c in $conns) {
        if ($c.OwningProcess -and $c.OwningProcess -ne 0) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep 1

# --- 2. Cek Konfigurasi Lingkungan (.env.local) ---
Write-Host "`n[2/6] Memeriksa file konfigurasi environment (.env.local)..." -ForegroundColor Yellow
$webEnv = "$ROOT\apps\transparansi-anggaran\apps\web-next\.env.local"
$proxyEnv = "$ROOT\proxy\.env"
if (-not (Test-Path $webEnv) -or -not (Test-Path $proxyEnv)) {
    Write-Host "      Menyiapkan file konfigurasi lingkungan (.env.local)..." -ForegroundColor Cyan
    & node "$ROOT\scripts\setup-env.js" | Out-Null
    Write-Host "      Konfigurasi .env.local berhasil dibuat." -ForegroundColor Green
} else {
    Write-Host "      File konfigurasi .env.local sudah lengkap." -ForegroundColor Green
}

# --- 3. Memulai Database PostgreSQL pada port 2027 ---
Write-Host "`n[3/6] Memulai Database PostgreSQL pada port 2027..." -ForegroundColor Yellow
$hasLocalPg = (Test-Path "$PGSQL_BIN\pg_ctl.exe") -and (Test-Path $PGSQL_DATA)

if ($hasLocalPg) {
    $pgStatus = & "$PGSQL_BIN\pg_ctl.exe" status -D $PGSQL_DATA 2>&1
    if ($pgStatus -like "*server is running*") {
        Write-Host "      PostgreSQL lokal sudah berjalan." -ForegroundColor Green
    } else {
        if (Test-Path "$PGSQL_DATA\postmaster.pid") {
            Remove-Item "$PGSQL_DATA\postmaster.pid" -Force -ErrorAction SilentlyContinue
        }
        & "$PGSQL_BIN\pg_ctl.exe" start -D $PGSQL_DATA -o "-p 2027" -l "$ROOT\pgsql_log.txt"
        
        Write-Host "      Menunggu PostgreSQL siap menerima koneksi..." -ForegroundColor Gray
        $pgReady = $false
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep 1
            $test = & "$PGSQL_BIN\psql.exe" -U postgres -h 127.0.0.1 -p 2027 -d postgres -c "SELECT 1" 2>&1
            if ($LASTEXITCODE -eq 0) {
                $pgReady = $true
                break
            }
        }
        
        if ($pgReady) {
            Write-Host "      PostgreSQL berhasil dimulai di port 2027." -ForegroundColor Green
        } else {
            Write-Host "      GAGAL memulai PostgreSQL! Cek log: $ROOT\pgsql_log.txt" -ForegroundColor Red
            Read-Host "Tekan Enter untuk keluar..."
            exit 1
        }
    }
} else {
    $extConn = Get-NetTCPConnection -LocalPort 2027 -State Listen -ErrorAction SilentlyContinue
    if ($extConn) {
        Write-Host "      PostgreSQL terdeteksi aktif pada port 2027." -ForegroundColor Green
    } else {
        Write-Host "      [INFO] PostgreSQL portabel tidak ditemukan. Menunggu database eksternal..." -ForegroundColor Gray
    }
}

# --- 4. Memulai Proxy API Server pada port 2028 ---
Write-Host "`n[4/6] Memulai Proxy API Gateway pada port 2028..." -ForegroundColor Yellow
if (-not (Test-Path "$ROOT\proxy\node_modules")) {
    Write-Host "      Memasang dependensi proxy (npm install)..." -ForegroundColor Cyan
    Push-Location "$ROOT\proxy"
    cmd.exe /c "npm install --silent"
    Pop-Location
}
$proxyJob = Start-Process -FilePath "node" -ArgumentList "proxy.js" -WorkingDirectory "$ROOT\proxy" -WindowStyle Minimized -PassThru
Write-Host "      Proxy API Server aktif di port 2028 (PID: $($proxyJob.Id))" -ForegroundColor Green
Start-Sleep 1

# --- 5. Memulai Seluruh 8 Portal Aplikasi Dashboard ---
Write-Host "`n[5/6] Memulai seluruh 8 portal dashboard..." -ForegroundColor Yellow

$apps = @(
    @{ name = "Portal Publik Civic-Tech"; port = 2019; path = "$ROOT\apps\dashboard-publik";                   cmd = "npm run dev" },
    @{ name = "Transparansi Publik";     port = 2020; path = "$ROOT\apps\transparansi-anggaran\apps\web-next"; cmd = "npm run dev" },
    @{ name = "Dashboard Kementerian";   port = 2021; path = "$ROOT\apps\dashboard-kementerian";              cmd = "npm run dev" },
    @{ name = "Dashboard Bank";          port = 2022; path = "$ROOT\apps\dashboard-bank";                     cmd = "npm run dev" },
    @{ name = "Dashboard Auditor";       port = 2023; path = "$ROOT\apps\dashboard-auditor";                  cmd = "npm run dev" },
    @{ name = "Institusi Pendidikan";    port = 2024; path = "$ROOT\apps\dashboard-institusi-pendidikan";     cmd = "npm run dev" },
    @{ name = "Dashboard APBD Lampung";  port = 2025; path = "$ROOT\apps\dashboard-apbd";                     cmd = "npm run dev" },
    @{ name = "Dashboard Admin";         port = 2026; path = "$ROOT\apps\dashboard-admin";                    cmd = "npm run dev" }
)

# Batasi penggunaan RAM per proses V8/Node agar tidak saling berebut memori
$env:NODE_OPTIONS = "--max-old-space-size=768"

foreach ($app in $apps) {
    if (Test-Path $app.path) {
        if (-not (Test-Path "$($app.path)\node_modules")) {
            Write-Host "      Memasang dependensi untuk $($app.name)..." -ForegroundColor Cyan
            Push-Location $app.path
            cmd.exe /c "npm install --silent"
            Pop-Location
        }
        Write-Host "      Memulai $($app.name) pada port $($app.port)..."
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c $($app.cmd)" -WorkingDirectory $app.path -WindowStyle Minimized
        # Staggered 5 detik: agar Turbopack setiap app tidak berebut I/O disk saat startup
        Write-Host "      (jeda 5 detik sebelum meluncurkan app berikutnya...)" -ForegroundColor DarkGray
        Start-Sleep 5
    }
}

# --- 6. Verifikasi Kesehatan & Pemanasan Halaman Web (Warm-up) ---
Write-Host "`n[6/6] Memverifikasi status kesehatan dan memanaskan portal web..." -ForegroundColor Yellow
Write-Host "      (Next.js sedang mengompilasi halaman web untuk pertama kali, mohon tunggu sebentar...)" -ForegroundColor Gray

$allPortsList = @(
    @{ name = "Portal Publik Civic-Tech"; port = 2019; url = "http://localhost:2019" },
    @{ name = "Transparansi Publik";     port = 2020; url = "http://localhost:2020" },
    @{ name = "Dashboard Kementerian";   port = 2021; url = "http://localhost:2021/dashboard" },
    @{ name = "Dashboard Bank";          port = 2022; url = "http://localhost:2022/dashboard" },
    @{ name = "Dashboard Auditor";       port = 2023; url = "http://localhost:2023/dashboard" },
    @{ name = "Institusi Pendidikan";    port = 2024; url = "http://localhost:2024/dashboard" },
    @{ name = "Dashboard APBD Lampung";  port = 2025; url = "http://localhost:2025/dashboard" },
    @{ name = "Dashboard Admin";         port = 2026; url = "http://localhost:2026" },
    @{ name = "Database PostgreSQL";     port = 2027; url = "postgresql://localhost:2027" },
    @{ name = "Proxy DB API Server";     port = 2028; url = "http://localhost:2028" }
)

$maxWaitSeconds = 45
$elapsed = 0

while ($elapsed -lt $maxWaitSeconds) {
    $conn = Get-NetTCPConnection -LocalPort 2020 -State Listen -ErrorAction SilentlyContinue
    if ($conn) { break }
    Start-Sleep 2
    $elapsed += 2
    Write-Host "      Menunggu server siap... ($elapsed / $maxWaitSeconds detik)" -ForegroundColor Gray
}

# Lakukan pemanasan HTTP pada portal utama (port 2020)
Write-Host "      Menunggu kompilasi halaman selesai (http://localhost:2020)..." -ForegroundColor Yellow
$ready = $false
for ($w = 0; $w -lt 25; $w++) {
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:2020" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {
        # Menunggu proses compile Turbopack
    }
    Start-Sleep 2
    Write-Host "      Sedang merender halaman... ($($w * 2 + 2) detik)" -ForegroundColor Gray
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host " STATUS SELURUH 10 SERVER DAN PORT:" -ForegroundColor Cyan
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
Write-Host "`n🚀 Membuka browser ke Portal Transparansi Publik (http://localhost:2020)..." -ForegroundColor Green
Start-Process "http://localhost:2020"

Write-Host "`n💡 PANDUAN PENTING UNTUK PENGGUNA:" -ForegroundColor Cyan
Write-Host "  1. Jangan tutup jendela terminal ini agar semua server tetap berjalan."
Write-Host "  2. Catatan Kompilasi: Saat pertama kali membuka halaman baru di browser,"
Write-Host "     Next.js memerlukan beberapa detik untuk memuat cache halaman."
Write-Host "  3. Untuk mematikan seluruh server dengan aman kapan saja, jalankan: stop-all.bat" -ForegroundColor Yellow
Write-Host "`nTekan Ctrl+C di terminal ini untuk menghentikan server.`n" -ForegroundColor Yellow

while ($true) {
    Start-Sleep 10
}
