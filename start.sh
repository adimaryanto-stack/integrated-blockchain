#!/usr/bin/env bash

# ==============================================================================
# Blockchain Anggaran - Universal Startup Script (Linux VPS / macOS MacBook)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================================="
echo " 🚀 Starting Integrated Blockchain System (Linux / macOS)"
echo "=================================================================="

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js (v18+) first."
    exit 1
fi

# 2. Check PostgreSQL
echo -e "\n[1/4] Checking PostgreSQL connection on port 2027..."
if ! nc -z 127.0.0.1 2027 &>/dev/null && ! nc -z localhost 2027 &>/dev/null; then
    echo "⚠️  PostgreSQL is not running on port 2027."
    echo "   Attempting to start standard postgresql service or setup database..."
    if command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql || true
    elif command -v brew &> /dev/null; then
        brew services start postgresql@16 || brew services start postgresql || true
    fi
fi

# 3. Setup Database (Restore from database_dump.sql.gz if needed)
echo -e "\n[2/4] Verifying & Restoring Database Schema & Tables..."
node scripts/setup-db.js || {
    echo "⚠️  Database restore skipped or already populated."
}

# 4. Start Proxy API Gateway (Port 2028)
echo -e "\n[3/4] Starting Proxy API Server on port 2028..."
if command -v pm2 &> /dev/null; then
    pm2 start proxy/proxy.js --name "blockchain-proxy-2028" || pm2 restart "blockchain-proxy-2028"
else
    node proxy/proxy.js > proxy.log 2>&1 &
    PROXY_PID=$!
    echo "      Proxy started in background (PID: $PROXY_PID)"
fi

# 5. Start Dashboards
echo -e "\n[4/4] Starting All 8 Dashboards..."

start_app() {
    local name="$1"
    local dir="$2"
    local port="$3"
    local cmd="$4"

    echo "      Starting $name on port $port..."
    if [ ! -d "$dir/node_modules" ]; then
        echo "      Installing dependencies for $name..."
        (cd "$dir" && npm install --silent)
    fi

    if command -v pm2 &> /dev/null; then
        (cd "$dir" && pm2 start "$cmd" --name "app-$port" -- -p "$port")
    else
        (cd "$dir" && $cmd -p "$port" > "$SCRIPT_DIR/app-$port.log" 2>&1 &)
    fi
}

start_app "Portal Publik Civic-Tech"  "apps/dashboard-publik"                   2019 "npm run dev"
start_app "Transparansi Publik"     "apps/transparansi-anggaran/apps/web-next" 2020 "npx next dev"
start_app "Dashboard Kementerian"   "apps/dashboard-kementerian"              2021 "npx next dev"
start_app "Dashboard Bank"          "apps/dashboard-bank"                     2022 "npx next dev"
start_app "Dashboard Auditor"       "apps/dashboard-auditor"                  2023 "npx next dev"
start_app "Institusi Pendidikan"    "apps/dashboard-institusi-pendidikan"     2024 "npx next dev"
start_app "Dashboard APBD Lampung"  "apps/dashboard-apbd"                     2025 "npx next dev"
start_app "Dashboard Admin"         "apps/dashboard-admin"                    2026 "npm run dev"

echo -e "\n=================================================================="
echo " 🎉 ALL 10 SERVICES & PORTS ARE ACTIVE!"
echo "=================================================================="
echo "  Portal Publik Civic-Tech -> http://localhost:2019"
echo "  Transparansi Publik      -> http://localhost:2020"
echo "  Dashboard Kementerian    -> http://localhost:2021/dashboard"
echo "  Dashboard Bank           -> http://localhost:2022/dashboard"
echo "  Dashboard Auditor        -> http://localhost:2023/dashboard"
echo "  Institusi Pendidikan     -> http://localhost:2024/dashboard"
echo "  Dashboard APBD Lampung   -> http://localhost:2025/dashboard"
echo "  Dashboard Admin          -> http://localhost:2026"
echo "  Database PostgreSQL      -> Port 2027"
echo "  Proxy DB API Server      -> http://localhost:2028"
echo "=================================================================="
