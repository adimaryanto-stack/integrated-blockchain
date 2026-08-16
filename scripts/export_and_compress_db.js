const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

async function main() {
  const psqlDump = path.join(__dirname, '..', 'pgsql', 'bin', 'pg_dump.exe');
  const sqlFile = path.join(__dirname, '..', 'database_dump.sql');
  const gzFile = path.join(__dirname, '..', 'database_dump.sql.gz');

  console.log('[1/2] Running pg_dump from PostgreSQL (Port 2025)...');
  execSync(`"${psqlDump}" -U postgres -h 127.0.0.1 -p 2025 -d postgres --clean --if-exists -f "${sqlFile}"`, {
    env: { ...process.env, PGPASSWORD: 'postgres' }
  });
  console.log('      ✅ Dumped to database_dump.sql');

  console.log('[2/2] Compressing to database_dump.sql.gz (Level 9)...');
  const inp = fs.createReadStream(sqlFile);
  const out = fs.createWriteStream(gzFile);
  const gzip = zlib.createGzip({ level: 9 });

  await new Promise((resolve, reject) => {
    inp.pipe(gzip).pipe(out).on('finish', resolve).on('error', reject);
  });

  const stat = fs.statSync(gzFile);
  console.log(`      ✅ Compressed size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('🎉 Database dump ready for repository!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
