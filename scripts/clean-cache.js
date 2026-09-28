const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

const apps = [
  'apps/transparansi-anggaran/apps/web-next',
  'apps/dashboard-kementerian',
  'apps/dashboard-bank',
  'apps/dashboard-auditor',
  'apps/dashboard-institusi-pendidikan',
  'apps/dashboard-apbd',
  'apps/dashboard-admin'
];

console.log('====================================================');
console.log(' Membersihkan Cache Next.js & Turbopack');
console.log('====================================================');

console.log('\n[1/3] Menghentikan proses dev server pada port 2020-2026...');
const ports = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
for (const p of ports) {
  try {
    const out = execSync(`netstat -ano | findstr :${p} | findstr LISTENING`, { encoding: 'utf8' });
    const lines = out.trim().split('\n');
    for (const l of lines) {
      const parts = l.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`      Dimatikan proses PID ${pid} pada port ${p}`);
        } catch (e) {}
      }
    }
  } catch (e) {
    // Port not in use
  }
}

console.log('\n[2/3] Menghapus folder .next di seluruh aplikasi...');
for (const app of apps) {
  const nextFolder = path.join(rootDir, app, '.next');
  if (fs.existsSync(nextFolder)) {
    try {
      fs.rmSync(nextFolder, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
      console.log(`  [✓] Berhasil dihapus: ${app}/.next`);
    } catch (err) {
      console.log(`  [!] Gagal menghapus ${app}/.next: ${err.message}`);
    }
  } else {
    console.log(`  [-] Folder .next tidak ditemukan: ${app}`);
  }
}

console.log('\n[3/3] Pembersihan cache selesai 100%!');
console.log('====================================================\n');
